package transfers

type TransferRequest struct {
	Amount        float64 `json:"amount" binding:"required,gt=0"`
	AccountNumber string  `json:"account_number" binding:"required"`
	BankCode      string  `json:"bank_code" binding:"required"`
	AccountName   string  `json:"account_name" binding:"required"`
	Reason        string  `json:"reason"`
	Provider      string  `json:"provider"` // Optional: If empty, Smart Payouts will route it automatically
}

type TransferResponse struct {
	TransferCode  string  `json:"transfer_code"`
	RecipientCode string  `json:"recipient_code"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	Provider      string  `json:"provider"`
	Status        string  `json:"status"`
	Reference     string  `json:"reference"`
}
