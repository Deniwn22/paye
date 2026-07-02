package nomba

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/ttomsin/paye/internal/features/providers"
)

type Nomba struct {
	tokenManager  *TokenManager
	BaseURL       string
	webhookSecret string
	subAccountID  string
	isLive        bool
}

func New(clientID, clientSecret, webhookSecret, accountID, subAccountID string, isLive bool) *Nomba {
	return &Nomba{
		tokenManager:  NewTokenManager(clientID, clientSecret, accountID, isLive),
		webhookSecret: webhookSecret,
		subAccountID:  subAccountID,
		isLive:        isLive,
	}
}

func (n *Nomba) getBaseURL() string {
	if n.BaseURL != "" {
		return n.BaseURL
	}
	if n.isLive {
		if envLive := os.Getenv("NOMBA_LIVE_BASE_URL"); envLive != "" {
			return envLive
		}
		return "https://api.nomba.com/v1"
	}
	if envSandbox := os.Getenv("NOMBA_SANDBOX_BASE_URL"); envSandbox != "" {
		return envSandbox
	}
	return "https://sandbox.nomba.com/v1"
}

func (n *Nomba) SetBaseURL(url string) {
	n.BaseURL = url
	n.tokenManager.BaseURL = url
}

func (n *Nomba) Name() string {
	return "nomba"
}

// makeRequest handles all authenticated requests to Nomba's API
func (n *Nomba) makeRequest(method, url string, body []byte) (*http.Response, error) {
	token, err := n.tokenManager.GetToken()
	if err != nil {
		return nil, fmt.Errorf("nomba: failed to get access token: %w", err)
	}

	req, err := http.NewRequest(method, url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("accountId", n.tokenManager.accountID) // ALWAYS the parent ID

	client := &http.Client{}
	return client.Do(req)
}

// Checkout

type nombaOrder struct {
	CallbackURL           string         `json:"callbackUrl"`
	CustomerEmail         string         `json:"customerEmail"`
	Amount                string         `json:"amount"`
	Currency              string         `json:"currency"`
	OrderReference        string         `json:"orderReference"`
	AccountID             string         `json:"accountId"`
	AllowedPaymentMethods []string       `json:"allowedPaymentMethods"`
	OrderMetaData         map[string]any `json:"orderMetaData,omitempty"`
}

type nombaCheckoutRequest struct {
	Order        nombaOrder `json:"order"`
	TokenizeCard string     `json:"tokenizeCard"`
}

type nombaCheckoutData struct {
	CheckoutLink   string `json:"checkoutLink"`
	OrderReference string `json:"orderReference"`
}

type nombaCheckoutResponse struct {
	Code        string            `json:"code"`
	Description string            `json:"description"`
	Data        nombaCheckoutData `json:"data"`
}

func (n *Nomba) InitializeTransaction(req providers.TransactionRequest) (*providers.TransactionResponse, error) {
	callbackURL := req.CallbackURL
	if callbackURL == "" {
		callbackURL = "https://paye.africa/webhooks/nomba/callback"
	}

	checkoutAccountID := n.tokenManager.accountID
	if n.subAccountID != "" {
		checkoutAccountID = n.subAccountID
	}

	checkoutReq := nombaCheckoutRequest{
		Order: nombaOrder{
			CallbackURL:           callbackURL,
			CustomerEmail:         req.Email,
			Amount:                fmt.Sprintf("%.2f", req.Amount),
			Currency:              req.Currency,
			OrderReference:        req.Reference,
			AccountID:             checkoutAccountID,
			AllowedPaymentMethods: []string{"Card", "Transfer"},
		},
		TokenizeCard: "true",
	}

	body, err := json.Marshal(checkoutReq)
	if err != nil {
		return nil, fmt.Errorf("nomba: failed to marshal checkout request: %w", err)
	}

	resp, err := n.makeRequest("POST", n.getBaseURL()+"/checkout/order", body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return nil, fmt.Errorf("nomba: checkout error: %v", errResult)
	}

	var result nombaCheckoutResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("nomba: failed to decode checkout response: %w", err)
	}

	if result.Code != "00" {
		return nil, fmt.Errorf("nomba: checkout failed: %s", result.Description)
	}

	return &providers.TransactionResponse{
		Status:    true,
		Message:   result.Description,
		Reference: result.Data.OrderReference,
		AuthURL:   result.Data.CheckoutLink,
		Provider:  n.Name(),
		Metadata: map[string]any{
			"orderReference": result.Data.OrderReference,
		},
	}, nil
}

// Verify

type nombaFilterRequest struct {
	OrderReference string `json:"orderReference"`
}

type nombaTransactionResult struct {
	ID            string `json:"id"`
	Status        string `json:"status"`
	Amount        string `json:"amount"`
	MerchantTxRef string `json:"merchantTxRef"`
}

type nombaFilterData struct {
	Results []nombaTransactionResult `json:"results"`
}

type nombaFilterResponse struct {
	Code        string          `json:"code"`
	Description string          `json:"description"`
	Data        nombaFilterData `json:"data"`
}

func (n *Nomba) VerifyTransaction(reference string) (*providers.TransactionResponse, error) {
	filterReq := nombaFilterRequest{
		OrderReference: reference,
	}

	body, err := json.Marshal(filterReq)
	if err != nil {
		return nil, fmt.Errorf("nomba: failed to marshal verify request: %w", err)
	}

	accID := n.tokenManager.accountID
	if n.subAccountID != "" {
		accID = n.subAccountID
	}

	url := n.getBaseURL() + "/transactions/accounts"
	if accID != n.tokenManager.accountID {
		url += "?accountId=" + accID
	}

	resp, err := n.makeRequest("POST", url, body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return nil, fmt.Errorf("nomba: verify error: %v", errResult)
	}

	var result nombaFilterResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("nomba: failed to decode verify response: %w", err)
	}

	if result.Code != "00" {
		return nil, fmt.Errorf("nomba: verify failed: %s", result.Description)
	}

	if len(result.Data.Results) == 0 {
		return nil, fmt.Errorf("nomba: transaction not found for reference: %s", reference)
	}

	tx := result.Data.Results[0]

	var amount float64
	if tx.Amount != "" {
		amount, _ = strconv.ParseFloat(tx.Amount, 64)
	}

	return &providers.TransactionResponse{
		Status:    tx.Status == "SUCCESS",
		Message:   result.Description,
		Reference: reference,
		Amount:    amount,
		Provider:  n.Name(),
	}, nil
}

// Webhook
// ── Webhook ───────────────────────────────────────────────────────────────────

type nombaMerchant struct {
	WalletID      string `json:"walletId"`
	WalletBalance string `json:"walletBalance"`
	UserID        string `json:"userId"`
}

type nombaTransaction struct {
	TransactionID string  `json:"transactionId"`
	Type          string  `json:"type"`
	Amount        float64 `json:"transactionAmount"`
	Fee           float64 `json:"fee"`
	Time          string  `json:"time"`
	ResponseCode  string  `json:"responseCode"`
}

type nombaWebhookData struct {
	Merchant    nombaMerchant    `json:"merchant"`
	Transaction nombaTransaction `json:"transaction"`
}

type nombaWebhookPayload struct {
	EventType string           `json:"event_type"`
	RequestID string           `json:"requestId"`
	Data      nombaWebhookData `json:"data"`
}

func (n *Nomba) generateSignature(payload nombaWebhookPayload, timestamp string) string {
	responseCode := payload.Data.Transaction.ResponseCode
	if responseCode == "null" {
		responseCode = ""
	}

	hashingPayload := fmt.Sprintf(
		"%s:%s:%s:%s:%s:%s:%s:%s:%s",
		payload.EventType,
		payload.RequestID,
		payload.Data.Merchant.UserID,
		payload.Data.Merchant.WalletID,
		payload.Data.Transaction.TransactionID,
		payload.Data.Transaction.Type,
		payload.Data.Transaction.Time,
		responseCode,
		timestamp,
	)

	secret := n.webhookSecret
	if secret == "" {
		secret = n.tokenManager.clientSecret
	}

	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(hashingPayload))
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}

func (n *Nomba) HandleWebhook(signature string, payload []byte) (*providers.WebhookEvent, error) {
	// signature here is "nomba-signature:nomba-timestamp" joined — we split them
	// see webhook_handler.go for how we pass both headers
	parts := strings.SplitN(signature, "|", 2)
	if len(parts) != 2 {
		return nil, fmt.Errorf("nomba: invalid signature format, expected 'signature|timestamp'")
	}
	nombaSignature := parts[0]
	nombaTimestamp := parts[1]

	var webhookData nombaWebhookPayload
	if err := json.Unmarshal(payload, &webhookData); err != nil {
		return nil, fmt.Errorf("nomba: failed to parse webhook payload: %w", err)
	}

	expected := n.generateSignature(webhookData, nombaTimestamp)

	if !strings.EqualFold(nombaSignature, expected) {
		return nil, fmt.Errorf("nomba: invalid webhook signature")
	}

	status := "failed"
	if strings.Contains(strings.ToLower(webhookData.EventType), "success") {
		status = "success"
	}

	return &providers.WebhookEvent{
		Event:     webhookData.EventType,
		Reference: webhookData.Data.Transaction.TransactionID,
		Amount:    webhookData.Data.Transaction.Amount,
		Status:    status,
		Provider:  n.Name(),
	}, nil
}

// Unimplemented (required by Provider interface)

func (n *Nomba) RefundTransaction(req providers.RefundRequest) (*providers.RefundResponse, error) {
	return nil, fmt.Errorf("nomba: refund not yet implemented")
}

func (n *Nomba) CreateTransferRecipient(req providers.TransferRecipientRequest) (*providers.TransferRecipientResponse, error) {
	return nil, fmt.Errorf("nomba: transfer recipient not yet implemented")
}

func (n *Nomba) InitiateTransfer(req providers.TransferRequest) (*providers.TransferResponse, error) {
	return nil, fmt.Errorf("nomba: transfer not yet implemented")
}

func (n *Nomba) CreatePlan(req providers.PlanRequest) (*providers.PlanResponse, error) {
	return nil, fmt.Errorf("nomba: plans not yet implemented")
}

func (n *Nomba) CreateSubscription(req providers.SubscriptionRequest) (*providers.SubscriptionResponse, error) {
	return nil, fmt.Errorf("nomba: subscriptions not yet implemented")
}

func (n *Nomba) CancelSubscription(subscriptionCode string, emailToken string) error {
	return fmt.Errorf("nomba: cancel subscription not yet implemented")
}

func (n *Nomba) ChargeToken(req providers.ChargeTokenRequest) (*providers.TransactionResponse, error) {
	return nil, fmt.Errorf("nomba: charge token not yet implemented")
}
