package dto

import "time"

type CustomerResponse struct {
	CustomerCode      string    `json:"customer_code"`
	Email             string    `json:"email"`
	FirstName         string    `json:"first_name"`
	LastName          string    `json:"last_name"`
	Phone             string    `json:"phone"`
	TotalSpent        float64   `json:"total_spent"`
	TransactionsCount int       `json:"transactions_count"`
	CreatedAt         time.Time `json:"created_at"`
}

type CustomerListResponse struct {
	Data []CustomerResponse `json:"data"`
	Meta PaginationMeta     `json:"meta"`
}
