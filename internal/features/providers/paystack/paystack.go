package paystack

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ttomsin/paye/internal/features/providers"
)

const base_url = "https://api.paystack.co"
const initialize_url = base_url + "/transaction/initialize"
const verify_url = base_url + "/transaction/verify"

type ApiType string

const (
	Live ApiType = "live"
	Test ApiType = "test"
)

type Paystack struct {
	apiKey  string
	ApiType ApiType
	BaseURL string
}

func (p *Paystack) getBaseURL() string {
	if p.BaseURL != "" {
		return p.BaseURL
	}
	return "https://api.paystack.co"
}

type paystackTransactionRequest struct {
	Email     string `json:"email"`
	Amount    int    `json:"amount"`
	Currency  string `json:"currency,omitempty"`
	Reference string `json:"reference,omitempty"`
}

type paystackInitData struct {
	AuthorizationURL string `json:"authorization_url"`
	AccessCode       string `json:"access_code"`
	Reference        string `json:"reference"`
}

type paystackTransactionResponse struct {
	Status  bool             `json:"status"`
	Message string           `json:"message"`
	Data    paystackInitData `json:"data"`
}

// paystackVerifyData
type paystackCustomer struct {
	Email string `json:"email"`
}

type paystackVerifyData struct {
	Status    string           `json:"status"`
	Reference string           `json:"reference"`
	Amount    int              `json:"amount"`
	Currency  string           `json:"currency"`
	Customer  paystackCustomer `json:"customer"`
}

type paystackVerifyResponse struct {
	Status  bool               `json:"status"`
	Message string             `json:"message"`
	Data    paystackVerifyData `json:"data"`
}

func New(apiKey string) *Paystack {
	return &Paystack{
		apiKey: apiKey,
	}
}

// implements the provider interface
var _ providers.Provider = (*Paystack)(nil)

func (p *Paystack) Name() string {
	return "paystack"
}

// Initializes a transaction with Paystack and returns the response
func (p *Paystack) InitializeTransaction(req providers.TransactionRequest) (*providers.TransactionResponse, error) {
	// uses email & amount to initialize transaction
	// convert req to JSON
	pReq := paystackTransactionRequest{
		Email:     req.Email,
		Amount:    int(req.Amount * 100),
		Currency:  req.Currency,
		Reference: req.Reference,
	}
	body, err := json.MarshalIndent(pReq, "", "  ")
	if err != nil {
		return nil, err
	}
	// make request to Paystack API
	resp, err := p.makeRequest("POST", p.getBaseURL()+"/transaction/initialize", body)
	if err != nil {
		return nil, err
	}

	// check response status
	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return nil, fmt.Errorf("paystack error: %s", errResult["message"])
	}
	// parse response
	// paystack wraps response in
	// { status, message, data:{}}
	var result paystackTransactionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	tResp := &providers.TransactionResponse{
		Status:    result.Status,
		Message:   result.Message,
		Reference: result.Data.Reference,
		AuthURL:   result.Data.AuthorizationURL,
		Provider:  p.Name(),
	}

	return tResp, nil
}

func (p *Paystack) VerifyTransaction(reference string) (*providers.TransactionResponse, error) {
	res, err := p.makeRequest("GET", fmt.Sprintf("%s/transaction/verify/%s", p.getBaseURL(), reference), nil)
	if err != nil {
		return nil, err
	}

	if res.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(res.Body).Decode(&errResult)
		return nil, fmt.Errorf("paystack error: %s", errResult["message"])
	}

	var result paystackVerifyResponse
	if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
		return nil, err
	}

	tResp := &providers.TransactionResponse{
		Status:    result.Status && result.Data.Status == "success",
		Message:   result.Message,
		Reference: result.Data.Reference,
		Amount:    float64(result.Data.Amount) / 100,
		Currency:  result.Data.Currency,
		Provider:  p.Name(),
	}

	return tResp, nil
}

// A private http client method that makes requests to the Paystack API
func (p *Paystack) makeRequest(method string, url string, body []byte) (*http.Response, error) {
	req, err := http.NewRequest(method, url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	client := &http.Client{}
	req.Header.Set("Authorization", "Bearer "+p.apiKey)
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// A base function for calculating the amount in the smallest currency unit
// For now it's just nigeria
func (p *Paystack) calculateAmount(amount float64) int {
	return int(amount * 100)
}
