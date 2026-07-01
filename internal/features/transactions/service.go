package transactions

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/features/notifications"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/providers/flutterwave"
	"github.com/ttomsin/paye/internal/features/providers/nomba"
	"github.com/ttomsin/paye/internal/features/providers/opay"
	"github.com/ttomsin/paye/internal/features/providers/paystack"
	"github.com/ttomsin/paye/internal/features/webhooks"
	"github.com/ttomsin/paye/internal/middleware"
	"github.com/ttomsin/paye/internal/models"
	"github.com/ttomsin/paye/pkg/paye"
)

type TransactionService struct {
	repo            *TransactionRepo
	providerRepo    *providers.ProviderRepo
	webhookRepo     *webhooks.WebhookRepo
	encryptionKey   string
	paystackBaseURL string
	notifier        *notifications.NotificationService
}

func NewTransactionService(repo *TransactionRepo, providerRepo *providers.ProviderRepo, webhookRepo *webhooks.WebhookRepo, encryptionKey string, notifier *notifications.NotificationService) *TransactionService {
	return &TransactionService{
		repo:          repo,
		providerRepo:  providerRepo,
		webhookRepo:   webhookRepo,
		encryptionKey: encryptionKey,
		notifier:      notifier,
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

	isLive := middleware.GetIsLiveFromContext(ctx)
	env := "test"
	if isLive {
		env = "live"
	}

	pc, err := s.providerRepo.GetActiveProvider(ctx, projectID, env)
	if err != nil {
		return nil, fmt.Errorf("active provider config not found: %w", err)
	}

	encSecret := pc.SecretKey

	decryptedSecret, err := crypto.Decrypt(encSecret, s.encryptionKey)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt provider secret key: %w", err)
	}

	client := paye.NewClient()

	var providerClient providers.Provider
	switch pc.ProviderName {
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
		decryptedPublic, _ := crypto.Decrypt(pc.PublicKey, s.encryptionKey)
		decryptedWebhookSecret, _ := crypto.Decrypt(pc.WebhookSecret, s.encryptionKey)
		accountID := pc.Metadata.NombaAccountID
		nClient := nomba.New(decryptedPublic, decryptedSecret, decryptedWebhookSecret, accountID, isLive)
		if s.paystackBaseURL != "" {
			nClient.SetBaseURL(s.paystackBaseURL)
		}
		providerClient = nClient
	case "opay":
		decryptedPublic, _ := crypto.Decrypt(pc.PublicKey, s.encryptionKey)
		merchantID := pc.Metadata.OpayAccountID
		oClient := opay.New(decryptedPublic, decryptedSecret, merchantID, !isLive)
		providerClient = oClient
	default:
		return nil, fmt.Errorf("unsupported provider: %s", pc.ProviderName)
	}

	client.RegisterProvider(providerClient)

	p, ok := client.GiveMe(pc.ProviderName)
	if !ok {
		return nil, fmt.Errorf("provider failed to register in paye client")
	}

	pReq := providers.TransactionRequest{
		Amount:      req.Amount,
		Email:       req.Email,
		Currency:    req.Currency,
		Reference:   reference,
		CallbackURL: req.CallbackURL,
	}

	if pc.ProviderName == "opay" {
		webhookConfig, err := s.webhookRepo.FindByProjectProviderAndEnv(ctx, projectID, "opay", env)
		if err != nil {
			slog.Warn("Failed to query OPay webhook config slug", "project_id", projectID, "error", err)
		} else if webhookConfig != nil {
			if pReq.Metadata == nil {
				pReq.Metadata = make(map[string]any)
			}
			baseURL := os.Getenv("WEBHOOK_BASE_URL")
			if baseURL == "" {
				baseURL = "https://api.paye.africa"
			}
			baseURL = strings.TrimSuffix(baseURL, "/")
			pReq.Metadata["webhook_url"] = baseURL + "/api/v1/webhooks/receive/" + webhookConfig.PayeWebhookSlug
		} else {
			slog.Warn("No OPay webhook config found for project", "project_id", projectID)
		}
	}

	resp, err := p.InitializeTransaction(pReq)
	if err != nil {
		return nil, fmt.Errorf("payment gateway error: %w", err)
	}

	rawRespBytes, _ := json.Marshal(resp)

	tx := &models.Transaction{
		ProjectID:   pID,
		Provider:    pc.ProviderName,
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

	env := "test"
	if tx.IsLive {
		env = "live"
	}

	pc, err := s.providerRepo.GetProviderByNameAndEnv(ctx, projectID, tx.Provider, env)
	if err != nil {
		return nil, fmt.Errorf("provider config not found: %w", err)
	}

	encSecret := pc.SecretKey

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
		decryptedPublic, _ := crypto.Decrypt(pc.PublicKey, s.encryptionKey)
		decryptedWebhookSecret, _ := crypto.Decrypt(pc.WebhookSecret, s.encryptionKey)
		accountID := pc.Metadata.NombaAccountID
		nClient := nomba.New(decryptedPublic, decryptedSecret, decryptedWebhookSecret, accountID, tx.IsLive)
		if s.paystackBaseURL != "" {
			nClient.SetBaseURL(s.paystackBaseURL)
		}
		providerClient = nClient
	case "opay":
		decryptedPublic, _ := crypto.Decrypt(pc.PublicKey, s.encryptionKey)
		merchantID := pc.Metadata.OpayAccountID
		oClient := opay.New(decryptedPublic, decryptedSecret, merchantID, !tx.IsLive)
		providerClient = oClient
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
	} else if resp.StatusText == string(providers.StatusPending) || resp.StatusText == string(providers.StatusInitial) {
		tx.Status = "pending"
	} else {
		tx.Status = "failed"
	}

	tx.TransactionStatus = resp.StatusText

	if resp.AuthorizationCode != "" {
		tx.AuthorizationCode = resp.AuthorizationCode
	}

	err = s.repo.UpdateTransaction(ctx, tx)
	if err != nil {
		return nil, fmt.Errorf("failed to update transaction status: %w", err)
	}

	verifyResp := dto.ToVerifyTransactionResponse(tx, resp.Message)
	if s.notifier != nil {
		title := "Transaction Pending"
		message := fmt.Sprintf("Transaction reference %s of %s %.2f is pending via %s.", tx.Reference, tx.Currency, tx.Amount, tx.Provider)
		if tx.Status == "success" {
			title = "Transaction Successful"
			message = fmt.Sprintf("Transaction reference %s of %s %.2f was successful via %s.", tx.Reference, tx.Currency, tx.Amount, tx.Provider)
		} else if tx.Status == "failed" {
			title = "Transaction Failed"
			message = fmt.Sprintf("Transaction reference %s of %s %.2f failed via %s.", tx.Reference, tx.Currency, tx.Amount, tx.Provider)
		}
		_ = s.notifier.CreateAndNotify(ctx, tx.ProjectID.String(), title, message, tx.Status, verifyResp)
	}

	return verifyResp, nil
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

// PollPendingTransactions queries the provider for all pending transactions created between 5 minutes and 24 hours ago, updating their statuses.
func (s *TransactionService) PollPendingTransactions(ctx context.Context) error {
	now := time.Now()
	startTime := now.Add(-24 * time.Hour)
	endTime := now.Add(-5 * time.Minute)

	txs, err := s.repo.FindOlderPendingTransactions(ctx, startTime, endTime)
	if err != nil {
		return fmt.Errorf("failed to fetch older pending transactions: %w", err)
	}

	for _, tx := range txs {
		slog.Info("Polling status for pending transaction", "reference", tx.Reference, "provider", tx.Provider)
		_, err := s.VerifyTransaction(ctx, tx.ProjectID.String(), tx.Reference)
		if err != nil {
			slog.Error("Failed to auto-verify transaction during polling", "reference", tx.Reference, "error", err)
		}
	}

	return nil
}
