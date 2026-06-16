package auth_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	payeDb "github.com/ttomsin/paye/internal/db"
	"github.com/ttomsin/paye/internal/features/auth"
	"github.com/ttomsin/paye/internal/features/projects"
	"github.com/ttomsin/paye/internal/features/user"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupAuthTestEnv(t *testing.T) (*gorm.DB, *gin.Engine) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open database: %v", err)
	}

	err = payeDb.RunMigrations(db)
	if err != nil {
		t.Fatalf("failed to migrate database: %v", err)
	}

	userRepo := user.NewUserRepo(db)
	projectRepo := projects.NewProjectRepo(db)
	authService := auth.NewAuthService(userRepo, projectRepo, "my_test_jwt_secret_key_12345")
	authHandler := auth.NewAuthHandler(*authService)

	gin.SetMode(gin.TestMode)
	r := gin.Default()

	v1 := r.Group("/api/v1")
	auth.RegisterRoutes(v1, authHandler)

	return db, r
}

func TestSignupSuccess(t *testing.T) {
	_, r := setupAuthTestEnv(t)

	payload := map[string]string{
		"name":     "Acme Corp",
		"email":    "acme@example.com",
		"password": "securepassword123",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "/api/v1/auth/signup", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d, body: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if resp["status"] != true {
		t.Errorf("expected response status to be true, got %v", resp["status"])
	}
}

func TestSignupValidationErrors(t *testing.T) {
	_, r := setupAuthTestEnv(t)

	tests := []struct {
		name        string
		payload     map[string]string
		expectedMsg string
	}{
		{
			name: "Missing name",
			payload: map[string]string{
				"email":    "test@example.com",
				"password": "password123",
			},
			expectedMsg: "Name is required",
		},
		{
			name: "Invalid email",
			payload: map[string]string{
				"name":     "Test Merchant",
				"email":    "invalid-email",
				"password": "password123",
			},
			expectedMsg: "Invalid email address format",
		},
		{
			name: "Password too short",
			payload: map[string]string{
				"name":     "Test Merchant",
				"email":    "test@example.com",
				"password": "short",
			},
			expectedMsg: "Password must be at least 8 characters",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.payload)
			req, _ := http.NewRequest("POST", "/api/v1/auth/signup", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)

			if w.Code != http.StatusBadRequest {
				t.Errorf("expected status 400, got %d, body: %s", w.Code, w.Body.String())
			}

			var resp map[string]interface{}
			_ = json.Unmarshal(w.Body.Bytes(), &resp)

			msg, _ := resp["message"].(string)
			if msg != tt.expectedMsg {
				t.Errorf("expected message '%s', got '%s'", tt.expectedMsg, msg)
			}
		})
	}
}

func TestSignupExistingEmail(t *testing.T) {
	db, r := setupAuthTestEnv(t)

	// Create user directly in DB first
	hashedPassword, _ := auth.HashPassword("password123")
	existingUser := &models.User{
		Name:     "Existing Merchant",
		Email:    "existing@example.com",
		Password: hashedPassword,
		PublicID: "paye_pub_test_existing",
	}
	if err := db.Create(existingUser).Error; err != nil {
		t.Fatalf("failed to create existing user: %v", err)
	}

	// Try to sign up with same email
	payload := map[string]string{
		"name":     "Another Merchant",
		"email":    "existing@example.com",
		"password": "newpassword123",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "/api/v1/auth/signup", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d, body: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &resp)

	msg, _ := resp["message"].(string)
	if msg != "email already exists" {
		t.Errorf("expected error message 'email already exists', got '%s'", msg)
	}
}

func TestLoginInvalidCredentials(t *testing.T) {
	_, r := setupAuthTestEnv(t)

	// Try login with non-existent user
	payload := map[string]string{
		"email":    "unknown@example.com",
		"password": "somepassword123",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "/api/v1/auth/signin", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d, body: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &resp)

	msg, _ := resp["message"].(string)
	if msg != "Invalid email or password" {
		t.Errorf("expected error message 'Invalid email or password', got '%s'", msg)
	}
}
