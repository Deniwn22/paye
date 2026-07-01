package webhooks_test

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/crypto"
	payeDb "github.com/ttomsin/paye/internal/db"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/features/auth"
	"github.com/ttomsin/paye/internal/features/dashboard"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/user"
	"github.com/ttomsin/paye/internal/features/virtual_accounts"
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

	err = payeDb.RunMigrations(db)
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
		Name:         "Default Project",
		ApiKey:       "paye_live_api_key_12345",
		TestApiKey:   "paye_test_api_key_12345",
		PublicID:     testUser.PublicID,
		TestPublicID: "paye_test_pub_12345",
		UserID:       testUser.Base.ID,
	}
	if err := db.Create(testProject).Error; err != nil {
		t.Fatalf("failed to create test project: %v", err)
	}

	jwtSecret := "test_jwt_secret_key_32_bytes_long_xxxx"
	token, err := auth.GenerateJWT(testUser.Base.ID.String(), testUser.Email, "paye_live_api_key_12345", testUser.PublicID, "merchant", jwtSecret)
	if err != nil {
		t.Fatalf("failed to generate JWT: %v", err)
	}

	encryptionKey := "12345678901234567890123456789012" // 32 bytes

	userRepo := user.NewUserRepo(db)
	providerRepo := providers.NewProviderRepo(db)
	webhookRepo := webhooks.NewWebhookRepo(db)
	vaRepo := virtual_accounts.NewVARepository(db)

	providerService := providers.NewProviderService(providerRepo, encryptionKey, db)
	webhookService := webhooks.NewWebhookService(webhookRepo, vaRepo, providerRepo, userRepo, encryptionKey, nil)

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
		SecretKey:    "sk_test_secret_key_val",
		PublicKey:    "pk_test_public_key_val",
		IsActive:     true,
	}
	body, _ := json.Marshal(pReq)
	req := httptest.NewRequest("POST", "/api/v1/providers/test", bytes.NewBuffer(body))
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

func TestWebhookConfigDuplicate(t *testing.T) {
	_, r, token, _, _ := setupTestEnvironment(t)

	// Create First Webhook Config
	wReq1 := dto.WebhookConfigRequest{
		ProviderName: "paystack",
		TargetURL:    "http://example.com/callback1",
	}
	body1, _ := json.Marshal(wReq1)
	req1 := httptest.NewRequest("POST", "/api/v1/webhooks/configs", bytes.NewBuffer(body1))
	req1.Header.Set("Authorization", "Bearer "+token)
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)

	if w1.Code != http.StatusOK {
		t.Fatalf("Expected first create webhook config status 200, got %d. Body: %s", w1.Code, w1.Body.String())
	}

	// Create Second Webhook Config for the SAME provider
	wReq2 := dto.WebhookConfigRequest{
		ProviderName: "paystack",
		TargetURL:    "http://example.com/callback2",
	}
	body2, _ := json.Marshal(wReq2)
	req2 := httptest.NewRequest("POST", "/api/v1/webhooks/configs", bytes.NewBuffer(body2))
	req2.Header.Set("Authorization", "Bearer "+token)
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusBadRequest {
		t.Fatalf("Expected duplicate create webhook config status 400, got %d. Body: %s", w2.Code, w2.Body.String())
	}

	var respBody map[string]any
	json.Unmarshal(w2.Body.Bytes(), &respBody)
	if respBody["message"] != "a webhook configuration for this provider already exists" {
		t.Errorf("Expected error 'a webhook configuration for this provider already exists', got '%v'", respBody["message"])
	}
}

func TestWebhookProxyForwarding(t *testing.T) {
	db, r, token, _, testProject := setupTestEnvironment(t)
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

	mac := hmac.New(sha256.New, []byte("paye_test_api_key_12345"))
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
		Label:        "paystack-main",
		ProviderName: "paystack",
		Environment:  "test",
		SecretKey:    encSecretKey,
		PublicKey:    encPublicKey,
		IsActive:     true,
		ProjectID:    testProject.Base.ID,
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

func TestNombaWebhookProxyForwarding(t *testing.T) {
	db, r, token, _, testProject := setupTestEnvironment(t)
	encryptionKey := "12345678901234567890123456789012"

	// Create active ProviderConfig for Nomba
	rawSecretKey := "client_secret_val_123"
	rawPublicKey := "client_id_val_123"
	encSecretKey, _ := crypto.Encrypt(rawSecretKey, encryptionKey)
	encPublicKey, _ := crypto.Encrypt(rawPublicKey, encryptionKey)

	provConfig := &models.ProviderConfig{
		Label:        "nomba-main",
		ProviderName: "nomba",
		Environment:  "live",
		SecretKey:    encSecretKey,
		PublicKey:    encPublicKey,
		IsActive:     true,
		ProjectID:    testProject.Base.ID,
		Metadata:     models.ProviderMetadata{NombaAccountID: "account_id_val_123"},
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
		ProviderName:    "nomba",
		TargetURL:       mockTargetServer.URL,
		PayeWebhookSlug: "nomba-slug-123",
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

	// Send Nomba Webhook payload to the receiver endpoint
	payload := []byte(`{
		"event_type": "TRANSACTION_SUCCESS",
		"requestId": "req_12345",
		"data": {
			"merchant": {
				"walletId": "wallet_123",
				"walletBalance": "50000.00",
				"userId": "user_123"
			},
			"transaction": {
				"transactionId": "tx_ref_abc",
				"type": "deposit",
				"transactionAmount": 1000.00,
				"fee": 15.0,
				"time": "2026-06-16T09:00:00Z",
				"responseCode": "00"
			}
		}
	}`)

	// Hashing payload format: EventType:RequestID:UserID:WalletID:TransactionID:Type:Time:ResponseCode:Timestamp
	hashingPayload := "TRANSACTION_SUCCESS:req_12345:user_123:wallet_123:tx_ref_abc:deposit:2026-06-16T09:00:00Z:00:1718524800"
	hash := hmac.New(sha256.New, []byte(rawSecretKey))
	hash.Write([]byte(hashingPayload))
	nombaSignature := base64.StdEncoding.EncodeToString(hash.Sum(nil))

	req = httptest.NewRequest("POST", "/api/v1/webhooks/receive/nomba-slug-123", bytes.NewBuffer(payload))
	req.Header.Set("nomba-signature", nombaSignature)
	req.Header.Set("nomba-timestamp", "1718524800")
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
	var receivedMap, originalMap map[string]any
	json.Unmarshal(lastReceivedBody, &receivedMap)
	json.Unmarshal(payload, &originalMap)

	// Compare event types
	if receivedMap["event_type"] != originalMap["event_type"] {
		t.Errorf("Proxy body mismatch: got %v, want %v", receivedMap["event_type"], originalMap["event_type"])
	}

	mac := hmac.New(sha256.New, []byte("paye_live_api_key_12345"))
	mac.Write(lastReceivedBody)
	expectedPayeSignature := hex.EncodeToString(mac.Sum(nil))

	if lastReceivedSignature != expectedPayeSignature {
		t.Errorf("Proxy signature header mismatch: got %s, want %s", lastReceivedSignature, expectedPayeSignature)
	}
}
