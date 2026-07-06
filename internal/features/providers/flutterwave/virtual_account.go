package flutterwave

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ttomsin/paye/internal/features/providers"
)

type flwCreateVARequest struct {
	Email       string `json:"email"`
	FirstName   string `json:"firstname,omitempty"`
	LastName    string `json:"lastname,omitempty"`
	PhoneNumber string `json:"phonenumber,omitempty"`
	TxRef       string `json:"tx_ref"`
	IsPermanent bool   `json:"is_permanent"`
	Narration   string `json:"narration,omitempty"`
	Amount      int    `json:"amount"`
	Currency    string `json:"currency"`
}

type flwVAData struct {
	OrderRef      string `json:"order_ref"`
	AccountNumber string `json:"account_number"`
	BankName      string `json:"bank_name"`
	FlwRef        string `json:"flw_ref"`
	CreatedAt     string `json:"created_at"`
	ExpiryDate    string `json:"expiry_date"`
}

type flwVAResponse struct {
	Status  string    `json:"status"`
	Message string    `json:"message"`
	Data    flwVAData `json:"data"`
}

func (f *Flutterwave) CreateVirtualAccount(ctx context.Context, req providers.CreateVARequest) (*providers.VirtualAccount, error) {
	amount := int(req.ExpectedAmount)
	// Check if this is meant to be a dynamic VA
	isPermanent := true
	if req.ExpectedAmount > 0 || req.ExpiryDate != "" {
		isPermanent = false
	}

	flwReq := flwCreateVARequest{
		Email:       "customer@paye.africa", // placeholder if customer email is not provided
		TxRef:       req.AccountRef,         // Use AccountRef as tx_ref so webhooks map back easily
		IsPermanent: isPermanent,
		Narration:   req.AccountName,
		Amount:      amount,
		Currency:    req.Currency,
	}

	body, err := json.Marshal(flwReq)
	if err != nil {
		return nil, fmt.Errorf("flutterwave: failed to marshal create VA request: %w", err)
	}

	resp, err := f.makeRequest("POST", f.getBaseURL()+"/virtual-account-numbers", body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return nil, fmt.Errorf("flutterwave: create VA error: %v", errResult)
	}

	var result flwVAResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("flutterwave: failed to decode create VA response: %w", err)
	}

	if result.Status != "success" {
		return nil, fmt.Errorf("flutterwave: create VA failed: %s", result.Message)
	}

	return &providers.VirtualAccount{
		AccountRef:    req.AccountRef,
		AccountNumber: result.Data.AccountNumber,
		AccountName:   req.AccountName,
		BankName:      result.Data.BankName,
		Currency:      req.Currency,
		Status:        "active",
		CreatedAt:     time.Now(),
		Metadata: map[string]any{
			"order_ref": result.Data.OrderRef,
			"flw_ref":   result.Data.FlwRef,
		},
	}, nil
}

// GetVirtualAccount fetches an existing VA
func (f *Flutterwave) GetVirtualAccount(ctx context.Context, accountRef string) (*providers.VirtualAccount, error) {
	// NOTE: Flutterwave expects order_ref for lookup. Since the interface only provides accountRef,
	// the calling service should rely on its own DB to fetch the stored VirtualAccount.
	// We implement this just to satisfy the interface, but note it might not work accurately
	// if called directly with `accountRef` without `order_ref`.
	resp, err := f.makeRequest("GET", f.getBaseURL()+"/virtual-account-numbers/"+accountRef, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return nil, fmt.Errorf("flutterwave: get VA error: %v", errResult)
	}

	var result flwVAResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("flutterwave: failed to decode get VA response: %w", err)
	}

	if result.Status != "success" {
		return nil, fmt.Errorf("flutterwave: get VA failed: %s", result.Message)
	}

	return &providers.VirtualAccount{
		AccountRef:    accountRef,
		AccountNumber: result.Data.AccountNumber,
		BankName:      result.Data.BankName,
		Status:        "active",
		CreatedAt:     time.Now(),
		Metadata: map[string]any{
			"order_ref": result.Data.OrderRef,
			"flw_ref":   result.Data.FlwRef,
		},
	}, nil
}

func (f *Flutterwave) SuspendVirtualAccount(ctx context.Context, accountRef string) error {
	return fmt.Errorf("flutterwave: suspend VA not supported")
}

func (f *Flutterwave) UpdateVirtualAccount(ctx context.Context, accountRef string, req providers.UpdateVARequest) error {
	return fmt.Errorf("flutterwave: update VA not supported")
}

func (f *Flutterwave) ExpireVirtualAccount(ctx context.Context, accountRef string) error {
	return fmt.Errorf("flutterwave: expire VA not supported")
}

func (f *Flutterwave) PollVirtualAccountTransactions(ctx context.Context, startDate, endDate time.Time) ([]providers.VATransactionResult, error) {
	return nil, fmt.Errorf("flutterwave: polling va transactions not supported")
}
