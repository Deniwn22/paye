package dto

import "github.com/ttomsin/paye/internal/models"

type WebhookConfigRequest struct {
	ProviderName    string            `json:"provider_name" binding:"required"`
	TargetURL       string            `json:"target_url" binding:"omitempty,url"`
	PayeWebhookSlug string            `json:"paye_webhook_slug"`
	Type            models.WbhookType `json:"type"` // "payment" | "va" | "all", defaults to "payment"
}

type WebhookConfigResponse struct {
	ID              string            `json:"id"`
	ProviderName    string            `json:"provider_name"`
	TargetURL       string            `json:"target_url"`
	PayeWebhookSlug string            `json:"paye_webhook_slug"`
	Type            models.WbhookType `json:"type"`
}

func ToWebhookConfigResponse(config *models.WebhookConfig) *WebhookConfigResponse {
	return &WebhookConfigResponse{
		ID:              config.Base.ID.String(),
		ProviderName:    config.ProviderName,
		TargetURL:       config.TargetURL,
		PayeWebhookSlug: config.PayeWebhookSlug,
		Type:            config.Type,
	}
}

func ToWebhookConfig(config *WebhookConfigRequest) *models.WebhookConfig {
	webhookType := config.Type
	if webhookType == "" {
		webhookType = models.PAYMENT
	}
	return &models.WebhookConfig{
		ProviderName:    config.ProviderName,
		TargetURL:       config.TargetURL,
		PayeWebhookSlug: config.PayeWebhookSlug,
		Type:            webhookType,
	}
}
