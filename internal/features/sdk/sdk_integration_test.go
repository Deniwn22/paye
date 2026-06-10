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
	"github.com/ttomsin/paye/internal/features/subscriptions"
	"github.com/ttomsin/paye/internal/features/transactions"
	"github.com/ttomsin/paye/internal/features/user"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestEnvironment(t *testing.T) (*gorm.DB, *gin.Engine, string, *models.User, *transactions.TransactionService, *sdk.SDKHandler, *subscriptions.SubscriptionService) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}

	err = db.AutoMigrate(&models.User{}, &models.Project{}, &models.ProviderConfig{}, &models.WebhookConfig{}, &models.WebhookLog{}, &models.Transaction{}, &models.Plan{}, &models.Subscription{})
	if err != nil {
		t.Fatalf("failed to migrate database: %v", err)
	}

	hashedPassword, _ := auth.HashPassword("password123")
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
		Name: "Default Project",

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
	subscriptionService := subscriptions.NewSubscriptionService(db, providerRepo, encryptionKey)
	sdkHandler := sdk.NewSDKHandler(userRepo, projectRepo, providerRepo, txService, encryptionKey, db, subscriptionService)

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
	v1.POST("/sdk/subscriptions/create", sdkHandler.CreateSDKSubscription)
	v1.GET("/sdk/transactions/verify/:reference", sdkHandler.VerifySDKTransaction)

	return db, r, encryptionKey, testUser, txService, sdkHandler, subscriptionService
}

func TestServeSDKSuccess(t *testing.T) {
	_, r, _, user, _, _, _ := setupTestEnvironment(t)

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
	_, r, _, _, _, _, _ := setupTestEnvironment(t)

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
	_, r, _, user, txService, _, _ := setupTestEnvironment(t)

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
	metadata, ok := data["metadata"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected metadata map, got %v", data["metadata"])
	}
	if metadata["access_code"] != "access_code_12345" {
		t.Errorf("expected access_code to be access_code_12345, got %v", metadata["access_code"])
	}
	if data["reference"] == "" {
		t.Errorf("expected non-empty reference")
	}
}

func TestCreateSDKSubscriptionSuccess(t *testing.T) {
	db, r, _, user, _, _, _ := setupTestEnvironment(t)

	// Retrieve default project
	var proj models.Project
	if err := db.Where("public_id = ?", user.PublicID).First(&proj).Error; err != nil {
		t.Fatalf("failed to get project: %v", err)
	}

	// Create a billing plan in the database
	plan := &models.Plan{
		ProjectID: proj.Base.ID,
		PlanCode:  "PLN_test123",
		Name:      "Test Plan",
		Amount:    2000,
		Interval:  "monthly",
		Currency:  "NGN",
		Provider:  "paystack",
	}
	if err := db.Create(plan).Error; err != nil {
		t.Fatalf("failed to create plan: %v", err)
	}

	// Create a successful transaction with an authorization code for the customer
	tx := &models.Transaction{
		ProjectID:         proj.Base.ID,
		Provider:          "paystack",
		Reference:         "ref_first_charge_123",
		Amount:            2000,
		Currency:          "NGN",
		Email:             "subscriber@test.com",
		Status:            "success",
		AuthorizationCode: "AUTH_valid12345",
	}
	if err := db.Create(tx).Error; err != nil {
		t.Fatalf("failed to create transaction: %v", err)
	}

	payload := map[string]interface{}{
		"publicId":      user.PublicID,
		"customerEmail": "subscriber@test.com",
		"planId":        plan.ID.String(),
		"reference":     "ref_first_charge_123",
	}
	payloadBytes, _ := json.Marshal(payload)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/sdk/subscriptions/create", bytes.NewBuffer(payloadBytes))
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
	subCode, ok := data["subscription_code"].(string)
	if !ok || !strings.HasPrefix(subCode, "SUB_") {
		t.Errorf("expected subscription code starting with SUB_, got %v", data["subscription_code"])
	}
}

func TestCreateSDKSubscriptionNoAuthCode(t *testing.T) {
	db, r, _, user, _, _, _ := setupTestEnvironment(t)

	// Retrieve default project
	var proj models.Project
	if err := db.Where("public_id = ?", user.PublicID).First(&proj).Error; err != nil {
		t.Fatalf("failed to get project: %v", err)
	}

	// Create a billing plan in the database
	plan := &models.Plan{
		ProjectID: proj.Base.ID,
		PlanCode:  "PLN_test123",
		Name:      "Test Plan",
		Amount:    2000,
		Interval:  "monthly",
		Currency:  "NGN",
		Provider:  "paystack",
	}
	if err := db.Create(plan).Error; err != nil {
		t.Fatalf("failed to create plan: %v", err)
	}

	// Do NOT create a successful transaction with an authorization code

	payload := map[string]interface{}{
		"publicId":      user.PublicID,
		"customerEmail": "subscriber_no_auth@test.com",
		"planId":        plan.ID.String(),
		"reference":     "ref_any",
	}
	payloadBytes, _ := json.Marshal(payload)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/sdk/subscriptions/create", bytes.NewBuffer(payloadBytes))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request, got %d. Body: %s", w.Code, w.Body.String())
	}

	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)
	if response["status"] == true {
		t.Errorf("expected status false, got true")
	}
}
