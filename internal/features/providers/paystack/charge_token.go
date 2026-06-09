package paystack

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ttomsin/paye/internal/features/providers"
)

type paystackChargeAuthorizationRequest struct {
	Email             string `json:"email"`
	Amount            int    `json:"amount"`
	AuthorizationCode string `json:"authorization_code"`
	Reference         string `json:"reference"`
	Currency          string `json:"currency,omitempty"`
}

func (p *Paystack) ChargeToken(req providers.ChargeTokenRequest) (*providers.TransactionResponse, error) {
	pReq := paystackChargeAuthorizationRequest{
		Email:             req.Email,
		Amount:            p.calculateAmount(req.Amount),
		AuthorizationCode: req.Authorization,
		Reference:         req.Reference,
		Currency:          req.Currency,
	}

	body, err := json.Marshal(pReq)
	if err != nil {
		return nil, err
	}

	resp, err := p.makeRequest("POST", p.getBaseURL()+"/transaction/charge_authorization", body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return nil, fmt.Errorf("paystack charge token error: %v", errResult["message"])
	}

	var result paystackTransactionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	tResp := &providers.TransactionResponse{
		Status:    result.Status,
		Message:   result.Message,
		Reference: result.Data.Reference,
		Provider:  p.Name(),
	}

	return tResp, nil
}
