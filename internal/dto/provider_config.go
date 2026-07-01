package dto

import "github.com/ttomsin/paye/internal/models"

type ProviderType string

const (
	Paystack ProviderType = "paystack"
)

type ProviderConfigRequest struct {
	Label             string            `json:"label" binding:"required" example:"My Paystack Account" description:"A friendly name to identify this configuration"`
	ProviderName      ProviderType      `json:"provider_name" binding:"required" example:"paystack" enums:"paystack,flutterwave,nomba,opay" description:"The supported payment provider"`
	SecretKey         string            `json:"secret_key" description:"(Legacy) Use Test/Live keys instead"`
	PublicKey         string            `json:"public_key" description:"(Legacy) Use Test/Live keys instead"`
	TestSecretKey     string            `json:"test_secret_key" example:"sk_test_123" description:"Secret key for test environment"`
	TestPublicKey     string            `json:"test_public_key" example:"pk_test_123" description:"Public key for test environment"`
	LiveSecretKey     string            `json:"live_secret_key" example:"sk_live_123" description:"Secret key for live environment"`
	LivePublicKey     string            `json:"live_public_key" example:"pk_live_123" description:"Public key for live environment"`
	TestWebhookSecret string            `json:"test_webhook_secret" description:"Webhook secret for verifying test payloads"`
	LiveWebhookSecret string            `json:"live_webhook_secret" description:"Webhook secret for verifying live payloads"`
	IsActive          bool              `json:"is_active" example:"true" description:"Whether this configuration is currently active for routing"`
	Metadata          map[string]string `json:"metadata" description:"Optional extra config (e.g. Account IDs for Nomba/Opay)"`
}

type ProviderConfigResponse struct {
	ID                string            `json:"id" example:"uuid"`
	Label             string            `json:"label" example:"My Paystack Account"`
	ProviderName      string            `json:"provider_name" example:"paystack" enums:"paystack,flutterwave,nomba,opay"`
	SecretKey         string            `json:"secret_key"` // legacy
	PublicKey         string            `json:"public_key"` // legacy
	TestSecretKey     string            `json:"test_secret_key"`
	TestPublicKey     string            `json:"test_public_key"`
	LiveSecretKey     string            `json:"live_secret_key"`
	LivePublicKey     string            `json:"live_public_key"`
	TestWebhookSecret string            `json:"test_webhook_secret"`
	LiveWebhookSecret string            `json:"live_webhook_secret"`
	IsActive          bool              `json:"is_active" example:"true"`
	Metadata          map[string]string `json:"metadata"`
}

func ToProviderConfigResponse(config *models.ProviderConfig) *ProviderConfigResponse {
	return &ProviderConfigResponse{
		ID:                config.Base.ID.String(),
		Label:             config.Label,
		ProviderName:      config.ProviderName,
		SecretKey:         config.SecretKey,
		PublicKey:         config.PublicKey,
		TestSecretKey:     config.TestSecretKey,
		TestPublicKey:     config.TestPublicKey,
		LiveSecretKey:     config.LiveSecretKey,
		LivePublicKey:     config.LivePublicKey,
		TestWebhookSecret: config.TestWebhookSecret,
		LiveWebhookSecret: config.LiveWebhookSecret,
		IsActive:          config.IsActive,
		Metadata:          config.Metadata,
	}
}

func ToProviderConfig(config *ProviderConfigRequest) *models.ProviderConfig {
	return &models.ProviderConfig{
		Label:             config.Label,
		ProviderName:      string(config.ProviderName),
		SecretKey:         config.SecretKey,
		PublicKey:         config.PublicKey,
		TestSecretKey:     config.TestSecretKey,
		TestPublicKey:     config.TestPublicKey,
		LiveSecretKey:     config.LiveSecretKey,
		LivePublicKey:     config.LivePublicKey,
		TestWebhookSecret: config.TestWebhookSecret,
		LiveWebhookSecret: config.LiveWebhookSecret,
		IsActive:          config.IsActive,
		Metadata:          config.Metadata,
	}
}
