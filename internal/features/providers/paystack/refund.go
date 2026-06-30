package paystack

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ttomsin/paye/internal/features/providers"
)

type paystackRefundRequest struct {
	Transaction  string `json:"transaction"`
	Amount       int    `json:"amount,omitempty"`
	Currency     string `json:"currency,omitempty"`
	CustomerNote string `json:"customer_note,omitempty"`
	MerchantNote string `json:"merchant_note,omitempty"`
}

type paystackRefundData struct {
	Transaction string `json:"transaction"`
	Amount      int    `json:"amount"`
	Currency    string `json:"currency"`
}

type paystackRefundResponse struct {
	Status  bool               `json:"status"`
	Message string             `json:"message"`
	Data    paystackRefundData `json:"data"`
}

func (p *Paystack) RefundTransaction(req providers.RefundRequest) (*providers.RefundResponse, error) {
	pReq := paystackRefundRequest{
		Transaction:  req.TransactionReference,
		Currency:     req.Currency,
		CustomerNote: req.CustomerNote,
		MerchantNote: req.MerchantNote,
	}

	// only set amount if it's a partial refund
	if req.Amount > 0 {
		pReq.Amount = p.calculateAmount(req.Amount)
	}

	body, err := json.Marshal(pReq)
	if err != nil {
		return nil, err
	}

	resp, err := p.makeRequest("POST", p.getBaseURL()+"/refund", body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return nil, fmt.Errorf("paystack refund error: %s", errResult["message"])
	}

	var result paystackRefundResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &providers.RefundResponse{
		Status:         result.Status,
		Message:        result.Message,
		TransactionRef: result.Data.Transaction,
		Amount:         float64(result.Data.Amount) / 100,
		Currency:       result.Data.Currency,
		Provider:       p.Name(),
	}, nil
}
