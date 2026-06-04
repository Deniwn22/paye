package transactions_test

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/features/auth"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/transactions"
	"github.com/ttomsin/paye/internal/features/user"
	"github.com/ttomsin/paye/internal/middleware"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestEnvironment(t *testing.T) (*gorm.DB, *gin.Engine, string, *models.User, *transactions.TransactionService) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}

	err = db.AutoMigrate(&models.User{}, &models.ProviderConfig{}, &models.WebhookConfig{}, &models.WebhookLog{}, &models.Transaction{})
	if err != nil {
		t.Fatalf("failed to migrate database: %v", err)
	}

	hashedPassword, _ := auth.HashPassword("password123")
	apiKey := "paye_test_merchant_api_key_54321"
	testUser := &models.User{
		Name:     "Test Merchant",
		Email:    "merchant@example.com",
		Password: hashedPassword,
		ApiKey:   apiKey,
	}
	if err := db.Create(testUser).Error; err != nil {
		t.Fatalf("failed to create test user: %v", err)
	}

	encryptionKey := "12345678901234567890123456789012" // 32 bytes

	userRepo := user.NewUserRepo(db)
	providerRepo := providers.NewProviderRepo(db)
	txRepo := transactions.NewTransactionRepo(db)

	authService := auth.NewAuthService(userRepo, "test_jwt_secret_key_32_bytes_long_xxxx")
	txService := transactions.NewTransactionService(txRepo, providerRepo, encryptionKey)
	txHandler := transactions.NewTransactionHandler(txService)

	gin.SetMode(gin.TestMode)
	r := gin.Default()

	v1 := r.Group("/api/v1")
	apiKeyMiddleware := middleware.NewApiKeyMiddleware(authService)
	protected := v1.Group("")
	protected.Use(apiKeyMiddleware.Handle)

	transactions.RegisterRoutes(protected, txHandler)

	return db, r, apiKey, testUser, txService
}

func TestTransactionInitializeAndVerify(t *testing.T) {
	db, r, apiKey, testUser, txService := setupTestEnvironment(t)
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
		UserID:       testUser.ID,
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
