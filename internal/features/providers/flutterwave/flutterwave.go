package flutterwave

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/ttomsin/paye/internal/features/providers"
)

type Flutterwave struct {
	secretKey string
	BaseURL   string
}

func New(secretKey string) *Flutterwave {
	return &Flutterwave{secretKey: secretKey}
}

func (f *Flutterwave) getBaseURL() string {
	if f.BaseURL != "" {
		return f.BaseURL
	}
	isTest := strings.HasPrefix(f.secretKey, "FLWSECK_T-")
	if isTest {
		if envSandbox := os.Getenv("FLUTTERWAVE_SANDBOX_BASE_URL"); envSandbox != "" {
			return envSandbox
		}
	} else {
		if envLive := os.Getenv("FLUTTERWAVE_LIVE_BASE_URL"); envLive != "" {
			return envLive
		}
	}
	if envBase := os.Getenv("FLUTTERWAVE_BASE_URL"); envBase != "" {
		return envBase
	}
	return "https://api.flutterwave.com/v3"
}

func (f *Flutterwave) Name() string {
	return "flutterwave"
}

type fwCustomer struct {
	Email string `json:"email"`
}

type fwTransactionRequest struct {
	TxRef       string     `json:"tx_ref"`
	Amount      string     `json:"amount"`
	Currency    string     `json:"currency"`
	RedirectURL string     `json:"redirect_url"`
	Customer    fwCustomer `json:"customer"`
}

type fwInitData struct {
	Link string `json:"link"`
}

type fwTransactionResponse struct {
	Status  string     `json:"status"`
	Message string     `json:"message"`
	Data    fwInitData `json:"data"`
}

func (f *Flutterwave) InitializeTransaction(req providers.TransactionRequest) (*providers.TransactionResponse, error) {
	fReq := fwTransactionRequest{
		TxRef:       req.Reference,
		Amount:      fmt.Sprintf("%f", req.Amount),
		Currency:    req.Currency,
		RedirectURL: "https://paye.co", // placeholder
		Customer: fwCustomer{
			Email: req.Email,
		},
	}
	body, err := json.Marshal(fReq)
	if err != nil {
		return nil, err
	}

	resp, err := f.makeRequest("POST", f.getBaseURL()+"/payments", body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		msg := "flutterwave error"
		if m, ok := errResult["message"].(string); ok {
			msg = msg + ": " + m
		}
		return nil, fmt.Errorf("%s", msg)
	}

	var result fwTransactionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	tResp := &providers.TransactionResponse{
		Status:    result.Status == "success",
		Message:   result.Message,
		Reference: req.Reference,
		AuthURL:   result.Data.Link,
		Provider:  f.Name(),
		Metadata: map[string]any{
			"tx_ref": req.Reference,
		},
	}

	return tResp, nil
}

type fwCard struct {
	Token string `json:"token"`
}

type fwVerifyData struct {
	Status   string  `json:"status"`
	TxRef    string  `json:"tx_ref"`
	Amount   float64 `json:"amount"`
	Currency string  `json:"currency"`
	Card     fwCard  `json:"card"`
}

type fwVerifyResponse struct {
	Status  string       `json:"status"`
	Message string       `json:"message"`
	Data    fwVerifyData `json:"data"`
}

func (f *Flutterwave) VerifyTransaction(reference string) (*providers.TransactionResponse, error) {
	url := fmt.Sprintf("%s/transactions/verify_by_reference?tx_ref=%s", f.getBaseURL(), reference)
	res, err := f.makeRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(res.Body).Decode(&errResult)
		msg := "flutterwave error"
		if m, ok := errResult["message"].(string); ok {
			msg = msg + ": " + m
		}
		return nil, fmt.Errorf("%s", msg)
	}

	var result fwVerifyResponse
	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		return nil, err
	}

	tResp := &providers.TransactionResponse{
		Status:            result.Status == "success" && result.Data.Status == "successful",
		Message:           result.Message,
		Reference:         result.Data.TxRef,
		Amount:            result.Data.Amount,
		Currency:          result.Data.Currency,
		Provider:          f.Name(),
		AuthorizationCode: result.Data.Card.Token,
	}

	return tResp, nil
}

func (f *Flutterwave) makeRequest(method string, url string, body []byte) (*http.Response, error) {
	req, err := http.NewRequest(method, url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	client := &http.Client{}
	req.Header.Set("Authorization", "Bearer "+f.secretKey)
	req.Header.Set("Content-Type", "application/json")
	return client.Do(req)
}

type flutterwaveWebhookPayload struct {
	Event string         `json:"event"`
	Data  map[string]any `json:"data"`
}

func (f *Flutterwave) HandleWebhook(signature string, payload []byte) (*providers.WebhookEvent, error) {
	// For Flutterwave, the verif-hash is a plain text secret hash you configure on your dashboard.
	// We'll assume the user configures their Flutterwave Secret Hash to be exactly their Secret Key.
	if signature != f.secretKey {
		return nil, fmt.Errorf("invalid Flutterwave signature: ensure the Secret Hash on your Flutterwave webhook dashboard matches your Flutterwave Secret Key (starts with FLWSECK_)")
	}

	var webhookData flutterwaveWebhookPayload
	if err := json.Unmarshal(payload, &webhookData); err != nil {
		return nil, err
	}

	reference, _ := webhookData.Data["tx_ref"].(string)
	amount, _ := webhookData.Data["amount"].(float64)
	status, _ := webhookData.Data["status"].(string)

	var authorizationCode string
	if card, ok := webhookData.Data["card"].(map[string]any); ok {
		if token, ok := card["token"].(string); ok {
			authorizationCode = token
		}
	}

	return &providers.WebhookEvent{
		Event:             webhookData.Event,
		Reference:         reference,
		Amount:            amount,
		Status:            status,
		Provider:          f.Name(),
		AuthorizationCode: authorizationCode,
	}, nil
}
func (f *Flutterwave) RefundTransaction(req providers.RefundRequest) (*providers.RefundResponse, error) {
	return nil, fmt.Errorf("not implemented")
}
func (f *Flutterwave) CreateTransferRecipient(req providers.TransferRecipientRequest) (*providers.TransferRecipientResponse, error) {
	return nil, fmt.Errorf("not implemented")
}
func (f *Flutterwave) InitiateTransfer(req providers.TransferRequest) (*providers.TransferResponse, error) {
	return nil, fmt.Errorf("not implemented")
}
func (f *Flutterwave) CreatePlan(req providers.PlanRequest) (*providers.PlanResponse, error) {
	return nil, fmt.Errorf("not implemented")
}
func (f *Flutterwave) CreateSubscription(req providers.SubscriptionRequest) (*providers.SubscriptionResponse, error) {
	return nil, fmt.Errorf("not implemented")
}
func (f *Flutterwave) CancelSubscription(subscriptionCode string, emailToken string) error {
	return fmt.Errorf("not implemented")
}
