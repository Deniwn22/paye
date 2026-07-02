package dto

import "time"

// StatementRequest is the query payload for generating a statement
type StatementRequest struct {
	StartDate time.Time `form:"start_date" binding:"required" time_format:"2006-01-02T15:04:05Z" example:"2026-06-01T00:00:00Z"`
	EndDate   time.Time `form:"end_date" binding:"required" time_format:"2006-01-02T15:04:05Z" example:"2026-06-30T23:59:59Z"`
	Format    string    `form:"format" example:"pdf"`       // json or pdf
	Statuses  string    `form:"statuses" example:"success"` // comma-separated, defaults to success
}

// AggregatorStatementResponse holds the aggregated stats per provider
type AggregatorStatementResponse struct {
	StartDate     time.Time                  `json:"start_date"`
	EndDate       time.Time                  `json:"end_date"`
	CheckoutStats map[string]ProviderSummary `json:"checkout_stats"`
	VAStats       map[string]ProviderSummary `json:"va_stats"`
}

type ProviderSummary struct {
	TotalVolume     float64 `json:"total_volume"`
	TransactionCount int64  `json:"transaction_count"`
}
