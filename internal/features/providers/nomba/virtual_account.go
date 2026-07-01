package nomba

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ttomsin/paye/internal/features/providers"
)

// Nomba request/response shapes

type nombaCreateVARequest struct {
	AccountRef     string  `json:"accountRef"`
	AccountName    string  `json:"accountName"`
	Currency       string  `json:"currency"`
	BVN            string  `json:"bvn,omitempty"`
	ExpectedAmount float64 `json:"expectedAmount,omitempty"`
	ExpiryDate     string  `json:"expiryDate,omitempty"`
}

type nombaVAData struct {
	AccountRef        string `json:"accountRef"`
	BankAccountNumber string `json:"bankAccountNumber"`
	BankAccountName   string `json:"bankAccountName"`
	AccountName       string `json:"accountName"`
	BankName          string `json:"bankName"`
	Currency          string `json:"currency"`
	Status            string `json:"status"`
}

type nombaVAResponse struct {
	Code        string      `json:"code"`
	Description string      `json:"description"`
	Data        nombaVAData `json:"data"`
}

// CreateVirtualAccount implements VirtualAccountProvider
func (n *Nomba) CreateVirtualAccount(ctx context.Context, req providers.CreateVARequest) (*providers.VirtualAccount, error) {
	nombaReq := nombaCreateVARequest{
		AccountRef:     req.AccountRef,
		AccountName:    req.AccountName,
		Currency:       req.Currency,
		BVN:            req.BVN,
		ExpectedAmount: req.ExpectedAmount,
		ExpiryDate:     req.ExpiryDate,
	}

	body, err := json.Marshal(nombaReq)
	if err != nil {
		return nil, fmt.Errorf("nomba: failed to marshal create VA request: %w", err)
	}

	endpoint := n.getBaseURL() + "/accounts/virtual"
	if req.SubAccountID != "" {
		endpoint = fmt.Sprintf("%s/%s", endpoint, req.SubAccountID)
	}

	resp, err := n.makeRequest("POST", endpoint, body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return nil, fmt.Errorf("nomba: create VA error: %v", errResult)
	}

	var result nombaVAResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("nomba: failed to decode create VA response: %w", err)
	}

	if result.Code != "00" {
		return nil, fmt.Errorf("nomba: create VA failed: %s", result.Description)
	}

	return &providers.VirtualAccount{
		AccountRef:    result.Data.AccountRef,
		AccountNumber: result.Data.BankAccountNumber,
		AccountName:   result.Data.BankAccountName,
		BankName:      result.Data.BankName,
		Currency:      result.Data.Currency,
		Status:        result.Data.Status,
		CreatedAt:     time.Now(),
	}, nil
}

// GetVirtualAccount implements VirtualAccountProvider
func (n *Nomba) GetVirtualAccount(ctx context.Context, accountRef string) (*providers.VirtualAccount, error) {
	resp, err := n.makeRequest("GET", n.getBaseURL()+"/accounts/virtual/"+accountRef, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return nil, fmt.Errorf("nomba: get VA error: %v", errResult)
	}

	var result nombaVAResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("nomba: failed to decode get VA response: %w", err)
	}

	if result.Code != "00" {
		return nil, fmt.Errorf("nomba: get VA failed: %s", result.Description)
	}

	return &providers.VirtualAccount{
		AccountRef:    result.Data.AccountRef,
		AccountNumber: result.Data.BankAccountNumber,
		AccountName:   result.Data.BankAccountName,
		BankName:      result.Data.BankName,
		Currency:      result.Data.Currency,
		Status:        result.Data.Status,
		CreatedAt:     time.Now(),
	}, nil
}

// SuspendVirtualAccount implements VirtualAccountProvider
func (n *Nomba) SuspendVirtualAccount(ctx context.Context, accountRef string) error {
	resp, err := n.makeRequest("PUT", n.getBaseURL()+"/accounts/suspend/"+accountRef, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return fmt.Errorf("nomba: suspend VA error: %v", errResult)
	}

	return nil
}

type nombaUpdateVARequest struct {
	AccountName string `json:"accountName,omitempty"`
	CallbackURL string `json:"callbackUrl,omitempty"`
}

func (n *Nomba) UpdateVirtualAccount(ctx context.Context, accountRef string, req providers.UpdateVARequest) error {
	nombaReq := nombaUpdateVARequest{
		AccountName: req.AccountName,
		CallbackURL: req.CallbackURL,
	}

	body, err := json.Marshal(nombaReq)
	if err != nil {
		return fmt.Errorf("nomba: failed to marshal update VA request: %w", err)
	}

	resp, err := n.makeRequest("PUT", n.getBaseURL()+"/accounts/virtual/"+accountRef, body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return fmt.Errorf("nomba: update VA error: %v", errResult)
	}

	return nil
}

func (n *Nomba) ExpireVirtualAccount(ctx context.Context, accountRef string) error {
	resp, err := n.makeRequest("DELETE", n.getBaseURL()+"/accounts/virtual/"+accountRef, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return fmt.Errorf("nomba: expire VA error: %v", errResult)
	}

	return nil
}
