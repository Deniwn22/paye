package transfers

import (
	"context"
	"fmt"
	"log/slog"
	"strings"

	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/features/projects"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/providers/flutterwave"
	"github.com/ttomsin/paye/internal/features/providers/nomba"
	"github.com/ttomsin/paye/internal/features/providers/opay"
	"github.com/ttomsin/paye/internal/features/providers/paystack"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
)

type TransferService struct {
	db            *gorm.DB
	providerRepo  *providers.ProviderRepo
	projectRepo   projects.IProjectRepo
	encryptionKey string
}

func NewTransferService(db *gorm.DB, providerRepo *providers.ProviderRepo, projectRepo projects.IProjectRepo, encryptionKey string) *TransferService {
	return &TransferService{
		db:            db,
		providerRepo:  providerRepo,
		projectRepo:   projectRepo,
		encryptionKey: encryptionKey,
	}
}

// getProviderClient instantiates a provider client given a config
func (s *TransferService) getProviderClient(config *models.ProviderConfig, isLive bool) (providers.Provider, error) {
	decryptedSecret, err := crypto.Decrypt(config.SecretKey, s.encryptionKey)
	if err != nil {
		return nil, err
	}

	switch config.ProviderName {
	case "paystack":
		return paystack.New(decryptedSecret), nil
	case "flutterwave":
		return flutterwave.New(decryptedSecret), nil
	case "nomba":
		// New(clientID, clientSecret, webhookSecret, accountID, subAccountID string, isLive bool)
		return nomba.New(decryptedSecret, decryptedSecret, "", config.ProjectID.String(), "", isLive), nil
	case "opay":
		// New(publicKey, secretKey, merchantID string, sandbox bool)
		return opay.New(decryptedSecret, decryptedSecret, decryptedSecret, !isLive), nil
	default:
		return nil, fmt.Errorf("unsupported provider: %s", config.ProviderName)
	}
}

func (s *TransferService) InitiateTransfer(ctx context.Context, projectID string, env string, req *TransferRequest) (*TransferResponse, error) {
	proj, err := s.projectRepo.FindByID(ctx, projectID)
	if err != nil {
		return nil, fmt.Errorf("project not found")
	}

	var chosenProviderClient providers.Provider
	var chosenProviderName string

	// Smart Routing Logic
	if proj.SmartPayoutsEnabled && req.Provider == "" {
		slog.Info("Smart Payouts Enabled: Checking balances across providers...")
		configs := s.providerRepo.ListProvidersByEnv(ctx, projectID, env)

		var bestClient providers.Provider
		var bestBalance float64 = -1
		var bestName string

		for _, config := range configs {
			client, err := s.getProviderClient(config, env == "live")
			if err != nil {
				continue
			}

			balanceResp, err := client.GetBalance()
			if err != nil {
				slog.Error("failed to get balance", "provider", config.ProviderName, "err", err)
				continue
			}

			slog.Info("Balance checked", "provider", config.ProviderName, "balance", balanceResp.AvailableBalance)

			if balanceResp.AvailableBalance >= req.Amount && balanceResp.AvailableBalance > bestBalance {
				bestBalance = balanceResp.AvailableBalance
				bestClient = client
				bestName = config.ProviderName
			}
		}

		if bestClient == nil {
			return nil, fmt.Errorf("smart payouts failed: no provider has sufficient funds for %f", req.Amount)
		}

		slog.Info("Smart Payouts Selected Provider", "provider", bestName)
		chosenProviderClient = bestClient
		chosenProviderName = bestName
	} else {
		// Standard Routing (Requested Provider or Default Active)
		var config *models.ProviderConfig
		var err error

		if req.Provider != "" {
			config, err = s.providerRepo.GetProviderByNameAndEnv(ctx, projectID, strings.ToLower(req.Provider), env)
		} else {
			config, err = s.providerRepo.GetActiveProvider(ctx, projectID, env)
		}

		if err != nil {
			return nil, fmt.Errorf("failed to determine provider: %w", err)
		}

		chosenProviderClient, err = s.getProviderClient(config, env == "live")
		if err != nil {
			return nil, fmt.Errorf("failed to init provider client: %w", err)
		}
		chosenProviderName = config.ProviderName
	}

	// 1. Create Recipient on the Chosen Provider dynamically
	recipientReq := providers.TransferRecipientRequest{
		Name:          req.AccountName,
		AccountNumber: req.AccountNumber,
		BankCode:      req.BankCode,
		Currency:      "NGN",
	}

	recResp, err := chosenProviderClient.CreateTransferRecipient(recipientReq)
	if err != nil {
		return nil, fmt.Errorf("failed to create recipient on %s: %w", chosenProviderName, err)
	}

	// Save Recipient to DB
	recipientRecord := &models.TransferRecipient{
		ProjectID:     proj.Base.ID,
		Name:          req.AccountName,
		AccountNumber: req.AccountNumber,
		BankCode:      req.BankCode,
		Currency:      "NGN",
		RecipientCode: recResp.RecipientCode,
		Provider:      chosenProviderName,
		IsLive:        env == "live",
	}
	s.db.WithContext(ctx).Create(recipientRecord)

	// 2. Initiate Transfer
	transferReference := "PTRF_" + uuid.New().String()[:16]
	trReq := providers.TransferRequest{
		Amount:           req.Amount,
		RecipientCode:    recResp.RecipientCode,
		RecipientAccount: req.AccountNumber,
		BankCode:         req.BankCode,
		Reason:           req.Reason,
		Reference:        transferReference,
		Currency:         "NGN",
		Provider:         chosenProviderName,
	}

	trResp, err := chosenProviderClient.InitiateTransfer(trReq)
	if err != nil {
		return nil, fmt.Errorf("failed to initiate transfer on %s: %w", chosenProviderName, err)
	}

	// Save Transfer to DB
	transferRecord := &models.Transfer{
		ProjectID:     proj.Base.ID,
		RecipientCode: recResp.RecipientCode,
		Amount:        req.Amount,
		Currency:      "NGN",
		Reason:        req.Reason,
		Reference:     transferReference,
		TransferCode:  trResp.TransferCode,
		Status:        "pending",
		Provider:      chosenProviderName,
		IsLive:        env == "live",
	}
	s.db.WithContext(ctx).Create(transferRecord)

	return &TransferResponse{
		TransferCode:  trResp.TransferCode,
		RecipientCode: recResp.RecipientCode,
		Amount:        req.Amount,
		Currency:      "NGN",
		Provider:      chosenProviderName,
		Status:        "pending",
		Reference:     transferReference,
	}, nil
}
