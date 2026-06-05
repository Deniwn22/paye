package sdk_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/features/auth"
	"github.com/ttomsin/paye/internal/features/projects"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/sdk"
	"github.com/ttomsin/paye/internal/features/transactions"
	"github.com/ttomsin/paye/internal/features/user"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestEnvironment(t *testing.T) (*gorm.DB, *gin.Engine, string, *models.User, *transactions.TransactionService, *sdk.SDKHandler) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}

	err = db.AutoMigrate(&models.User{}, &models.Project{}, &models.ProviderConfig{}, &models.WebhookConfig{}, &models.WebhookLog{}, &models.Transaction{})
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
		PublicID: "paye_pub_test_12345",
	}
	if err := db.Create(testUser).Error; err != nil {
		t.Fatalf("failed to create test user: %v", err)
	}

	testProject := &models.Project{
		Name:     "Default Project",
		ApiKey:   testUser.ApiKey,
		PublicID: testUser.PublicID,
		UserID:   testUser.Base.ID,
	}
	if err := db.Create(testProject).Error; err != nil {
		t.Fatalf("failed to create test project: %v", err)
	}

	encryptionKey := "12345678901234567890123456789012" // 32 bytes

	userRepo := user.NewUserRepo(db)
	projectRepo := projects.NewProjectRepo(db)
	providerRepo := providers.NewProviderRepo(db)
	txRepo := transactions.NewTransactionRepo(db)

	txService := transactions.NewTransactionService(txRepo, providerRepo, encryptionKey)
	sdkHandler := sdk.NewSDKHandler(userRepo, projectRepo, providerRepo, txService, encryptionKey)

	// Create active providerconfig for Paystack with encrypted key
	encryptedSecret, _ := crypto.Encrypt("sk_test_paystack_secret_key", encryptionKey)
	encryptedPublic, _ := crypto.Encrypt("pk_test_paystack_public_key", encryptionKey)
	pc := &models.ProviderConfig{
		Label:        "paystack-test",
		ProviderName: "paystack",
		SecretKey:    encryptedSecret,
		PublicKey:    encryptedPublic,
		IsActive:     true,
		ProjectID:    testProject.Base.ID,
	}
	if err := db.Create(pc).Error; err != nil {
		t.Fatalf("failed to create provider config: %v", err)
	}

	gin.SetMode(gin.TestMode)
	r := gin.Default()

	// Register routes on the router
	r.GET("/sdk/:publicId", sdkHandler.ServeSDK)
	v1 := r.Group("/api/v1")
	v1.POST("/sdk/transactions/initialize", sdkHandler.InitializeSDKTransaction)

	return db, r, encryptionKey, testUser, txService, sdkHandler
}

func TestServeSDKSuccess(t *testing.T) {
	_, r, _, user, _, _ := setupTestEnvironment(t)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/sdk/"+user.PublicID+".js", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", w.Code)
	}

	contentType := w.Header().Get("Content-Type")
	if !strings.Contains(contentType, "application/javascript") {
		t.Errorf("expected content type application/javascript, got %s", contentType)
	}

	body := w.Body.String()
	if !strings.Contains(body, user.PublicID) {
		t.Errorf("expected JS SDK to contain merchant ID %s", user.PublicID)
	}
	if !strings.Contains(body, "pk_test_paystack_public_key") {
		t.Errorf("expected JS SDK to contain decrypted public key, got body: %s", body)
	}
}

func TestServeSDKMerchantNotFound(t *testing.T) {
	_, r, _, _, _, _ := setupTestEnvironment(t)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/sdk/nonexistent_merchant_id.js", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404 Not Found, got %d", w.Code)
	}
	body := w.Body.String()
	if !strings.Contains(body, "console.error") {
		t.Errorf("expected body to contain error console output, got: %s", body)
	}
}

func TestInitializeSDKTransactionSuccess(t *testing.T) {
	_, r, _, user, txService, _ := setupTestEnvironment(t)

	// Setup mock paystack HTTP server
	mockServer := httptest.NewServer(http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		res.WriteHeader(http.StatusOK)
		res.Write([]byte(`{
			"status": true,
			"message": "Initialization successful",
			"data": {
				"authorization_url": "https://checkout.paystack.com/abcdef",
				"access_code": "access_code_12345",
				"reference": "paye_ref_9999"
			}
		}`))
	}))
	defer mockServer.Close()

	txService.SetPaystackBaseURL(mockServer.URL)

	payload := map[string]interface{}{
		"publicId": user.PublicID,
		"amount":   250.00,
		"email":    "customer@test.com",
		"currency": "NGN",
		"provider": "paystack",
	}
	payloadBytes, _ := json.Marshal(payload)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/sdk/transactions/initialize", bytes.NewBuffer(payloadBytes))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d. Body: %s", w.Code, w.Body.String())
	}

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	if err != nil {
		t.Fatalf("failed to parse JSON response: %v", err)
	}

	if response["status"] != true {
		t.Errorf("expected success status to be true, got %v", response["status"])
	}

	data := response["data"].(map[string]interface{})
	if data["access_code"] != "access_code_12345" {
		t.Errorf("expected access_code to be access_code_12345, got %v", data["access_code"])
	}
	if data["reference"] == "" {
		t.Errorf("expected non-empty reference")
	}
}
