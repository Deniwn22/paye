package dto

import (
	"github.com/ttomsin/paye/internal/models"
)

type InitializeTransactionRequest struct {
	Amount      float64 `json:"amount" binding:"required"`
	Email       string  `json:"email" binding:"required,email"`
	Currency    string  `json:"currency" binding:"required"`
	Reference   string  `json:"reference"`
	Provider    string  `json:"provider" binding:"required"`
	CallbackURL string  `json:"callbackUrl"`
}

type InitializeTransactionResponse struct {
	Reference string                 `json:"reference"`
	AuthURL   string                 `json:"authorization_url,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
	Status    string                 `json:"status"` // pending, success, failed
	Amount    float64                `json:"amount"`
	Currency  string                 `json:"currency"`
	Provider  string                 `json:"provider"`
	Message   string                 `json:"message,omitempty"`
}

type VerifyTransactionResponse struct {
	Reference string  `json:"reference"`
	Status    string  `json:"status"` // pending, success, failed
	Amount    float64 `json:"amount"`
	Currency  string  `json:"currency"`
	Provider  string  `json:"provider"`
	Message   string  `json:"message,omitempty"`
}

func ToInitializeTransactionResponse(tx *models.Transaction, message string) *InitializeTransactionResponse {
	return &InitializeTransactionResponse{
		Reference: tx.Reference,
		AuthURL:   tx.AuthURL,
		Metadata:  tx.Metadata,
		Status:    tx.Status,
		Amount:    tx.Amount,
		Currency:  tx.Currency,
		Provider:  tx.Provider,
		Message:   message,
	}
}

func ToVerifyTransactionResponse(tx *models.Transaction, message string) *VerifyTransactionResponse {
	return &VerifyTransactionResponse{
		Reference: tx.Reference,
		Status:    tx.Status,
		Amount:    tx.Amount,
		Currency:  tx.Currency,
		Provider:  tx.Provider,
		Message:   message,
	}
}
