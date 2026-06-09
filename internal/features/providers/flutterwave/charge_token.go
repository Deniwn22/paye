package flutterwave

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ttomsin/paye/internal/features/providers"
)

type flutterwaveTokenizedChargeRequest struct {
	Token    string  `json:"token"`
	Currency string  `json:"currency"`
	Amount   float64 `json:"amount"`
	Email    string  `json:"email"`
	TxRef    string  `json:"tx_ref"`
}

func (f *Flutterwave) ChargeToken(req providers.ChargeTokenRequest) (*providers.TransactionResponse, error) {
	fwReq := flutterwaveTokenizedChargeRequest{
		Token:    req.Authorization,
		Currency: req.Currency,
		Amount:   req.Amount,
		Email:    req.Email,
		TxRef:    req.Reference,
	}

	body, err := json.Marshal(fwReq)
	if err != nil {
		return nil, err
	}

	resp, err := f.makeRequest("POST", f.getBaseURL()+"/tokenized-charges", body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		msg := "unknown error"
		if m, ok := errResult["message"].(string); ok {
			msg = m
		}
		return nil, fmt.Errorf("flutterwave charge token error: %s", msg)
	}

type fwTokenizedChargeData struct {
	TxRef string `json:"tx_ref"`
}

type fwTokenizedChargeResponse struct {
	Status  string                `json:"status"`
	Message string                `json:"message"`
	Data    fwTokenizedChargeData `json:"data"`
}

	var result fwTokenizedChargeResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	tResp := &providers.TransactionResponse{
		Status:    result.Status == "success",
		Message:   result.Message,
		Reference: result.Data.TxRef,
		Provider:  f.Name(),
	}

	return tResp, nil
}
