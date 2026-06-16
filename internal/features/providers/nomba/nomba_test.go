package nomba

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ttomsin/paye/internal/features/providers"
)

func TestTokenManager_GetToken(t *testing.T) {
	var callCount int

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		if r.URL.Path == "/auth/token/issue" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"code": "00",
				"description": "Success",
				"data": {
					"access_token": "mock_token_1",
					"refresh_token": "mock_refresh_1",
					"expiresAt": "2030-01-01T00:00:00Z"
				}
			}`))
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	tm := NewTokenManager("client_id", "client_secret", "account_id")
	tm.BaseURL = server.URL

	// First call - should trigger /auth/token/issue
	token, err := tm.GetToken()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if token != "mock_token_1" {
		t.Errorf("expected mock_token_1, got %s", token)
	}
	if callCount != 1 {
		t.Errorf("expected 1 call, got %d", callCount)
	}

	// Second call - should use cache, no network call
	token2, err := tm.GetToken()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if token2 != "mock_token_1" {
		t.Errorf("expected mock_token_1, got %s", token2)
	}
	if callCount != 1 {
		t.Errorf("expected still 1 call (cached), got %d", callCount)
	}
}

func TestNomba_AllFlows(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		
		switch r.URL.Path {
		case "/auth/token/issue":
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"code": "00",
				"description": "Success",
				"data": {
					"access_token": "mock_access_token",
					"refresh_token": "mock_refresh_token",
					"expiresAt": "2030-01-01T00:00:00Z"
				}
			}`))
		case "/checkout/order":
			if r.Header.Get("Authorization") != "Bearer mock_access_token" {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			if r.Header.Get("accountId") != "account_id" {
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			var body map[string]any
			json.NewDecoder(r.Body).Decode(&body)
			order := body["order"].(map[string]any)

			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"code": "00",
				"description": "Checkout link created",
				"data": {
					"checkoutLink": "https://checkout.nomba.com/pay/` + order["orderReference"].(string) + `",
					"orderReference": "` + order["orderReference"].(string) + `"
				}
			}`))
		case "/transactions/accounts":
			if r.Header.Get("Authorization") != "Bearer mock_access_token" {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			var body map[string]any
			json.NewDecoder(r.Body).Decode(&body)
			ref := body["orderReference"].(string)

			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"code": "00",
				"description": "Transaction details",
				"data": {
					"results": [
						{
							"id": "nomba_tx_id",
							"status": "SUCCESS",
							"amount": 1000.00,
							"merchantTxRef": "` + ref + `"
						}
					]
				}
			}`))
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	n := New("client_id", "client_secret", "account_id")
	n.SetBaseURL(server.URL)

	// Test InitializeTransaction
	initResp, err := n.InitializeTransaction(providers.TransactionRequest{
		Amount:    1000.00,
		Email:     "user@example.com",
		Currency:  "NGN",
		Reference: "tx_ref_abc",
	})
	if err != nil {
		t.Fatalf("unexpected error initializing transaction: %v", err)
	}

	if !initResp.Status {
		t.Error("expected status to be true")
	}
	if initResp.Reference != "tx_ref_abc" {
		t.Errorf("expected reference tx_ref_abc, got %s", initResp.Reference)
	}
	if initResp.AuthURL != "https://checkout.nomba.com/pay/tx_ref_abc" {
		t.Errorf("expected auth URL to end in tx_ref_abc, got %s", initResp.AuthURL)
	}
	if initResp.Provider != "nomba" {
		t.Errorf("expected provider 'nomba', got '%s'", initResp.Provider)
	}

	// Test VerifyTransaction
	verifyResp, err := n.VerifyTransaction("tx_ref_abc")
	if err != nil {
		t.Fatalf("unexpected error verifying transaction: %v", err)
	}

	if !verifyResp.Status {
		t.Error("expected verified transaction status to be true")
	}
	if verifyResp.Amount != 1000.00 {
		t.Errorf("expected verified transaction amount to be 1000.00, got %f", verifyResp.Amount)
	}
}

func TestNomba_HandleWebhook(t *testing.T) {
	n := New("client_id", "client_secret", "account_id")

	payloadStr := `{
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
	}`

	timestamp := "1718524800"

	var webhookData nombaWebhookPayload
	if err := json.Unmarshal([]byte(payloadStr), &webhookData); err != nil {
		t.Fatalf("failed to unmarshal test payload: %v", err)
	}

	expectedSig := n.generateSignature(webhookData, timestamp)

	// Combine signature and timestamp for HandleWebhook
	signatureParam := expectedSig + "|" + timestamp

	event, err := n.HandleWebhook(signatureParam, []byte(payloadStr))
	if err != nil {
		t.Fatalf("unexpected error handling webhook: %v", err)
	}

	if event.Event != "TRANSACTION_SUCCESS" {
		t.Errorf("expected event TRANSACTION_SUCCESS, got %s", event.Event)
	}
	if event.Reference != "tx_ref_abc" {
		t.Errorf("expected reference tx_ref_abc, got %s", event.Reference)
	}

	// Test with invalid signature
	invalidSignatureParam := "invalid_sig|" + timestamp
	_, err = n.HandleWebhook(invalidSignatureParam, []byte(payloadStr))
	if err == nil {
		t.Error("expected error for invalid signature, got nil")
	}
}
