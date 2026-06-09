package providers_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type mockPaystackServiceClient struct {
	db                   *gorm.DB
	createRecipientFunc  func(ctx context.Context, projectID string, req providers.TransferRecipientRequest) (*providers.TransferRecipientResponse, error)
	initiateTransferFunc func(ctx context.Context, projectID string, req providers.TransferRequest) (*providers.TransferResponse, error)
}

func (m *mockPaystackServiceClient) Refund(ctx context.Context, projectID string, req providers.RefundRequest) (*providers.RefundResponse, error) {
	return nil, nil
}
func (m *mockPaystackServiceClient) CreateTransferRecipient(ctx context.Context, projectID string, req providers.TransferRecipientRequest) (*providers.TransferRecipientResponse, error) {
	if m.createRecipientFunc != nil {
		return m.createRecipientFunc(ctx, projectID, req)
	}
	pID, _ := uuid.Parse(projectID)
	recipient := &models.TransferRecipient{
		ProjectID:     pID,
		Name:          req.Name,
		AccountNumber: req.AccountNumber,
		BankCode:      req.BankCode,
		Currency:      req.Currency,
		RecipientCode: "RCP_mock_123",
		Provider:      "paystack",
	}
	if m.db != nil {
		m.db.Create(recipient)
	}
	return &providers.TransferRecipientResponse{Status: true, RecipientCode: "RCP_mock_123", Provider: "paystack"}, nil
}
func (m *mockPaystackServiceClient) InitiateTransfer(ctx context.Context, projectID string, req providers.TransferRequest) (*providers.TransferResponse, error) {
	if m.initiateTransferFunc != nil {
		return m.initiateTransferFunc(ctx, projectID, req)
	}
	return &providers.TransferResponse{Status: true, TransferCode: "TRF_mock_123", Reference: req.Reference, Provider: "paystack"}, nil
}
func (m *mockPaystackServiceClient) CreatePlan(ctx context.Context, projectID string, req providers.PlanRequest) (*providers.PlanResponse, error) {
	return nil, nil
}
func (m *mockPaystackServiceClient) CreateSubscription(ctx context.Context, projectID string, req providers.SubscriptionRequest) (*providers.SubscriptionResponse, error) {
	return nil, nil
}
func (m *mockPaystackServiceClient) CancelSubscription(ctx context.Context, projectID string, subscriptionCode string, emailToken string) error {
	return nil
}
func (m *mockPaystackServiceClient) ListRefunds(ctx context.Context, projectID string) ([]*models.Refund, error) {
	return nil, nil
}
func (m *mockPaystackServiceClient) ListTransferRecipients(ctx context.Context, projectID string) ([]*models.TransferRecipient, error) {
	return nil, nil
}
func (m *mockPaystackServiceClient) ListTransfers(ctx context.Context, projectID string) ([]*models.Transfer, error) {
	return nil, nil
}
func (m *mockPaystackServiceClient) ListPlans(ctx context.Context, projectID string) ([]*models.Plan, error) {
	return nil, nil
}
func (m *mockPaystackServiceClient) ListSubscriptions(ctx context.Context, projectID string) ([]*models.Subscription, error) {
	return nil, nil
}

func setupTestEnvironment(t *testing.T) (*gorm.DB, *providers.ProviderRepo, *providers.ProviderService, string) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}

	err = db.AutoMigrate(
		&models.Project{},
		&models.ProviderConfig{},
		&models.TransferRecipient{},
		&models.Transfer{},
	)
	if err != nil {
		t.Fatalf("failed to migrate database: %v", err)
	}

	project := &models.Project{
		Name:     "Test Project",
		ApiKey:   "test_api_key_123",
		PublicID: "pub_123",
	}
	db.Create(project)

	providerRepo := providers.NewProviderRepo(db)
	providerService := providers.NewProviderService(providerRepo, "key", db)

	return db, providerRepo, providerService, project.Base.ID.String()
}

func TestTransferRoutingAndFallback(t *testing.T) {
	db, _, service, projectID := setupTestEnvironment(t)

	pID, _ := uuid.Parse(projectID)

	// 1. Create two active provider configs: flutterwave (fallback trigger) and paystack
	fwConfig := &models.ProviderConfig{
		Label:        "fw-test",
		ProviderName: "flutterwave",
		IsActive:     true,
		ProjectID:    pID,
	}
	db.Create(fwConfig)

	psConfig := &models.ProviderConfig{
		Label:        "ps-test",
		ProviderName: "paystack",
		IsActive:     true,
		ProjectID:    pID,
	}
	db.Create(psConfig)

	// 2. Set mock Paystack client
	mockPaystack := &mockPaystackServiceClient{db: db}
	service.SetPaystackService(mockPaystack)

	// Case A: Call with preferredProvider = "flutterwave".
	// Since flutterwave is unsupported in InitiateTransfer's switch, it will fail and fallback to paystack!
	req := providers.TransferRequest{
		Amount:           100.00,
		RecipientAccount: "1234567890",
		BankCode:         "058",
		Reason:           "Dynamic Routing Fallback Test",
		Currency:         "NGN",
		Provider:         "flutterwave", // preferred, but unsupported for execution -> will fallback to paystack
	}

	resp, err := service.InitiateTransfer(context.Background(), projectID, req)
	if err != nil {
		t.Fatalf("Expected fallback to succeed, but got error: %v", err)
	}

	if resp.Provider != "paystack" {
		t.Errorf("Expected fallback execution on paystack, got: %s", resp.Provider)
	}

	// Verify that a recipient was created dynamically for Paystack
	var recipient models.TransferRecipient
	err = db.First(&recipient, "project_id = ? AND provider = ?", pID, "paystack").Error
	if err != nil {
		t.Errorf("Expected Paystack transfer recipient record to be created dynamically, got error: %v", err)
	}
	if recipient.AccountNumber != "1234567890" {
		t.Errorf("Expected recipient account number 1234567890, got %s", recipient.AccountNumber)
	}

	// Case B: Fail all active providers
	// Mock paystack to return an error
	mockPaystack.initiateTransferFunc = func(ctx context.Context, pID string, r providers.TransferRequest) (*providers.TransferResponse, error) {
		return nil, errors.New("paystack transfer failed")
	}

	_, err = service.InitiateTransfer(context.Background(), projectID, req)
	if err == nil {
		t.Fatal("Expected transfer to fail when all active providers fail, got nil error")
	}
}
