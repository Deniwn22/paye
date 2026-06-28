package opay

import (
	"crypto/hmac"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/features/providers"
)

const (
	stagingBaseURL    = "https://testapi.opaycheckout.com"
	productionBaseURL = "https://liveapi.opaycheckout.com"

	cashierCreatePath = "/api/v1/international/cashier/create"
	cashierStatusPath = "/api/v1/international/cashier/status"
)

// Provider implements provider.Provider for OPay Cashier.
type Provider struct {
	publicKey  string
	secretKey  string
	merchantID string
	baseURL    string
}

// New returns an OPay Provider. Set sandbox=true during development.
func New(publicKey, secretKey, merchantID string, sandbox bool) *Provider {
	base := productionBaseURL
	if sandbox {
		base = stagingBaseURL
	}
	if sandbox {
		if envSandbox := os.Getenv("OPAY_SANDBOX_BASE_URL"); envSandbox != "" {
			base = envSandbox
		}
	} else {
		if envLive := os.Getenv("OPAY_LIVE_BASE_URL"); envLive != "" {
			base = envLive
		}
	}
	return &Provider{
		publicKey:  publicKey,
		secretKey:  secretKey,
		merchantID: merchantID,
		baseURL:    base,
	}
}

// Name returns the provider identifier.
func (p *Provider) Name() string {
	return "opay"
}

// ── InitializeTransaction ─────────────────────────────────────────────────────

type cashierCreateRequest struct {
	Country     string         `json:"country"`
	Reference   string         `json:"reference"`
	Amount      cashierAmount  `json:"amount"`
	ReturnURL   string         `json:"returnUrl"`
	CallbackURL string         `json:"callbackUrl"`
	CancelURL   string         `json:"cancelUrl,omitempty"`
	Product     cashierProduct `json:"product"`
	UserInfo    *cashierUser   `json:"userInfo,omitempty"`
	ExpireAt    int            `json:"expireAt,omitempty"`
}

type cashierAmount struct {
	Total    int64  `json:"total"`    // kobo (smallest currency unit)
	Currency string `json:"currency"` // "NGN"
}

type cashierProduct struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type cashierUser struct {
	UserID     string `json:"userId,omitempty"`
	UserName   string `json:"userName,omitempty"`
	UserEmail  string `json:"userEmail,omitempty"`
	UserMobile string `json:"userMobile,omitempty"`
}

type cashierCreateResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Data    struct {
		Reference  string        `json:"reference"`
		OrderNo    string        `json:"orderNo"`
		CashierURL string        `json:"cashierUrl"`
		Status     string        `json:"status"`
		Amount     cashierAmount `json:"amount"`
	} `json:"data"`
}

// InitializeTransaction creates an OPay Cashier payment and returns the
// checkout URL as AuthorizationURL for the merchant to redirect to.
//
// Auth: Public Key in Authorization header — no HMAC needed for create.
func (p *Provider) InitializeTransaction(req providers.TransactionRequest) (*providers.TransactionResponse, error) {
	productName := "Payment"
	productDesc := "Paye transaction reference: " + req.Reference
	var webhookURL string
	if req.Metadata != nil {
		if name, ok := req.Metadata["product_name"].(string); ok && name != "" {
			productName = name
		}
		if desc, ok := req.Metadata["product_description"].(string); ok && desc != "" {
			productDesc = desc
		}
		if wh, ok := req.Metadata["webhook_url"].(string); ok {
			webhookURL = wh
		}
	}

	body := cashierCreateRequest{
		Country:   "NG",
		Reference: req.Reference,
		Amount: cashierAmount{
			Total:    int64(req.Amount * 100), // convert main units (Naira) to minor units (Kobo)
			Currency: req.Currency,
		},
		ReturnURL:   req.CallbackURL, // where the customer lands after payment
		CallbackURL: webhookURL,      // OPay server-to-server webhook
		Product: cashierProduct{
			Name:        productName,
			Description: productDesc,
		},
	}

	if req.Email != "" {
		body.UserInfo = &cashierUser{
			UserEmail: req.Email,
		}
	}

	rawBody, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("opay: marshal create request: %w", err)
	}

	httpReq, err := http.NewRequest(http.MethodPost, p.baseURL+cashierCreatePath, strings.NewReader(string(rawBody)))
	if err != nil {
		return nil, fmt.Errorf("opay: build create request: %w", err)
	}

	// Cashier Create uses the Public Key directly in the Authorization header.
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+p.publicKey)
	httpReq.Header.Set("MerchantId", p.merchantID)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("opay: create http: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("opay: read create response: %w", err)
	}

	var opayResp cashierCreateResponse
	if err := json.Unmarshal(respBytes, &opayResp); err != nil {
		return nil, fmt.Errorf("opay: decode create response: %w", err)
	}

	if opayResp.Code != "00000" {
		return nil, fmt.Errorf("opay: initialize failed [%s]: %s", opayResp.Code, opayResp.Message)
	}

	return &providers.TransactionResponse{
		Status:     true,
		StatusText: string(providers.StatusPending),
		Reference:  opayResp.Data.Reference,
		AuthURL:    opayResp.Data.CashierURL,
		AccessCode: opayResp.Data.OrderNo, // OPay's internal order number; useful for status queries
		Provider:   p.Name(),
	}, nil
}

// ── VerifyTransaction ─────────────────────────────────────────────────────────

type cashierStatusRequest struct {
	Country   string `json:"country"`
	Reference string `json:"reference"`
}

type cashierStatusResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Data    struct {
		Reference     string        `json:"reference"`
		OrderNo       string        `json:"orderNo"`
		Status        string        `json:"status"` // INITIAL | PENDING | SUCCESS | FAIL | CLOSE
		Amount        cashierAmount `json:"amount"`
		FailureCode   string        `json:"failureCode"`
		FailureReason string        `json:"failureReason"`
	} `json:"data"`
}

// VerifyTransaction queries OPay for the live status of a payment.
//
// Auth: HMAC-SHA512 of the raw JSON request body, signed with the Secret Key.
func (p *Provider) VerifyTransaction(reference string) (*providers.TransactionResponse, error) {
	body := cashierStatusRequest{
		Country:   "NG",
		Reference: reference,
	}

	rawBody, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("opay: marshal status request: %w", err)
	}

	// Status endpoints use HMAC-SHA512 of the JSON body signed with the secret key.
	sig := crypto.HmacSHA512Hex(string(rawBody), p.secretKey)

	httpReq, err := http.NewRequest(http.MethodPost, p.baseURL+cashierStatusPath, strings.NewReader(string(rawBody)))
	if err != nil {
		return nil, fmt.Errorf("opay: build status request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+sig)
	httpReq.Header.Set("MerchantId", p.merchantID)

	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("opay: status http: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("opay: read status response: %w", err)
	}

	var opayResp cashierStatusResponse
	if err := json.Unmarshal(respBytes, &opayResp); err != nil {
		return nil, fmt.Errorf("opay: decode status response: %w", err)
	}

	if opayResp.Code != "00000" {
		return nil, fmt.Errorf("opay: status query failed [%s]: %s", opayResp.Code, opayResp.Message)
	}

	mappedStatus := mapStatus(opayResp.Data.Status)

	return &providers.TransactionResponse{
		Status:     mappedStatus == string(providers.StatusSuccess),
		StatusText: mappedStatus,
		Reference:  opayResp.Data.Reference,
		Amount:     float64(opayResp.Data.Amount.Total) / 100, // convert minor units to main units
		Currency:   opayResp.Data.Amount.Currency,
		Message:    opayResp.Data.FailureReason,
		Provider:   p.Name(),
	}, nil
}

// ── HandleWebhook ─────────────────────────────────────────────────────────────

type opayCallbackPayload struct {
	Amount           string `json:"amount"`
	Channel          string `json:"channel"`
	Country          string `json:"country"`
	Currency         string `json:"currency"`
	DisplayedFailure string `json:"displayedFailure"`
	Fee              string `json:"fee"`
	FeeCurrency      string `json:"feeCurrency"`
	InstrumentType   string `json:"instrumentType"`
	Reference        string `json:"reference"`
	Refunded         bool   `json:"refunded"`
	Status           string `json:"status"`
	Timestamp        string `json:"timestamp"`
	Token            string `json:"token"`
	TransactionID    string `json:"transactionId"`
	UpdatedAt        string `json:"updated_at"`
}

type opayWebhookBody struct {
	Payload opayCallbackPayload `json:"payload"`
	SHA512  string              `json:"sha512"`
	Type    string              `json:"type"`
}

// HandleWebhook verifies an OPay callback and returns a normalised WebhookEvent.
//
// OPay callback signatures are HMAC-SHA3-512 (not SHA-512!) of a specifically
// formatted string — NOT the raw JSON body. The exact format is:
//
//	{Amount:"%s",Currency:"%s",Reference:"%s",Refunded:%s,Status:"%s",Timestamp:"%s",Token:"%s",TransactionID:"%s"}
//
// where Refunded is the literal string "t" or "f".
func (p *Provider) HandleWebhook(signature string, payload []byte) (*providers.WebhookEvent, error) {
	var wb opayWebhookBody
	if err := json.Unmarshal(payload, &wb); err != nil {
		return nil, fmt.Errorf("opay: decode webhook body: %w", err)
	}

	// Reconstruct the exact signature input string as documented by OPay.
	refundedStr := "f"
	if wb.Payload.Refunded {
		refundedStr = "t"
	}
	sigInput := fmt.Sprintf(
		`{Amount:"%s",Currency:"%s",Reference:"%s",Refunded:%s,Status:"%s",Timestamp:"%s",Token:"%s",TransactionID:"%s"}`,
		wb.Payload.Amount,
		wb.Payload.Currency,
		wb.Payload.Reference,
		refundedStr,
		wb.Payload.Status,
		wb.Payload.Timestamp,
		wb.Payload.Token,
		wb.Payload.TransactionID,
	)

	expected := crypto.HmacSHA3_512Hex(sigInput, p.secretKey)
	if !hmac.Equal([]byte(strings.ToLower(expected)), []byte(strings.ToLower(wb.SHA512))) {
		return nil, fmt.Errorf("opay: webhook signature mismatch")
	}

	var amount float64
	if wb.Payload.Amount != "" {
		var amtCents int64
		if _, err := fmt.Sscanf(wb.Payload.Amount, "%d", &amtCents); err == nil {
			amount = float64(amtCents) / 100
		}
	}

	return &providers.WebhookEvent{
		Event:     wb.Type,
		Reference: wb.Payload.Reference,
		Amount:    amount,
		Status:    mapStatus(wb.Payload.Status),
		Provider:  p.Name(),
	}, nil
}

// ── Unimplemented Methods (Required by Provider Interface) ───────────────────

func (p *Provider) RefundTransaction(req providers.RefundRequest) (*providers.RefundResponse, error) {
	return nil, errors.New("opay: refunds not yet implemented")
}

func (p *Provider) CreateTransferRecipient(req providers.TransferRecipientRequest) (*providers.TransferRecipientResponse, error) {
	return nil, errors.New("opay: transfers not yet implemented")
}

func (p *Provider) InitiateTransfer(req providers.TransferRequest) (*providers.TransferResponse, error) {
	return nil, errors.New("opay: transfers not yet implemented")
}

func (p *Provider) CreatePlan(req providers.PlanRequest) (*providers.PlanResponse, error) {
	return nil, errors.New("opay: plans not yet implemented")
}

func (p *Provider) CreateSubscription(req providers.SubscriptionRequest) (*providers.SubscriptionResponse, error) {
	return nil, errors.New("opay: subscriptions not yet implemented")
}

func (p *Provider) CancelSubscription(subscriptionCode string, emailToken string) error {
	return errors.New("opay: subscriptions not yet implemented")
}

func (p *Provider) ChargeToken(req providers.ChargeTokenRequest) (*providers.TransactionResponse, error) {
	return nil, errors.New("opay: token charge not yet implemented")
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// mapStatus converts OPay transaction statuses to Paye's normalised constants.
func mapStatus(opayStatus string) string {
	switch strings.ToUpper(opayStatus) {
	case "SUCCESS":
		return string(providers.StatusSuccess)
	case "FAIL", "CLOSE":
		return string(providers.StatusFailed)
	case "PENDING", "INITIAL":
		return string(providers.StatusPending)
	default:
		return string(providers.StatusPending)
	}
}
