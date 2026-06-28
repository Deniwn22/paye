package nomba

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sync"
	"time"
)

const (
	baseURL = "https://api.nomba.com/v1"
)

type TokenManager struct {
	clientID     string
	clientSecret string
	accountID    string
	BaseURL      string
	isLive       bool

	mu           sync.Mutex
	accessToken  string
	refreshToken string
	expiresAt    time.Time
}

func NewTokenManager(clientID, clientSecret, accountID string, isLive bool) *TokenManager {
	return &TokenManager{
		clientID:     clientID,
		clientSecret: clientSecret,
		accountID:    accountID,
		isLive:       isLive,
	}
}

func (t *TokenManager) getBaseURL() string {
	if t.BaseURL != "" {
		return t.BaseURL
	}
	if t.isLive {
		if envLive := os.Getenv("NOMBA_LIVE_BASE_URL"); envLive != "" {
			return envLive
		}
		// Default to sandbox for now per user request
		return "https://sandbox.nomba.com/v1"
	}
	if envSandbox := os.Getenv("NOMBA_SANDBOX_BASE_URL"); envSandbox != "" {
		return envSandbox
	}
	return "https://sandbox.nomba.com/v1"
}

type issueTokenRequest struct {
	GrantType    string `json:"grant_type"`
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
}

type refreshTokenRequest struct {
	GrantType    string `json:"grant_type"`
	RefreshToken string `json:"refresh_token"`
}

type tokenData struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    string `json:"expiresAt"`
}

type tokenResponse struct {
	Code        string    `json:"code"`
	Description string    `json:"description"`
	Data        tokenData `json:"data"`
}

func (t *TokenManager) GetToken() (string, error) {
	t.mu.Lock()
	defer t.mu.Unlock()

	// return cached token if still valid with 30 second buffer
	if t.accessToken != "" && time.Now().Before(t.expiresAt.Add(-30*time.Second)) {
		return t.accessToken, nil
	}

	// if we have a refresh token, use it instead of full re-issue
	if t.refreshToken != "" {
		return t.refresh()
	}

	return t.issue()
}

func (t *TokenManager) issue() (string, error) {
	reqBody := issueTokenRequest{
		GrantType:    "client_credentials",
		ClientID:     t.clientID,
		ClientSecret: t.clientSecret,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("nomba: failed to marshal token request: %w", err)
	}

	req, err := http.NewRequest("POST", t.getBaseURL()+"/auth/token/issue", bytes.NewBuffer(body))
	if err != nil {
		return "", fmt.Errorf("nomba: failed to create token request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("accountId", t.accountID)

	return t.doTokenRequest(req)
}

func (t *TokenManager) refresh() (string, error) {
	reqBody := refreshTokenRequest{
		GrantType:    "refresh_token",
		RefreshToken: t.refreshToken,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("nomba: failed to marshal refresh request: %w", err)
	}

	req, err := http.NewRequest("POST", t.getBaseURL()+"/auth/token/refresh", bytes.NewBuffer(body))
	if err != nil {
		return "", fmt.Errorf("nomba: failed to create refresh request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+t.accessToken)
	req.Header.Set("accountId", t.accountID)

	token, err := t.doTokenRequest(req)
	if err != nil {
		// refresh failed, fall back to full re-issue
		t.refreshToken = ""
		return t.issue()
	}

	return token, nil
}

func (t *TokenManager) doTokenRequest(req *http.Request) (string, error) {
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("nomba: token request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return "", fmt.Errorf("nomba: token endpoint returned %d: %v", resp.StatusCode, errResult)
	}

	var result tokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("nomba: failed to decode token response: %w", err)
	}

	if result.Code != "00" {
		return "", fmt.Errorf("nomba: token error: %s", result.Description)
	}

	// parse expiresAt timestamp
	expiresAt, err := time.Parse(time.RFC3339, result.Data.ExpiresAt)
	if err != nil {
		// fallback: assume 1 hour if parsing fails
		expiresAt = time.Now().Add(1 * time.Hour)
	}

	t.accessToken = result.Data.AccessToken
	t.refreshToken = result.Data.RefreshToken
	t.expiresAt = expiresAt

	return t.accessToken, nil
}
