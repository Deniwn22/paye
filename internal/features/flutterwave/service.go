package flutterwave

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/providers/flutterwave"
	"github.com/ttomsin/paye/internal/middleware"
	"github.com/ttomsin/paye/internal/models"
)

type FlutterwaveService struct {
	repo               *FlutterwaveRepository
	providerRepo       *providers.ProviderRepo
	encryptionKey      string
	flutterwaveBaseURL string
}

func NewFlutterwaveService(repo *FlutterwaveRepository, providerRepo *providers.ProviderRepo, encryptionKey string) *FlutterwaveService {
	return &FlutterwaveService{
		repo:          repo,
		providerRepo:  providerRepo,
		encryptionKey: encryptionKey,
	}
}

// SetFlutterwaveBaseURL sets the base URL for testing mock HTTP servers
func (s *FlutterwaveService) SetFlutterwaveBaseURL(url string) {
	s.flutterwaveBaseURL = url
}

func (s *FlutterwaveService) getFlutterwaveClient(ctx context.Context, projectID string) (*flutterwave.Flutterwave, error) {
	pc, err := s.providerRepo.FindActiveProvider(ctx, projectID, "flutterwave")
	if err != nil {
		return nil, fmt.Errorf("active flutterwave provider config not found: %w", err)
	}

	isLive := middleware.GetIsLiveFromContext(ctx)
	encSecret, _ := pc.GetKeysForMode(isLive)

	decryptedSecret, err := crypto.Decrypt(encSecret, s.encryptionKey)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt flutterwave secret key: %w", err)
	}

	client := flutterwave.New(decryptedSecret)
	if s.flutterwaveBaseURL != "" {
		client.BaseURL = s.flutterwaveBaseURL
	}
	return client, nil
}

// Refund performs a transaction refund and persists the refund record
func (s *FlutterwaveService) Refund(ctx context.Context, projectID string, req providers.RefundRequest) (*providers.RefundResponse, error) {
	// Business logic: don't allow a refund if the transaction doesn't exist
	tx, err := s.repo.FindTransactionByRef(ctx, projectID, req.TransactionReference)
	if err != nil {
		return nil, fmt.Errorf("transaction not found or not owned by project: %w", err)
	}
	if tx == nil {
		return nil, fmt.Errorf("transaction not found")
	}

	client, err := s.getFlutterwaveClient(ctx, projectID)
	if err != nil {
		return nil, err
	}

	resp, err := client.RefundTransaction(req)
	if err != nil {
		return nil, err
	}

	pID, err := uuid.Parse(projectID)
	if err != nil {
		return nil, err
	}

	refund := &models.Refund{
		ProjectID:            pID,
		TransactionReference: req.TransactionReference,
		Amount:               resp.Amount,
		Currency:             resp.Currency,
		CustomerNote:         req.CustomerNote,
		MerchantNote:         req.MerchantNote,
		Status:               "success",
		RawResponse:          fmt.Sprintf("Status: %t, Message: %s", resp.Status, resp.Message),
		IsLive:               tx.IsLive,
	}

	_, err = s.repo.CreateRefund(ctx, refund)
	if err != nil {
		return nil, fmt.Errorf("failed to persist refund: %w", err)
	}

	return resp, nil
}

// CreateTransferRecipient creates a transfer recipient on Flutterwave and persists the recipient details
func (s *FlutterwaveService) CreateTransferRecipient(ctx context.Context, projectID string, req providers.TransferRecipientRequest) (*providers.TransferRecipientResponse, error) {
	client, err := s.getFlutterwaveClient(ctx, projectID)
	if err != nil {
		return nil, err
	}

	resp, err := client.CreateTransferRecipient(req)
	if err != nil {
		return nil, err
	}

	pID, err := uuid.Parse(projectID)
	if err != nil {
		return nil, err
	}

	recipient := &models.TransferRecipient{
		ProjectID:     pID,
		Name:          req.Name,
		AccountNumber: req.AccountNumber,
		BankCode:      req.BankCode,
		Currency:      req.Currency,
		RecipientCode: resp.RecipientCode,
		Provider:      "flutterwave",
		IsLive:        middleware.GetIsLiveFromContext(ctx),
	}

	_, err = s.repo.CreateTransferRecipient(ctx, recipient)
	if err != nil {
		return nil, fmt.Errorf("failed to persist transfer recipient: %w", err)
	}

	return resp, nil
}

// InitiateTransfer initiates a balance transfer on Flutterwave and persists the transfer record
func (s *FlutterwaveService) InitiateTransfer(ctx context.Context, projectID string, req providers.TransferRequest) (*providers.TransferResponse, error) {
	client, err := s.getFlutterwaveClient(ctx, projectID)
	if err != nil {
		return nil, err
	}

	resp, err := client.InitiateTransfer(req)
	if err != nil {
		return nil, err
	}

	pID, err := uuid.Parse(projectID)
	if err != nil {
		return nil, err
	}

	transfer := &models.Transfer{
		ProjectID:     pID,
		RecipientCode: req.RecipientCode,
		Amount:        resp.Amount,
		Currency:      resp.Currency,
		Reason:        req.Reason,
		Reference:     resp.Reference,
		TransferCode:  resp.TransferCode,
		Status:        "success",
		Provider:      "flutterwave",
		IsLive:        middleware.GetIsLiveFromContext(ctx),
	}
	if !resp.Status {
		transfer.Status = "failed"
	}

	_, err = s.repo.CreateTransfer(ctx, transfer)
	if err != nil {
		return nil, fmt.Errorf("failed to persist transfer: %w", err)
	}

	return resp, nil
}

// CreatePlan creates a subscription plan on Flutterwave and persists the plan details
func (s *FlutterwaveService) CreatePlan(ctx context.Context, projectID string, req providers.PlanRequest) (*providers.PlanResponse, error) {
	client, err := s.getFlutterwaveClient(ctx, projectID)
	if err != nil {
		return nil, err
	}

	resp, err := client.CreatePlan(req)
	if err != nil {
		return nil, err
	}

	pID, err := uuid.Parse(projectID)
	if err != nil {
		return nil, err
	}

	plan := &models.Plan{
		ProjectID:   pID,
		PlanCode:    resp.PlanCode,
		Name:        resp.Name,
		Amount:      resp.Amount,
		Interval:    resp.Interval,
		Currency:    req.Currency,
		Description: req.Description,
		Provider:    "flutterwave",
		IsLive:      middleware.GetIsLiveFromContext(ctx),
	}

	_, err = s.repo.CreatePlan(ctx, plan)
	if err != nil {
		return nil, fmt.Errorf("failed to persist plan: %w", err)
	}

	return resp, nil
}

// CreateSubscription creates a subscription on Flutterwave and persists the subscription record
func (s *FlutterwaveService) CreateSubscription(ctx context.Context, projectID string, req providers.SubscriptionRequest) (*providers.SubscriptionResponse, error) {
	// Business logic: don't allow duplicate active subscriptions for the same customer+plan
	existing, err := s.repo.FindActiveSubscription(ctx, projectID, req.CustomerEmail, req.PlanCode)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("active subscription already exists for customer %s on plan %s", req.CustomerEmail, req.PlanCode)
	}

	client, err := s.getFlutterwaveClient(ctx, projectID)
	if err != nil {
		return nil, err
	}

	resp, err := client.CreateSubscription(req)
	if err != nil {
		return nil, err
	}

	pID, err := uuid.Parse(projectID)
	if err != nil {
		return nil, err
	}

	sub := &models.Subscription{
		ProjectID:        pID,
		SubscriptionCode: resp.SubscriptionCode,
		CustomerEmail:    resp.CustomerEmail,
		PlanCode:         resp.PlanCode,
		Status:           "active",
		Authorization:    req.Authorization,
		StartDate:        time.Now(),
		Provider:         "flutterwave",
		IsLive:           middleware.GetIsLiveFromContext(ctx),
	}

	_, err = s.repo.CreateSubscription(ctx, sub)
	if err != nil {
		return nil, fmt.Errorf("failed to persist subscription: %w", err)
	}

	return resp, nil
}

// CancelSubscription cancels an active subscription on Flutterwave and updates the local record status
func (s *FlutterwaveService) CancelSubscription(ctx context.Context, projectID string, subscriptionCode string, emailToken string) error {
	// Business logic: verify subscription exists and is active
	sub, err := s.repo.FindSubscriptionByCode(ctx, projectID, subscriptionCode)
	if err != nil {
		return fmt.Errorf("subscription not found: %w", err)
	}
	if sub.Status != "active" {
		return fmt.Errorf("subscription is not active (current status: %s)", sub.Status)
	}

	client, err := s.getFlutterwaveClient(ctx, projectID)
	if err != nil {
		return err
	}

	err = client.CancelSubscription(subscriptionCode, emailToken)
	if err != nil {
		return err
	}

	sub.Status = "cancelled"
	err = s.repo.UpdateSubscription(ctx, sub)
	if err != nil {
		return fmt.Errorf("failed to update subscription status: %w", err)
	}

	return nil
}

// ListRefunds lists refunds scoped by projectID
func (s *FlutterwaveService) ListRefunds(ctx context.Context, projectID string) ([]*models.Refund, error) {
	return s.repo.ListRefunds(ctx, projectID)
}

// ListTransferRecipients lists recipients scoped by projectID
func (s *FlutterwaveService) ListTransferRecipients(ctx context.Context, projectID string) ([]*models.TransferRecipient, error) {
	return s.repo.ListTransferRecipients(ctx, projectID)
}

// ListTransfers lists transfers scoped by projectID
func (s *FlutterwaveService) ListTransfers(ctx context.Context, projectID string) ([]*models.Transfer, error) {
	return s.repo.ListTransfers(ctx, projectID)
}

// ListPlans lists subscription plans scoped by projectID
func (s *FlutterwaveService) ListPlans(ctx context.Context, projectID string) ([]*models.Plan, error) {
	return s.repo.ListPlans(ctx, projectID)
}

// ListSubscriptions lists customer subscriptions scoped by projectID
func (s *FlutterwaveService) ListSubscriptions(ctx context.Context, projectID string) ([]*models.Subscription, error) {
	return s.repo.ListSubscriptions(ctx, projectID)
}
