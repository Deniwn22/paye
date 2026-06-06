package paystack_test

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/features/paystack"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestEnvironment(t *testing.T) (*gorm.DB, *models.Project, *paystack.PaystackService) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}

	err = db.AutoMigrate(
		&models.Project{},
		&models.ProviderConfig{},
		&models.Transaction{},
		&models.Refund{},
		&models.TransferRecipient{},
		&models.Transfer{},
		&models.Plan{},
		&models.Subscription{},
	)
	if err != nil {
		t.Fatalf("failed to migrate database: %v", err)
	}

	testProject := &models.Project{
		Name:     "Test Project",
		ApiKey:   "paye_test_key_123",
		PublicID: "paye_pub_test_123",
	}
	if err := db.Create(testProject).Error; err != nil {
		t.Fatalf("failed to create test project: %v", err)
	}

	encryptionKey := "12345678901234567890123456789012" // 32 bytes

	// Create active ProviderConfig for Paystack
	rawSecretKey := "sk_test_paystack_secret_key_val_123"
	encSecretKey, _ := crypto.Encrypt(rawSecretKey, encryptionKey)
	encPublicKey, _ := crypto.Encrypt("pk_test_val", encryptionKey)

	provConfig := &models.ProviderConfig{
		Label:        "paystack-main",
		ProviderName: "paystack",
		SecretKey:    encSecretKey,
		PublicKey:    encPublicKey,
		IsActive:     true,
		ProjectID:    testProject.Base.ID,
	}
	db.Create(provConfig)

	paystackRepo := paystack.NewPaystackRepository(db)
	providerRepo := providers.NewProviderRepo(db)
	paystackService := paystack.NewPaystackService(paystackRepo, providerRepo, encryptionKey)

	return db, testProject, paystackService
}

func TestRefundTransaction(t *testing.T) {
	db, testProject, service := setupTestEnvironment(t)

	ref := "tx_ref_111"

	// 1. Attempt refund when transaction doesn't exist (should fail)
	_, err := service.Refund(nil, testProject.Base.ID.String(), providers.RefundRequest{
		TransactionReference: ref,
		Amount:               50.0,
		Currency:             "NGN",
	})
	if err == nil {
		t.Fatal("Expected error for non-existent transaction refund, got nil")
	}

	// 2. Create the transaction in DB
	tx := &models.Transaction{
		ProjectID: testProject.Base.ID,
		Provider:  "paystack",
		Reference: ref,
		Amount:    100.0,
		Currency:  "NGN",
		Email:     "buyer@example.com",
		Status:    "success",
	}
	db.Create(tx)

	// Setup Mock HTTP Server
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if req.Method == "POST" && req.URL.Path == "/refund" {
			body, _ := io.ReadAll(req.Body)
			var refReq map[string]any
			json.Unmarshal(body, &refReq)

			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"status": true,
				"message": "Refund successful",
				"data": {
					"transaction": "` + refReq["transaction"].(string) + `",
					"amount": 5000,
					"currency": "NGN"
				}
			}`))
			return
		}
		w.WriteHeader(http.StatusBadRequest)
	}))
	defer mockServer.Close()

	service.SetPaystackBaseURL(mockServer.URL)

	// 3. Perform Refund successfully
	resp, err := service.Refund(nil, testProject.Base.ID.String(), providers.RefundRequest{
		TransactionReference: ref,
		Amount:               50.0,
		Currency:             "NGN",
		CustomerNote:         "Refund test customer note",
		MerchantNote:         "Refund test merchant note",
	})
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	if !resp.Status {
		t.Error("Expected successful refund status")
	}
	if resp.Amount != 50.0 {
		t.Errorf("Expected refund amount 50.0, got %f", resp.Amount)
	}

	// Verify refund was written to DB
	var refundRecord models.Refund
	err = db.First(&refundRecord, "transaction_reference = ?", ref).Error
	if err != nil {
		t.Fatalf("Failed to find refund in DB: %v", err)
	}
	if refundRecord.Amount != 50.0 {
		t.Errorf("Expected DB refund amount 50.0, got %f", refundRecord.Amount)
	}
}

func TestCreateTransferRecipientAndTransfer(t *testing.T) {
	db, testProject, service := setupTestEnvironment(t)

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if req.Method == "POST" && req.URL.Path == "/transferrecipient" {
			w.WriteHeader(http.StatusCreated)
			w.Write([]byte(`{
				"status": true,
				"message": "Recipient created",
				"data": {
					"recipient_code": "RCP_222"
				}
			}`))
			return
		}
		if req.Method == "POST" && req.URL.Path == "/transfer" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"status": true,
				"message": "Transfer queued",
				"data": {
					"transfer_code": "TRF_333",
					"reference": "ref_999",
					"amount": 2000,
					"currency": "NGN"
				}
			}`))
			return
		}
		w.WriteHeader(http.StatusBadRequest)
	}))
	defer mockServer.Close()

	service.SetPaystackBaseURL(mockServer.URL)

	// Test recipient creation
	recResp, err := service.CreateTransferRecipient(nil, testProject.Base.ID.String(), providers.TransferRecipientRequest{
		Name:          "John Doe",
		AccountNumber: "0123456789",
		BankCode:      "058",
		Currency:      "NGN",
	})
	if err != nil {
		t.Fatalf("Unexpected error creating recipient: %v", err)
	}
	if recResp.RecipientCode != "RCP_222" {
		t.Errorf("Expected RCP_222, got %s", recResp.RecipientCode)
	}

	// Verify recipient persisted
	var recRecord models.TransferRecipient
	err = db.First(&recRecord, "recipient_code = ?", "RCP_222").Error
	if err != nil {
		t.Fatalf("Recipient not found in DB: %v", err)
	}

	// Test transfer initiation
	trfResp, err := service.InitiateTransfer(nil, testProject.Base.ID.String(), providers.TransferRequest{
		Amount:        20.0,
		RecipientCode: "RCP_222",
		Reason:        "Salary",
		Reference:     "ref_999",
		Currency:      "NGN",
	})
	if err != nil {
		t.Fatalf("Unexpected error initiating transfer: %v", err)
	}
	if trfResp.TransferCode != "TRF_333" {
		t.Errorf("Expected TRF_333, got %s", trfResp.TransferCode)
	}

	// Verify transfer persisted
	var trfRecord models.Transfer
	err = db.First(&trfRecord, "transfer_code = ?", "TRF_333").Error
	if err != nil {
		t.Fatalf("Transfer not found in DB: %v", err)
	}
}

func TestPlansAndSubscriptions(t *testing.T) {
	db, testProject, service := setupTestEnvironment(t)

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if req.Method == "POST" && req.URL.Path == "/plan" {
			w.WriteHeader(http.StatusCreated)
			w.Write([]byte(`{
				"status": true,
				"message": "Plan created",
				"data": {
					"plan_code": "PLN_444",
					"name": "Weekly Plan",
					"amount": 1000,
					"interval": "weekly"
				}
			}`))
			return
		}
		if req.Method == "POST" && req.URL.Path == "/subscription" {
			w.WriteHeader(http.StatusCreated)
			w.Write([]byte(`{
				"status": true,
				"message": "Subscription created",
				"data": {
					"subscription_code": "SUB_555",
					"customer": "subscriber@example.com",
					"plan": "PLN_444"
				}
			}`))
			return
		}
		if req.Method == "POST" && req.URL.Path == "/subscription/disable" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"status": true,
				"message": "Subscription disabled successfully"
			}`))
			return
		}
		w.WriteHeader(http.StatusBadRequest)
	}))
	defer mockServer.Close()

	service.SetPaystackBaseURL(mockServer.URL)

	// Create Plan
	planResp, err := service.CreatePlan(nil, testProject.Base.ID.String(), providers.PlanRequest{
		Name:     "Weekly Plan",
		Interval: "weekly",
		Amount:   10.0,
		Currency: "NGN",
	})
	if err != nil {
		t.Fatalf("Unexpected error creating plan: %v", err)
	}
	if planResp.PlanCode != "PLN_444" {
		t.Errorf("Expected PLN_444, got %s", planResp.PlanCode)
	}

	// Verify plan persisted
	var planRecord models.Plan
	err = db.First(&planRecord, "plan_code = ?", "PLN_444").Error
	if err != nil {
		t.Fatalf("Plan not found in DB: %v", err)
	}

	// Create Subscription
	subResp, err := service.CreateSubscription(nil, testProject.Base.ID.String(), providers.SubscriptionRequest{
		CustomerEmail: "subscriber@example.com",
		PlanCode:      "PLN_444",
	})
	if err != nil {
		t.Fatalf("Unexpected error creating subscription: %v", err)
	}
	if subResp.SubscriptionCode != "SUB_555" {
		t.Errorf("Expected SUB_555, got %s", subResp.SubscriptionCode)
	}

	// Verify subscription persisted as active
	var subRecord models.Subscription
	err = db.First(&subRecord, "subscription_code = ?", "SUB_555").Error
	if err != nil {
		t.Fatalf("Subscription not found in DB: %v", err)
	}
	if subRecord.Status != "active" {
		t.Errorf("Expected status active, got %s", subRecord.Status)
	}

	// Try to create duplicate active subscription (should fail)
	_, err = service.CreateSubscription(nil, testProject.Base.ID.String(), providers.SubscriptionRequest{
		CustomerEmail: "subscriber@example.com",
		PlanCode:      "PLN_444",
	})
	if err == nil {
		t.Fatal("Expected error for duplicate subscription, got nil")
	}

	// Cancel Subscription
	err = service.CancelSubscription(nil, testProject.Base.ID.String(), "SUB_555", "token_123")
	if err != nil {
		t.Fatalf("Unexpected error cancelling subscription: %v", err)
	}

	// Verify status updated to cancelled
	db.First(&subRecord, "subscription_code = ?", "SUB_555")
	if subRecord.Status != "cancelled" {
		t.Errorf("Expected status cancelled, got %s", subRecord.Status)
	}

	// Try to cancel again (should fail because it's no longer active)
	err = service.CancelSubscription(nil, testProject.Base.ID.String(), "SUB_555", "token_123")
	if err == nil {
		t.Fatal("Expected error when cancelling an already cancelled subscription, got nil")
	}
}
