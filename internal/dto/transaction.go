package dto

import (
	"github.com/ttomsin/paye/internal/models"
)

type InitializeTransactionRequest struct {
	Amount      float64 `json:"amount" binding:"required" example:"5000.00" description:"Amount to charge the user"`
	Email       string  `json:"email" binding:"required,email" example:"customer@example.com" description:"Email address of the customer"`
	Currency    string  `json:"currency" binding:"required" example:"NGN" enums:"NGN,USD,GHS,KES" description:"Currency to charge in"`
	Reference   string  `json:"reference" example:"tx_ref_123456" description:"Your internal unique transaction reference"`
	Provider    string  `json:"provider" binding:"required" example:"paystack" enums:"paystack,flutterwave,nomba,opay" description:"Payment provider to route this transaction to"`
	CallbackURL string  `json:"callbackUrl" example:"https://your-app.com/webhook" description:"Optional callback URL for webhook notification"`
}

type InitializeTransactionResponse struct {
	Reference string                 `json:"reference" example:"tx_ref_123456"`
	AuthURL   string                 `json:"authorization_url,omitempty" example:"https://checkout.paystack.com/..." description:"URL to redirect the customer to complete payment"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
	Status    string                 `json:"status" example:"pending" enums:"pending,success,failed" description:"Current status of the transaction"`
	Amount    float64                `json:"amount" example:"5000.00"`
	Currency  string                 `json:"currency" example:"NGN"`
	Provider  string                 `json:"provider" example:"paystack"`
	Message   string                 `json:"message,omitempty" example:"Transaction initialized"`
}

type VerifyTransactionResponse struct {
	Reference string  `json:"reference" example:"tx_ref_123456"`
	Status    string  `json:"status" example:"success" enums:"pending,success,failed" description:"Final status of the transaction"`
	Amount    float64 `json:"amount" example:"5000.00"`
	Currency  string  `json:"currency" example:"NGN"`
	Provider  string  `json:"provider" example:"paystack"`
	Message   string  `json:"message,omitempty" example:"Transaction verified successfully"`
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
