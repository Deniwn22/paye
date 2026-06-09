package paystack

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ttomsin/paye/internal/features/providers"
)

// Recipient details for creating a transfer recipient
type paystackRecipientDetails struct {
	AccountNumber string `json:"account_number"`
	BankCode      string `json:"bank_code"`
}

type paystackCreateRecipientRequest struct {
	Type          string `json:"type"` // always "nuban" for Nigerian bank accounts
	Name          string `json:"name"`
	AccountNumber string `json:"account_number"`
	BankCode      string `json:"bank_code"`
	Currency      string `json:"currency"`
}

type paystackRecipientData struct {
	RecipientCode string `json:"recipient_code"`
}

type paystackCreateRecipientResponse struct {
	Status  bool                  `json:"status"`
	Message string                `json:"message"`
	Data    paystackRecipientData `json:"data"`
}

type paystackResolveAccountResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		AccountNumber string `json:"account_number"`
		AccountName   string `json:"account_name"`
	} `json:"data"`
}

func (p *Paystack) CreateTransferRecipient(req providers.TransferRecipientRequest) (*providers.TransferRecipientResponse, error) {
	if req.Name == "" {
		resolvedName := "Recipient (" + req.AccountNumber + ")"
		respResolve, errResolve := p.makeRequest("GET", p.getBaseURL()+"/bank/resolve?account_number="+req.AccountNumber+"&bank_code="+req.BankCode, nil)
		if errResolve == nil {
			defer respResolve.Body.Close()
			if respResolve.StatusCode == http.StatusOK {
				var resData paystackResolveAccountResponse
				if errDec := json.NewDecoder(respResolve.Body).Decode(&resData); errDec == nil && resData.Status {
					if resData.Data.AccountName != "" {
						resolvedName = resData.Data.AccountName
					}
				}
			}
		}
		req.Name = resolvedName
	}

	pReq := paystackCreateRecipientRequest{
		Type:          "nuban",
		Name:          req.Name,
		AccountNumber: req.AccountNumber,
		BankCode:      req.BankCode,
		Currency:      req.Currency,
	}

	body, err := json.Marshal(pReq)
	if err != nil {
		return nil, err
	}

	resp, err := p.makeRequest("POST", p.getBaseURL()+"/transferrecipient", body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return nil, fmt.Errorf("paystack recipient error: %s", errResult["message"])
	}

	var result paystackCreateRecipientResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &providers.TransferRecipientResponse{
		Status:        result.Status,
		Message:       result.Message,
		RecipientCode: result.Data.RecipientCode,
		Provider:      p.Name(),
	}, nil
}

// InitiateTransferRequest is the request body for initiating a transfer
type paystackInitiateTransferRequest struct {
	Source    string `json:"source"` // always "balance"
	Amount    int    `json:"amount"`
	Recipient string `json:"recipient"`
	Reason    string `json:"reason,omitempty"`
	Reference string `json:"reference,omitempty"`
	Currency  string `json:"currency,omitempty"`
}

type paystackTransferData struct {
	TransferCode string `json:"transfer_code"`
	Reference    string `json:"reference"`
	Amount       int    `json:"amount"`
	Currency     string `json:"currency"`
}

type paystackInitiateTransferResponse struct {
	Status  bool                 `json:"status"`
	Message string               `json:"message"`
	Data    paystackTransferData `json:"data"`
}

func (p *Paystack) InitiateTransfer(req providers.TransferRequest) (*providers.TransferResponse, error) {
	pReq := paystackInitiateTransferRequest{
		Source:    "balance",
		Amount:    p.calculateAmount(req.Amount),
		Recipient: req.RecipientCode,
		Reason:    req.Reason,
		Reference: req.Reference,
		Currency:  req.Currency,
	}

	body, err := json.Marshal(pReq)
	if err != nil {
		return nil, err
	}

	resp, err := p.makeRequest("POST", p.getBaseURL()+"/transfer", body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return nil, fmt.Errorf("paystack transfer error: %s", errResult["message"])
	}

	var result paystackInitiateTransferResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &providers.TransferResponse{
		Status:       result.Status,
		Message:      result.Message,
		TransferCode: result.Data.TransferCode,
		Reference:    result.Data.Reference,
		Amount:       float64(result.Data.Amount) / 100,
		Currency:     result.Data.Currency,
		Provider:     p.Name(),
	}, nil
}
