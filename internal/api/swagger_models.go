package api

import (
	"github.com/ttomsin/paye/internal/dto"
)

// SwaggerProviderConfigResponse represents the provider config success response
type SwaggerProviderConfigResponse struct {
	Status  bool                       `json:"status"`
	Message string                     `json:"message"`
	Data    dto.ProviderConfigResponse `json:"data"`
}

// SwaggerProviderConfigListResponse represents the list of provider configs success response
type SwaggerProviderConfigListResponse struct {
	Status  bool                         `json:"status"`
	Message string                       `json:"message"`
	Data    []dto.ProviderConfigResponse `json:"data"`
}

// SwaggerWebhookConfigResponse represents the webhook config success response
type SwaggerWebhookConfigResponse struct {
	Status  bool                      `json:"status"`
	Message string                    `json:"message"`
	Data    dto.WebhookConfigResponse `json:"data"`
}

// SwaggerWebhookConfigListResponse represents the list of webhook configs success response
type SwaggerWebhookConfigListResponse struct {
	Status  bool                        `json:"status"`
	Message string                      `json:"message"`
	Data    []dto.WebhookConfigResponse `json:"data"`
}

// SwaggerSimpleResponse represents a basic response with no data
type SwaggerSimpleResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
}

// SwaggerDashboardStatsResponse represents the dashboard stats success response
type SwaggerDashboardStatsResponse struct {
	Status  bool                       `json:"status"`
	Message string                     `json:"message"`
	Data    dto.DashboardStatsResponse `json:"data"`
}

// SwaggerWebhookLogListResponse represents the list of webhook logs success response
type SwaggerWebhookLogListResponse struct {
	Status  bool                     `json:"status"`
	Message string                   `json:"message"`
	Data    []dto.WebhookLogResponse `json:"data"`
}

// SwaggerTransactionInitializeResponse represents the transaction initialize success response
type SwaggerTransactionInitializeResponse struct {
	Status  bool                              `json:"status"`
	Message string                            `json:"message"`
	Data    dto.InitializeTransactionResponse `json:"data"`
}

// SwaggerTransactionVerifyResponse represents the transaction verify success response
type SwaggerTransactionVerifyResponse struct {
	Status  bool                           `json:"status"`
	Message string                         `json:"message"`
	Data    dto.VerifyTransactionResponse `json:"data"`
}
