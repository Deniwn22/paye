package transactions

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/providers/flutterwave"
	"github.com/ttomsin/paye/internal/features/providers/nomba"
	"github.com/ttomsin/paye/internal/features/providers/paystack"
	"github.com/ttomsin/paye/internal/middleware"
	"github.com/ttomsin/paye/internal/models"
	"github.com/ttomsin/paye/pkg/paye"
)

type TransactionService struct {
	repo            *TransactionRepo
	providerRepo    *providers.ProviderRepo
	encryptionKey   string
	paystackBaseURL string
}

func NewTransactionService(repo *TransactionRepo, providerRepo *providers.ProviderRepo, encryptionKey string) *TransactionService {
	return &TransactionService{
		repo:          repo,
		providerRepo:  providerRepo,
		encryptionKey: encryptionKey,
	}
}

// SetPaystackBaseURL sets the base URL for testing mock HTTP servers
func (s *TransactionService) SetPaystackBaseURL(url string) {
	s.paystackBaseURL = url
}

// InitializeTransaction initializes a transaction with the selected provider, registers it on the paye client, and stores it in the database
func (s *TransactionService) InitializeTransaction(ctx context.Context, projectID string, req *dto.InitializeTransactionRequest) (*dto.InitializeTransactionResponse, error) {
	pID, err := uuid.Parse(projectID)
	if err != nil {
		return nil, fmt.Errorf("invalid project ID: %w", err)
	}

	reference := req.Reference
	if reference == "" {
		reference = "paye_ref_" + uuid.New().String()
	}

	pc, err := s.providerRepo.FindActiveProvider(ctx, projectID, req.Provider)
	if err != nil {
		return nil, fmt.Errorf("active provider config not found: %w", err)
	}

	isLive := middleware.GetIsLiveFromContext(ctx)
	encSecret, _ := pc.GetKeysForMode(isLive)

	decryptedSecret, err := crypto.Decrypt(encSecret, s.encryptionKey)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt provider secret key: %w", err)
	}

	client := paye.NewClient()

	var providerClient providers.Provider
	switch req.Provider {
	case "paystack":
		pClient := paystack.New(decryptedSecret)
		if s.paystackBaseURL != "" {
			pClient.BaseURL = s.paystackBaseURL
		}
		providerClient = pClient
	case "flutterwave":
		fClient := flutterwave.New(decryptedSecret)
		if s.paystackBaseURL != "" { // reusing base url override mechanism just in case
			fClient.BaseURL = s.paystackBaseURL
		}
		providerClient = fClient
	case "nomba":
		decryptedPublic, _ := crypto.Decrypt(pc.LivePublicKey, s.encryptionKey)
		if !isLive {
			decryptedPublic, _ = crypto.Decrypt(pc.TestPublicKey, s.encryptionKey)
		}
		accountID := pc.Metadata["account_id"]
		nClient := nomba.New(decryptedPublic, decryptedSecret, accountID)
		if s.paystackBaseURL != "" {
			nClient.SetBaseURL(s.paystackBaseURL)
		}
		providerClient = nClient
	default:
		return nil, fmt.Errorf("unsupported provider: %s", req.Provider)
	}

	client.RegisterProvider(providerClient)

	p, ok := client.GiveMe(req.Provider)
	if !ok {
		return nil, fmt.Errorf("provider failed to register in paye client")
	}

	pReq := providers.TransactionRequest{
		Amount:    req.Amount,
		Email:     req.Email,
		Currency:  req.Currency,
		Reference: reference,
	}

	resp, err := p.InitializeTransaction(pReq)
	if err != nil {
		return nil, fmt.Errorf("payment gateway error: %w", err)
	}

	rawRespBytes, _ := json.Marshal(resp)

	tx := &models.Transaction{
		ProjectID:   pID,
		Provider:    req.Provider,
		Reference:   reference,
		Amount:      req.Amount,
		Currency:    req.Currency,
		Email:       req.Email,
		Status:      "pending",
		AuthURL:     resp.AuthURL,
		Metadata:    resp.Metadata,
		RawResponse: string(rawRespBytes),
		IsLive:      isLive,
	}

	createdTx, err := s.repo.CreateTransaction(ctx, tx)
	if err != nil {
		return nil, fmt.Errorf("failed to save transaction: %w", err)
	}

	return dto.ToInitializeTransactionResponse(createdTx, resp.Message), nil
}

// VerifyTransaction checks the status of a transaction on the provider, registers it on the paye client, and updates it in the database
func (s *TransactionService) VerifyTransaction(ctx context.Context, projectID string, reference string) (*dto.VerifyTransactionResponse, error) {
	tx, err := s.repo.FindTransactionByRef(ctx, reference, projectID)
	if err != nil {
		return nil, fmt.Errorf("transaction not found: %w", err)
	}

	pc, err := s.providerRepo.FindActiveProvider(ctx, projectID, tx.Provider)
	if err != nil {
		return nil, fmt.Errorf("active provider config not found: %w", err)
	}

	encSecret, _ := pc.GetKeysForMode(tx.IsLive)

	decryptedSecret, err := crypto.Decrypt(encSecret, s.encryptionKey)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt provider secret key: %w", err)
	}

	client := paye.NewClient()

	var providerClient providers.Provider
	switch tx.Provider {
	case "paystack":
		pClient := paystack.New(decryptedSecret)
		if s.paystackBaseURL != "" {
			pClient.BaseURL = s.paystackBaseURL
		}
		providerClient = pClient
	case "flutterwave":
		fClient := flutterwave.New(decryptedSecret)
		if s.paystackBaseURL != "" {
			fClient.BaseURL = s.paystackBaseURL
		}
		providerClient = fClient
	case "nomba":
		decryptedPublic, _ := crypto.Decrypt(pc.LivePublicKey, s.encryptionKey)
		if !tx.IsLive {
			decryptedPublic, _ = crypto.Decrypt(pc.TestPublicKey, s.encryptionKey)
		}
		accountID := pc.Metadata["account_id"]
		nClient := nomba.New(decryptedPublic, decryptedSecret, accountID)
		if s.paystackBaseURL != "" {
			nClient.SetBaseURL(s.paystackBaseURL)
		}
		providerClient = nClient
	default:
		return nil, fmt.Errorf("unsupported provider: %s", tx.Provider)
	}

	client.RegisterProvider(providerClient)

	p, ok := client.GiveMe(tx.Provider)
	if !ok {
		return nil, fmt.Errorf("provider failed to register in paye client")
	}

	resp, err := p.VerifyTransaction(reference)
	if err != nil {
		return nil, fmt.Errorf("payment gateway verification failed: %w", err)
	}

	rawRespBytes, _ := json.Marshal(resp)
	tx.RawResponse = string(rawRespBytes)

	if resp.Status {
		tx.Status = "success"
	} else {
		tx.Status = "failed"
	}

	if resp.AuthorizationCode != "" {
		tx.AuthorizationCode = resp.AuthorizationCode
	}

	err = s.repo.UpdateTransaction(ctx, tx)
	if err != nil {
		return nil, fmt.Errorf("failed to update transaction status: %w", err)
	}

	return dto.ToVerifyTransactionResponse(tx, resp.Message), nil
}

// ListTransactions retrieves a list of transaction DTOs for a project
func (s *TransactionService) ListTransactions(ctx context.Context, projectID string, limit int, offset int) ([]*dto.VerifyTransactionResponse, error) {
	isLive := middleware.GetIsLiveFromContext(ctx)
	txs, err := s.repo.ListTransactions(ctx, projectID, limit, offset, isLive)
	if err != nil {
		return nil, err
	}
	var res []*dto.VerifyTransactionResponse
	for _, tx := range txs {
		res = append(res, dto.ToVerifyTransactionResponse(tx, ""))
	}
	return res, nil
}

