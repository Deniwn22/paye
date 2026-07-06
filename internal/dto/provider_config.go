package dto

import "github.com/ttomsin/paye/internal/models"

type ProviderType string

const (
	Paystack ProviderType = "paystack"
)

type ProviderConfigRequest struct {
	Label         string                  `json:"label" binding:"required" example:"My Paystack Account" description:"A friendly name to identify this configuration"`
	ProviderName  ProviderType            `json:"provider_name" binding:"required" example:"paystack" enums:"paystack,flutterwave,nomba,opay" description:"The supported payment provider"`
	SecretKey     string                  `json:"secret_key" binding:"required" example:"sk_test_123" description:"Secret key for this environment"`
	PublicKey     string                  `json:"public_key" example:"pk_test_123" description:"Public key for this environment"`
	WebhookSecret string                  `json:"webhook_secret" description:"Webhook secret for verifying payloads"`
	IsActive      bool                    `json:"is_active" example:"true" description:"Whether this configuration is currently active for routing"`
	Metadata      models.ProviderMetadata `json:"metadata" description:"Optional extra config (e.g. Account IDs for Nomba)"`
}

type ProviderConfigResponse struct {
	ID            string                  `json:"id" example:"uuid"`
	Label         string                  `json:"label" example:"My Paystack Account"`
	ProviderName  string                  `json:"provider_name" example:"paystack" enums:"paystack,flutterwave,nomba,opay"`
	Environment   string                  `json:"environment" example:"test" enums:"test,live"`
	SecretKey     string                  `json:"secret_key"`
	PublicKey     string                  `json:"public_key"`
	WebhookSecret string                  `json:"webhook_secret"`
	IsActive      bool                    `json:"is_active" example:"true"`
	Metadata      models.ProviderMetadata `json:"metadata"`
	VACount       int64                   `json:"va_count" example:"100"`
}

func ToProviderConfigResponse(config *models.ProviderConfig) *ProviderConfigResponse {
	return &ProviderConfigResponse{
		ID:            config.Base.ID.String(),
		Label:         config.Label,
		ProviderName:  config.ProviderName,
		Environment:   config.Environment,
		SecretKey:     config.SecretKey,
		PublicKey:     config.PublicKey,
		WebhookSecret: config.WebhookSecret,
		IsActive:      config.IsActive,
		Metadata:      config.Metadata,
	}
}

func ToProviderConfig(config *ProviderConfigRequest, env string) *models.ProviderConfig {
	return &models.ProviderConfig{
		Label:         config.Label,
		ProviderName:  string(config.ProviderName),
		Environment:   env,
		SecretKey:     config.SecretKey,
		PublicKey:     config.PublicKey,
		WebhookSecret: config.WebhookSecret,
		IsActive:      config.IsActive,
		Metadata:      config.Metadata,
	}
}

