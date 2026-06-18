package opay

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/features/providers"
)

func TestOPay_AllFlows(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Verify OPay headers
		if r.Header.Get("MerchantId") != "test_merchant_id" {
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		switch r.URL.Path {
		case cashierCreatePath:
			if r.Header.Get("Authorization") != "Bearer test_public_key" {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}

			var body cashierCreateRequest
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"code": "00000",
				"message": "SUCCESSFUL",
				"data": {
					"reference": "` + body.Reference + `",
					"orderNo": "opay_order_123",
					"cashierUrl": "https://sandboxcashier.opaycheckout.com/pay/` + body.Reference + `",
					"status": "INITIAL",
					"amount": {
						"total": ` + fmt.Sprintf("%d", body.Amount.Total) + `,
						"currency": "NGN"
					}
				}
			}`))

		case cashierStatusPath:
			// Authorization for Status uses HMAC-SHA512 of request body
			var body cashierStatusRequest
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{
				"code": "00000",
				"message": "SUCCESSFUL",
				"data": {
					"reference": "` + body.Reference + `",
					"orderNo": "opay_order_123",
					"status": "SUCCESS",
					"amount": {
						"total": 40000,
						"currency": "NGN"
					}
				}
			}`))

		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer server.Close()

	p := New("test_public_key", "test_secret_key", "test_merchant_id", true)
	p.baseURL = server.URL // Override base URL to point to mock server

	// Test InitializeTransaction
	initResp, err := p.InitializeTransaction(providers.TransactionRequest{
		Amount:    400.00, // 400.00 Naira
		Email:     "user@example.com",
		Currency:  "NGN",
		Reference: "ref_abc_123",
		Metadata: map[string]any{
			"product_name":        "Test Item",
			"product_description": "For testing",
		},
	})
	if err != nil {
		t.Fatalf("InitializeTransaction failed: %v", err)
	}

	if !initResp.Status {
		t.Error("Expected status to be true")
	}
	if initResp.Reference != "ref_abc_123" {
		t.Errorf("Expected reference ref_abc_123, got %s", initResp.Reference)
	}
	if initResp.AuthURL != "https://sandboxcashier.opaycheckout.com/pay/ref_abc_123" {
		t.Errorf("Expected auth URL, got %s", initResp.AuthURL)
	}
	if initResp.AccessCode != "opay_order_123" {
		t.Errorf("Expected access code opay_order_123, got %s", initResp.AccessCode)
	}

	// Test VerifyTransaction
	verifyResp, err := p.VerifyTransaction("ref_abc_123")
	if err != nil {
		t.Fatalf("VerifyTransaction failed: %v", err)
	}

	if !verifyResp.Status {
		t.Error("Expected verify status to be true")
	}
	if verifyResp.Amount != 400.00 {
		t.Errorf("Expected verified amount 400.00, got %f", verifyResp.Amount)
	}
	if verifyResp.StatusText != "SUCCESS" {
		t.Errorf("Expected verified status text SUCCESS, got %s", verifyResp.StatusText)
	}
}

func TestOPay_HandleWebhook(t *testing.T) {
	p := New("test_public_key", "test_secret_key", "test_merchant_id", true)

	payloadStr := `{
		"payload": {
			"amount": "40000",
			"channel": "Web",
			"country": "NG",
			"currency": "NGN",
			"displayedFailure": "",
			"fee": "0",
			"feeCurrency": "NGN",
			"instrumentType": "BankCard",
			"reference": "ref_abc_123",
			"refunded": false,
			"status": "SUCCESS",
			"timestamp": "2026-06-17T06:20:00Z",
			"token": "token_123",
			"transactionId": "tx_123",
			"updated_at": "2026-06-17T06:20:00Z"
		},
		"type": "transaction-status"
	}`

	// Reconstruct expected signature input
	sigInput := `{Amount:"40000",Currency:"NGN",Reference:"ref_abc_123",Refunded:f,Status:"SUCCESS",Timestamp:"2026-06-17T06:20:00Z",Token:"token_123",TransactionID:"tx_123"}`
	expectedSig := crypto.HmacSHA3_512Hex(sigInput, "test_secret_key")

	// Create complete payload including the sha512 signature field
	var rawPayload map[string]any
	if err := json.Unmarshal([]byte(payloadStr), &rawPayload); err != nil {
		t.Fatalf("Failed to decode raw payload: %v", err)
	}
	rawPayload["sha512"] = expectedSig
	fullPayloadBytes, _ := json.Marshal(rawPayload)

	// Test HandleWebhook with valid signature
	event, err := p.HandleWebhook(expectedSig, fullPayloadBytes)
	if err != nil {
		t.Fatalf("HandleWebhook failed with valid signature: %v", err)
	}

	if event.Event != "transaction-status" {
		t.Errorf("Expected event transaction-status, got %s", event.Event)
	}
	if event.Reference != "ref_abc_123" {
		t.Errorf("Expected reference ref_abc_123, got %s", event.Reference)
	}
	if event.Amount != 400.00 {
		t.Errorf("Expected event amount 400.00, got %f", event.Amount)
	}
	if event.Status != "SUCCESS" {
		t.Errorf("Expected event status SUCCESS, got %s", event.Status)
	}

	// Test HandleWebhook with invalid signature
	invalidPayload := make(map[string]any)
	json.Unmarshal(fullPayloadBytes, &invalidPayload)
	invalidPayload["sha512"] = "invalid_signature"
	invalidPayloadBytes, _ := json.Marshal(invalidPayload)

	_, err = p.HandleWebhook(expectedSig, invalidPayloadBytes)
	if err == nil {
		t.Error("Expected error for invalid webhook signature, got none")
	}
}
