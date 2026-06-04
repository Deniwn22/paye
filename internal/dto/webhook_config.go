package dto

import "github.com/ttomsin/paye/internal/models"

type WebhookConfigRequest struct {
	ProviderName    string `json:"provider_name" binding:"required"`
	TargetURL       string `json:"target_url" binding:"required,url"`
	PayeWebhookSlug string `json:"paye_webhook_slug"`
}

type WebhookConfigResponse struct {
	ID              string `json:"id"`
	ProviderName    string `json:"provider_name"`
	TargetURL       string `json:"target_url"`
	PayeWebhookSlug string `json:"paye_webhook_slug"`
}

func ToWebhookConfigResponse(config *models.WebhookConfig) *WebhookConfigResponse {
	return &WebhookConfigResponse{
		ID:              config.Base.ID.String(),
		ProviderName:    config.ProviderName,
		TargetURL:       config.TargetURL,
		PayeWebhookSlug: config.PayeWebhookSlug,
	}
}

func ToWebhookConfig(config *WebhookConfigRequest) *models.WebhookConfig {
	return &models.WebhookConfig{
		ProviderName:    config.ProviderName,
		TargetURL:       config.TargetURL,
		PayeWebhookSlug: config.PayeWebhookSlug,
	}
}
