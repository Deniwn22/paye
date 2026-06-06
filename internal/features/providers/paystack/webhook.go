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

	// Extract authorization code from charge.success
	authorizationCode := ""
	if auth, ok := webhookData.Data["authorization"].(map[string]any); ok {
		if code, ok := auth["authorization_code"].(string); ok {
			authorizationCode = code
		}
	}

	// Extract subscription code — lives directly on data for subscription.disable
	subscriptionCode := ""
	if sub, ok := webhookData.Data["subscription_code"].(string); ok {
		subscriptionCode = sub
	}

	// For invoice.payment_failed, subscription is nested inside data
	if webhookData.Event == "invoice.payment_failed" {
		if subMap, ok := webhookData.Data["subscription"].(map[string]any); ok {
			if code, ok := subMap["subscription_code"].(string); ok {
				subscriptionCode = code
			}
		}
	}

	return &provider.WebhookEvent{
		Event:             webhookData.Event,
		Reference:         reference,
		Amount:            amount / 100,
		Status:            status,
		Provider:          p.Name(),
		AuthorizationCode: authorizationCode,
		SubscriptionCode:  subscriptionCode,
	}, nil
}

func (p *Paystack) verifySignature(signature string, payload []byte) bool {
	//Hash payload with hmac sha 512 and compare with signature
	hash := hmac.New(sha512.New, []byte(p.apiKey))
	hash.Write(payload)
	expectedSignature := hex.EncodeToString(hash.Sum(nil))
	return signature == expectedSignature
}
