package paystack

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"fmt"

	provider "github.com/ttomsin/paye/internal/features/providers"
)

type paystackWebhookPayload struct {
	Event string         `json:"event"`
	Data  map[string]any `json:"data"`
}

func (p *Paystack) HandleWebhook(signature string, payload []byte) (*provider.WebhookEvent, error) {
	if !p.verifySignature(signature, payload) {
		return nil, fmt.Errorf("Invalid Paystack signature")
	}

	var webhookData paystackWebhookPayload
	if err := json.Unmarshal(payload, &webhookData); err != nil {
		return nil, err
	}

	reference, _ := webhookData.Data["reference"].(string)
	amount, _ := webhookData.Data["amount"].(float64)
	status, _ := webhookData.Data["status"].(string)

	return &provider.WebhookEvent{
		Event:     webhookData.Event,
		Reference: reference,
		Amount:    amount,
		Status:    status,
		Provider:  p.Name(),
	}, nil
}

func (p *Paystack) verifySignature(signature string, payload []byte) bool {
	//Hash payload with hmac sha 512 and compare with signature
	hash := hmac.New(sha512.New, []byte(p.apiKey))
	hash.Write(payload)
	expectedSignature := hex.EncodeToString(hash.Sum(nil))
	return signature == expectedSignature
}
