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
	Status  bool                          `json:"status"`
	Message string                        `json:"message"`
	Data    dto.VerifyTransactionResponse `json:"data"`
}

// SwaggerTransactionListResponse represents the list of transactions success response
type SwaggerTransactionListResponse struct {
	Status  bool                            `json:"status"`
	Message string                          `json:"message"`
	Data    []dto.VerifyTransactionResponse `json:"data"`
}

// SwaggerPaymentProviderListResponse represents the list of supported payment providers success response
type SwaggerPaymentProviderListResponse struct {
	Status  bool                          `json:"status"`
	Message string                        `json:"message"`
	Data    []dto.PaymentProviderResponse `json:"data"`
}

// SwaggerVirtualAccountResponse represents a single virtual account response
type SwaggerVirtualAccountResponse struct {
	Status  bool                       `json:"status"`
	Message string                     `json:"message"`
	Data    dto.VirtualAccountResponse `json:"data"`
}

// SwaggerVirtualAccountListResponse represents a list of virtual accounts response
type SwaggerVirtualAccountListResponse struct {
	Status  bool                         `json:"status"`
	Message string                       `json:"message"`
	Data    []dto.VirtualAccountResponse `json:"data"`
	Meta    dto.PaginationMeta           `json:"meta"`
}

// SwaggerVirtualAccountTransactionListResponse represents a list of virtual account transactions response
type SwaggerVirtualAccountTransactionListResponse struct {
	Status  bool                                    `json:"status"`
	Message string                                  `json:"message"`
	Data    []dto.VirtualAccountTransactionResponse `json:"data"`
}

// SwaggerStatementVerifyResponse represents the statement verify success response
type SwaggerStatementVerifyResponse struct {
	Status  bool                   `json:"status"`
	Message string                 `json:"message"`
	Data    dto.StatementRecordDTO `json:"data"`
}

// SwaggerCustomerResponse represents a single customer response
type SwaggerCustomerResponse struct {
	Status  bool                 `json:"status"`
	Message string               `json:"message"`
	Data    dto.CustomerResponse `json:"data"`
}

// SwaggerCustomerListResponse represents a list of customers response
type SwaggerCustomerListResponse struct {
	Status  bool                     `json:"status"`
	Message string                   `json:"message"`
	Data    dto.CustomerListResponse `json:"data"`
}
