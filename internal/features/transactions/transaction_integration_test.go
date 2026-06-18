package transactions_test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	payeDb "github.com/ttomsin/paye/internal/db"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/features/auth"
	"github.com/ttomsin/paye/internal/features/projects"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/transactions"
	"github.com/ttomsin/paye/internal/features/user"
	"github.com/ttomsin/paye/internal/features/webhooks"
	"github.com/ttomsin/paye/internal/middleware"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestEnvironment(t *testing.T) (*gorm.DB, *gin.Engine, string, *models.User, *models.Project, *transactions.TransactionService) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}

	err = payeDb.RunMigrations(db)
	if err != nil {
		t.Fatalf("failed to migrate database: %v", err)
	}

	hashedPassword, _ := auth.HashPassword("password123")
	apiKey := "paye_test_merchant_api_key_54321"
	testUser := &models.User{
		Name:     "Test Merchant",
		Email:    "merchant@example.com",
		Password: hashedPassword,
		PublicID: "paye_pub_test_12345",
	}
	if err := db.Create(testUser).Error; err != nil {
		t.Fatalf("failed to create test user: %v", err)
	}

	testProject := &models.Project{
		Name:         "Default Project",
		ApiKey:       "paye_live_merchant_api_key_54321",
		TestApiKey:   apiKey,
		PublicID:     "paye_pub_test_12345", // Mock public ID
		TestPublicID: "paye_pub_test_12345",
		UserID:       testUser.Base.ID,
	}
	if err := db.Create(testProject).Error; err != nil {
		t.Fatalf("failed to create test project: %v", err)
	}

	encryptionKey := "12345678901234567890123456789012" // 32 bytes

	userRepo := user.NewUserRepo(db)
	projectRepo := projects.NewProjectRepo(db)
	providerRepo := providers.NewProviderRepo(db)
	webhookRepo := webhooks.NewWebhookRepo(db)
	txRepo := transactions.NewTransactionRepo(db)

	authService := auth.NewAuthService(userRepo, projectRepo, "test_jwt_secret_key_32_bytes_long_xxxx")
	txService := transactions.NewTransactionService(txRepo, providerRepo, webhookRepo, encryptionKey)
	txHandler := transactions.NewTransactionHandler(txService)

	gin.SetMode(gin.TestMode)
	r := gin.Default()

	v1 := r.Group("/api/v1")
	apiKeyMiddleware := middleware.NewApiKeyMiddleware(authService)
	protected := v1.Group("")
	protected.Use(apiKeyMiddleware.Handle)

	transactions.RegisterRoutes(protected, txHandler)

	return db, r, apiKey, testUser, testProject, txService
}

func TestTransactionInitializeAndVerify(t *testing.T) {
	db, r, apiKey, _, testProject, txService := setupTestEnvironment(t)
	encryptionKey := "12345678901234567890123456789012"

	// 1. Create active ProviderConfig for Paystack
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

	// 2. Setup mock target payment server (Paystack)
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if req.Method == "POST" && req.URL.Path == "/transaction/initialize" {
			body, _ := io.ReadAll(req.Body)
			var initReq map[string]any
			json.Unmarshal(body, &initReq)

			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"status": true,
				"message": "Authorization URL created",
				"data": {
					"authorization_url": "https://checkout.paystack.com/xxxx",
					"access_code": "code_123",
					"reference": "` + initReq["reference"].(string) + `"
				}
			}`))
			return
		}

		if req.Method == "GET" && req.URL.Path == "/transaction/verify/test_ref_123" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"status": true,
				"message": "Verification successful",
				"data": {
					"status": "success",
					"reference": "test_ref_123",
					"amount": 10000,
					"currency": "NGN",
					"customer": {
						"email": "customer@example.com"
					}
				}
			}`))
			return
		}

		w.WriteHeader(http.StatusBadRequest)
	}))
	defer mockServer.Close()

	// Inject the mock server BaseURL
	txService.SetPaystackBaseURL(mockServer.URL)

	// 3. Initialize Transaction
	initReq := dto.InitializeTransactionRequest{
		Amount:    100.0,
		Email:     "customer@example.com",
		Currency:  "NGN",
		Reference: "test_ref_123",
		Provider:  "paystack",
	}
	body, _ := json.Marshal(initReq)
	req := httptest.NewRequest("POST", "/api/v1/transactions/initialize", bytes.NewBuffer(body))
	req.Header.Set("X-Paye-API-Key", apiKey)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected init status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var initResp map[string]any
	json.Unmarshal(w.Body.Bytes(), &initResp)
	initData := initResp["data"].(map[string]any)

	if initData["reference"].(string) != "test_ref_123" {
		t.Errorf("Expected reference 'test_ref_123', got '%s'", initData["reference"])
	}
	if initData["authorization_url"].(string) != "https://checkout.paystack.com/xxxx" {
		t.Errorf("Expected authorization_url, got '%v'", initData["authorization_url"])
	}

	// Verify record was written to DB
	var txRecord models.Transaction
	err := db.First(&txRecord, "reference = ?", "test_ref_123").Error
	if err != nil {
		t.Fatalf("Failed to find transaction in DB: %v", err)
	}
	if txRecord.Status != "pending" {
		t.Errorf("Expected status to be pending, got %s", txRecord.Status)
	}

	// 4. Verify Transaction
	req = httptest.NewRequest("GET", "/api/v1/transactions/verify/test_ref_123", nil)
	req.Header.Set("X-Paye-API-Key", apiKey)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected verify status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var verifyResp map[string]any
	json.Unmarshal(w.Body.Bytes(), &verifyResp)
	verifyData := verifyResp["data"].(map[string]any)

	if verifyData["status"].(string) != "success" {
		t.Errorf("Expected status success, got %v", verifyData["status"])
	}
	if verifyData["amount"].(float64) != 100.0 {
		t.Errorf("Expected amount 100.0, got %v", verifyData["amount"])
	}

	// Verify database status is updated
	db.First(&txRecord, "reference = ?", "test_ref_123")
	if txRecord.Status != "success" {
		t.Errorf("Expected DB status success, got %s", txRecord.Status)
	}

	// 5. Test authorization check
	req = httptest.NewRequest("GET", "/api/v1/transactions/verify/test_ref_123", nil)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401 for missing API Key, got %d", w.Code)
	}

	req = httptest.NewRequest("GET", "/api/v1/transactions/verify/test_ref_123", nil)
	req.Header.Set("X-Paye-API-Key", "invalid_api_key")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401 for invalid API Key, got %d", w.Code)
	}
}

type mockRoundTripper func(req *http.Request) *http.Response

func (f mockRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req), nil
}

func TestOPayTransactionWebhookInjection(t *testing.T) {
	db, r, apiKey, _, testProject, _ := setupTestEnvironment(t)
	encryptionKey := "12345678901234567890123456789012"

	// 1. Create active ProviderConfig for OPay
	encSecretKey, _ := crypto.Encrypt("opay_secret_key_123", encryptionKey)
	encPublicKey, _ := crypto.Encrypt("opay_public_key_123", encryptionKey)

	provConfig := &models.ProviderConfig{
		Label:        "opay-main",
		ProviderName: "opay",
		SecretKey:    encSecretKey,
		PublicKey:    encPublicKey,
		IsActive:     true,
		ProjectID:    testProject.Base.ID,
		Metadata:     map[string]string{"merchant_id": "12345"},
	}
	db.Create(provConfig)

	// 2. Create WebhookConfig for OPay
	webhookConfig := &models.WebhookConfig{
		ProviderName:    "opay",
		TargetURL:       "http://mymerchant.com/webhook",
		PayeWebhookSlug: "opay-slug-xyz",
		ProjectID:       testProject.Base.ID,
	}
	db.Create(webhookConfig)

	// 3. Setup mock transport for http.DefaultClient
	oldTransport := http.DefaultClient.Transport
	defer func() {
		http.DefaultClient.Transport = oldTransport
	}()

	var capturedCallbackURL string
	http.DefaultClient.Transport = mockRoundTripper(func(req *http.Request) *http.Response {
		if req.Method == "POST" && strings.HasSuffix(req.URL.Path, "/api/v1/international/cashier/create") {
			bodyBytes, _ := io.ReadAll(req.Body)
			var bodyMap map[string]any
			json.Unmarshal(bodyBytes, &bodyMap)
			if cb, ok := bodyMap["callbackUrl"].(string); ok {
				capturedCallbackURL = cb
			}

			// return mock response
			respJSON := `{
				"code": "00000",
				"message": "SUCCESS",
				"data": {
					"reference": "opay_ref_123",
					"orderNo": "order_123",
					"cashierUrl": "https://testapi.opaycheckout.com/cashier/123",
					"status": "INITIAL",
					"amount": {
						"total": 10000,
						"currency": "NGN"
					}
				}
			}`
			return &http.Response{
				StatusCode: http.StatusOK,
				Body:       io.NopCloser(strings.NewReader(respJSON)),
				Header:     make(http.Header),
			}
		}
		return &http.Response{
			StatusCode: http.StatusBadRequest,
			Body:       io.NopCloser(strings.NewReader("")),
		}
	})

	// 4. Call Initialize Transaction
	initReq := dto.InitializeTransactionRequest{
		Amount:      100.0,
		Email:       "customer@example.com",
		Currency:    "NGN",
		Reference:   "opay_ref_123",
		Provider:    "opay",
		CallbackURL: "http://mymerchant.com/return",
	}
	body, _ := json.Marshal(initReq)
	req := httptest.NewRequest("POST", "/api/v1/transactions/initialize", bytes.NewBuffer(body))
	req.Header.Set("X-Paye-API-Key", apiKey)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	expectedCallbackURL := "https://api.paye.africa/api/v1/webhooks/receive/opay-slug-xyz"
	if capturedCallbackURL != expectedCallbackURL {
		t.Errorf("Expected callback URL '%s', got '%s'", expectedCallbackURL, capturedCallbackURL)
	}
}

func TestPendingTransactionPolling(t *testing.T) {
	db, _, _, _, testProject, txService := setupTestEnvironment(t)
	encryptionKey := "12345678901234567890123456789012"

	// 1. Create active ProviderConfig for Paystack
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

	// 2. Setup mock target payment server (Paystack)
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if req.Method == "GET" && req.URL.Path == "/transaction/verify/test_polling_ref" {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"status": true,
				"message": "Verification successful",
				"data": {
					"status": "success",
					"reference": "test_polling_ref",
					"amount": 50000,
					"currency": "NGN",
					"customer": {
						"email": "customer@example.com"
					}
				}
			}`))
			return
		}
		w.WriteHeader(http.StatusBadRequest)
	}))
	defer mockServer.Close()

	// Inject the mock server BaseURL
	txService.SetPaystackBaseURL(mockServer.URL)

	// 3. Create a pending transaction in DB
	txRecord := &models.Transaction{
		ProjectID: testProject.Base.ID,
		Provider:  "paystack",
		Reference: "test_polling_ref",
		Amount:    500.0,
		Currency:  "NGN",
		Email:     "customer@example.com",
		Status:    "pending",
	}
	if err := db.Create(txRecord).Error; err != nil {
		t.Fatalf("Failed to create mock pending transaction: %v", err)
	}

	// 4. Move its created_at timestamp back 10 minutes (so it falls in the 5m - 24h window)
	tenMinutesAgo := time.Now().Add(-10 * time.Minute)
	if err := db.Model(txRecord).Update("created_at", tenMinutesAgo).Error; err != nil {
		t.Fatalf("Failed to backdate transaction: %v", err)
	}

	// 5. Run PollPendingTransactions
	err := txService.PollPendingTransactions(context.Background())
	if err != nil {
		t.Fatalf("PollPendingTransactions failed: %v", err)
	}

	// 6. Verify that transaction status is updated in DB to success
	var updatedTx models.Transaction
	if err := db.First(&updatedTx, "reference = ?", "test_polling_ref").Error; err != nil {
		t.Fatalf("Failed to find updated transaction: %v", err)
	}

	if updatedTx.Status != "success" {
		t.Errorf("Expected status to be updated to 'success', got '%s'", updatedTx.Status)
	}
}

