package webhooks_test

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/features/auth"
	"github.com/ttomsin/paye/internal/features/dashboard"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/user"
	"github.com/ttomsin/paye/internal/features/webhooks"
	"github.com/ttomsin/paye/internal/middleware"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestEnvironment(t *testing.T) (*gorm.DB, *gin.Engine, string, *models.User, *models.Project) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}

	err = db.AutoMigrate(&models.User{}, &models.Project{}, &models.ProviderConfig{}, &models.WebhookConfig{}, &models.WebhookLog{})
	if err != nil {
		t.Fatalf("failed to migrate database: %v", err)
	}

	hashedPassword, _ := auth.HashPassword("password123")
	testUser := &models.User{
		Name:     "Test User",
		Email:    "test@example.com",
		Password: hashedPassword,
		PublicID: "paye_pub_test_12345",
	}
	if err := db.Create(testUser).Error; err != nil {
		t.Fatalf("failed to create test user: %v", err)
	}

	testProject := &models.Project{
		Name:     "Default Project",
		PublicID: testUser.PublicID,
		UserID:   testUser.Base.ID,
	}
	if err := db.Create(testProject).Error; err != nil {
		t.Fatalf("failed to create test project: %v", err)
	}

	jwtSecret := "test_jwt_secret_key_32_bytes_long_xxxx"
	token, err := auth.GenerateJWT(testUser.Base.ID.String(), testUser.Email, "", testUser.PublicID, jwtSecret)
	if err != nil {
		t.Fatalf("failed to generate JWT: %v", err)
	}

	encryptionKey := "12345678901234567890123456789012" // 32 bytes

	userRepo := user.NewUserRepo(db)
	providerRepo := providers.NewProviderRepo(db)
	webhookRepo := webhooks.NewWebhookRepo(db)

	providerService := providers.NewProviderService(providerRepo, encryptionKey, db)
	webhookService := webhooks.NewWebhookService(webhookRepo, providerRepo, userRepo, encryptionKey)

	providerHandler := providers.NewProviderHandler(providerService)
	webhookHandler := webhooks.NewWebhookHandler(webhookService)

	dashboardRepo := dashboard.NewDashboardRepo(db)
	dashboardService := dashboard.NewDashboardService(dashboardRepo)
	dashboardHandler := dashboard.NewDashboardHandler(dashboardService)

	gin.SetMode(gin.TestMode)
	r := gin.Default()

	v1 := r.Group("/api/v1")
	jwtMiddleware := middleware.NewApiJwtMiddleware(jwtSecret)
	projectMiddleware := middleware.NewProjectScopeMiddleware(db)
	protected := v1.Group("")
	protected.Use(jwtMiddleware.Handle, projectMiddleware.Handle)

	providers.RegisterRoutes(protected, providerHandler)
	webhooks.RegisterRoutes(protected, v1, webhookHandler)
	dashboard.RegisterRoutes(protected, dashboardHandler)

	return db, r, token, testUser, testProject
}

func TestProviderCRUD(t *testing.T) {
	_, r, token, _, _ := setupTestEnvironment(t)

	// Create Provider
	pReq := dto.ProviderConfigRequest{
		Label:        "paystack-test",
		ProviderName: dto.Paystack,
		SecretKey:    "psk_secret_key_val",
		PublicKey:    "psk_public_key_val",
		IsActive:     true,
	}
	body, _ := json.Marshal(pReq)
	req := httptest.NewRequest("POST", "/api/v1/providers", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected create provider status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var createResp map[string]any
	json.Unmarshal(w.Body.Bytes(), &createResp)
	dataMap := createResp["data"].(map[string]any)
	providerID := dataMap["id"].(string)

	// Verify key masking in response
	if dataMap["secret_key"] == "psk_secret_key_val" {
		t.Errorf("Secret key should be masked in response")
	}

	// List Providers
	req = httptest.NewRequest("GET", "/api/v1/providers", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected list status 200, got %d", w.Code)
	}

	// Update Provider
	pReq.Label = "paystack-updated"
	body, _ = json.Marshal(pReq)
	req = httptest.NewRequest("PUT", "/api/v1/providers/"+providerID, bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected update status 200, got %d", w.Code)
	}

	// Toggle Provider
	req = httptest.NewRequest("PATCH", "/api/v1/providers/"+providerID+"/toggle", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected toggle status 200, got %d", w.Code)
	}

	// Delete Provider
	req = httptest.NewRequest("DELETE", "/api/v1/providers/"+providerID, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected delete status 200, got %d", w.Code)
	}
}

func TestWebhookConfigCRUD(t *testing.T) {
	_, r, token, _, _ := setupTestEnvironment(t)

	// Create Webhook Config
	wReq := dto.WebhookConfigRequest{
		ProviderName: "paystack",
		TargetURL:    "http://example.com/callback",
	}
	body, _ := json.Marshal(wReq)
	req := httptest.NewRequest("POST", "/api/v1/webhooks/configs", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected create webhook config status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var createResp map[string]any
	json.Unmarshal(w.Body.Bytes(), &createResp)
	dataMap := createResp["data"].(map[string]any)
	webhookID := dataMap["id"].(string)
	webhookSlug := dataMap["paye_webhook_slug"].(string)

	if webhookSlug == "" {
		t.Errorf("Expected auto-generated webhook slug, got empty")
	}

	// List Webhook Configs
	req = httptest.NewRequest("GET", "/api/v1/webhooks/configs", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected list status 200, got %d", w.Code)
	}

	// Update Webhook Config
	wReq.TargetURL = "http://example.com/new-callback"
	body, _ = json.Marshal(wReq)
	req = httptest.NewRequest("PUT", "/api/v1/webhooks/configs/"+webhookID, bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected update status 200, got %d", w.Code)
	}

	// Delete Webhook Config
	req = httptest.NewRequest("DELETE", "/api/v1/webhooks/configs/"+webhookID, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected delete status 200, got %d", w.Code)
	}
}

func TestWebhookProxyForwarding(t *testing.T) {
	db, r, token, testUser, testProject := setupTestEnvironment(t)
	encryptionKey := "12345678901234567890123456789012"

	// Create active ProviderConfig for Paystack with decrypted key
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

	// Setup mock target server to verify proxy forward call
	receivedChan := make(chan struct{}, 1)
	var lastReceivedBody []byte
	var lastReceivedSignature string

	mockTargetServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		body, _ := io.ReadAll(req.Body)
		lastReceivedBody = body
		lastReceivedSignature = req.Header.Get("X-Paye-Signature")
		w.WriteHeader(http.StatusOK)
		receivedChan <- struct{}{}
	}))
	defer mockTargetServer.Close()

	// Create WebhookConfig mapping to the mock target server URL
	wReq := dto.WebhookConfigRequest{
		ProviderName:    "paystack",
		TargetURL:       mockTargetServer.URL,
		PayeWebhookSlug: "test-slug-123",
	}
	body, _ := json.Marshal(wReq)
	req := httptest.NewRequest("POST", "/api/v1/webhooks/configs", bytes.NewBuffer(body))
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Failed to register webhook config: %s", w.Body.String())
	}

	// Send Paystack Webhook payload to the receiver endpoint
	payload := []byte(`{"event":"charge.success","data":{"amount":5000,"reference":"ref_12345","status":"success"}}`)
	hash := hmac.New(sha512.New, []byte(rawSecretKey))
	hash.Write(payload)
	paystackSignature := hex.EncodeToString(hash.Sum(nil))

	req = httptest.NewRequest("POST", "/api/v1/webhooks/receive/test-slug-123", bytes.NewBuffer(payload))
	req.Header.Set("X-Paystack-Signature", paystackSignature)
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected receiver endpoint status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	// Wait for background proxy forward to complete
	select {
	case <-receivedChan:
		// Request received by target server
	case <-time.After(2 * time.Second):
		t.Fatalf("Timeout waiting for mock target server to receive the webhook")
	}

	// Verify payload and X-Paye-Signature header
	if string(lastReceivedBody) != string(payload) {
		t.Errorf("Proxy body mismatch: got %s, want %s", string(lastReceivedBody), string(payload))
	}

	mac := hmac.New(sha256.New, []byte(""))
	mac.Write(payload)
	expectedPayeSignature := hex.EncodeToString(mac.Sum(nil))

	if lastReceivedSignature != expectedPayeSignature {
		t.Errorf("Proxy signature header mismatch: got %s, want %s", lastReceivedSignature, expectedPayeSignature)
	}
}

func TestDashboardStatsAndLogs(t *testing.T) {
	db, r, token, _, testProject := setupTestEnvironment(t)
	encryptionKey := "12345678901234567890123456789012"

	// 1. Create a ProviderConfig and WebhookConfig
	rawSecretKey := "sk_test_paystack_secret_key_val_123"
	encSecretKey, _ := crypto.Encrypt(rawSecretKey, encryptionKey)
	encPublicKey, _ := crypto.Encrypt("pk_test_val", encryptionKey)

	provConfig := &models.ProviderConfig{
		Label:         "paystack-main",
		ProviderName:  "paystack",
		TestSecretKey: encSecretKey,
		TestPublicKey: encPublicKey,
		IsActive:      true,
		ProjectID:     testProject.Base.ID,
	}
	db.Create(provConfig)

	// Mock target server
	receivedChan := make(chan struct{}, 1)
	mockTargetServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(http.StatusOK)
		receivedChan <- struct{}{}
	}))
	defer mockTargetServer.Close()

	wConfig := &models.WebhookConfig{
		ProviderName:    "paystack",
		TargetURL:       mockTargetServer.URL,
		PayeWebhookSlug: "dash-slug-123",
		ProjectID:       testProject.Base.ID,
	}
	db.Create(wConfig)

	// 2. Trigger webhook proxy
	payload := []byte(`{"event":"charge.success","data":{"amount":5000,"reference":"ref_dash_success","status":"success"}}`)
	hash := hmac.New(sha512.New, []byte(rawSecretKey))
	hash.Write(payload)
	paystackSignature := hex.EncodeToString(hash.Sum(nil))

	req := httptest.NewRequest("POST", "/api/v1/webhooks/receive/dash-slug-123", bytes.NewBuffer(payload))
	req.Header.Set("X-Paystack-Signature", paystackSignature)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected receive ok, got %d", w.Code)
	}

	// Wait for background proxy to finish and update log
	select {
	case <-receivedChan:
	case <-time.After(2 * time.Second):
		t.Fatalf("Timeout waiting for forward")
	}
	time.Sleep(50 * time.Millisecond) // wait for DB transaction in goroutine to commit

	// 3. Get Dashboard Stats
	req = httptest.NewRequest("GET", "/api/v1/dashboard/stats", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected stats status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	var statsResult map[string]any
	json.Unmarshal(w.Body.Bytes(), &statsResult)
	statsData := statsResult["data"].(map[string]any)

	if statsData["total_volume"].(float64) != 50.0 {
		t.Errorf("Expected total volume 50, got %v", statsData["total_volume"])
	}
	if int(statsData["total_transactions"].(float64)) != 1 {
		t.Errorf("Expected 1 successful transaction, got %v", statsData["total_transactions"])
	}
	if int(statsData["successful_deliveries"].(float64)) != 1 {
		t.Errorf("Expected 1 successful delivery, got %v", statsData["successful_deliveries"])
	}
	if int(statsData["active_providers_count"].(float64)) != 1 {
		t.Errorf("Expected 1 active provider, got %v", statsData["active_providers_count"])
	}

	// 4. Get Dashboard Logs
	req = httptest.NewRequest("GET", "/api/v1/dashboard/logs?limit=5", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w = httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected logs status 200, got %d", w.Code)
	}

	var logsResult map[string]any
	json.Unmarshal(w.Body.Bytes(), &logsResult)
	logsData := logsResult["data"].([]any)

	if len(logsData) != 1 {
		t.Fatalf("Expected 1 log entry, got %d", len(logsData))
	}

	firstLog := logsData[0].(map[string]any)
	if firstLog["event"].(string) != "charge.success" {
		t.Errorf("Expected log event 'charge.success', got %s", firstLog["event"])
	}
	if int(firstLog["forwarded_status"].(float64)) != 200 {
		t.Errorf("Expected forwarded status 200, got %v", firstLog["forwarded_status"])
	}
}
