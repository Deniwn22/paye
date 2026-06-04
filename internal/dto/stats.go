package dto

import "time"

type DashboardStatsResponse struct {
	TotalVolume          float64 `json:"total_volume"`
	TotalTransactions    int64   `json:"total_transactions"`
	FailedTransactions   int64   `json:"failed_transactions"`
	SuccessfulDeliveries int64   `json:"successful_deliveries"`
	FailedDeliveries     int64   `json:"failed_deliveries"`
	ActiveProvidersCount int64   `json:"active_providers_count"`
}

type WebhookLogResponse struct {
	ID              string    `json:"id"`
	WebhookConfigID string    `json:"webhook_config_id"`
	Event           string    `json:"event"`
	Reference       string    `json:"reference"`
	Amount          float64   `json:"amount"`
	Status          string    `json:"status"`
	ForwardedStatus int       `json:"forwarded_status"`
	ErrorMessage    string    `json:"error_message"`
	Payload         string    `json:"payload"`
	CreatedAt       time.Time `json:"created_at"`
}
