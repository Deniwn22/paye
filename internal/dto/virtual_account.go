package dto

type CreateVirtualAccountDTO struct {
	AccountName       string  `json:"account_name" binding:"required" required:"true" example:"Thompson Oretan" description:"Required. The name to display on the virtual account"`
	CustomerReference string  `json:"customer_reference" binding:"required" required:"true" example:"cust_12345" description:"Required. Your internal reference for the customer"`
	Currency          string  `json:"currency" binding:"required" required:"true" example:"NGN" enums:"NGN,USD" description:"Required. The currency for the virtual account"`
	BVN               string  `json:"bvn,omitempty" example:"22222222222" description:"Optional. BVN for KYC"`
	Type              string  `json:"type" example:"static" enums:"static,dynamic" default:"static" description:"Optional. Type of virtual account. Static accounts do not expire and can accept multiple payments. Dynamic accounts expire after a set time or payment."`
	ExpectedAmount    float64 `json:"expected_amount,omitempty" example:"15000.00" description:"Optional (Required for Dynamic). The exact amount expected for this account"`
	ExpiryDate        string  `json:"expiry_date,omitempty" example:"2026-12-31T23:59:59Z" description:"Optional (Required for Dynamic). ISO-8601 date string when the account expires"`
}

type UpdateVADTO struct {
	AccountName string `json:"account_name" example:"Thompson Oretan Updated" description:"The new name to display on the virtual account"`
}

type VirtualAccountResponse struct {
	ID                string  `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	CreatedAt         string  `json:"created_at" example:"2026-07-01T12:00:00Z"`
	UpdatedAt         string  `json:"updated_at" example:"2026-07-01T12:00:00Z"`
	PvcID             string  `json:"pvc_id" example:"VA-123456789"`
	ProjectID         string  `json:"project_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	CustomerReference string  `json:"customer_reference" example:"cust_12345"`
	AccountRef        string  `json:"account_ref" example:"nomba_acc_123"`
	AccountName       string  `json:"account_name" example:"Thompson Oretan"`
	BankName          string  `json:"bank_name" example:"Providus Bank"`
	BankAccountNumber string  `json:"bank_account_number" example:"1234567890"`
	BankAccountName   string  `json:"bank_account_name" example:"Paye - Thompson Oretan"`
	Currency          string  `json:"currency" example:"NGN"`
	Provider          string  `json:"provider" example:"nomba"`
	Type              string  `json:"type" example:"static"`
	Status            string  `json:"status" example:"active"`
	ExpectedAmount    float64 `json:"expected_amount" example:"0"`
	ExpiryDate        string  `json:"expiry_date,omitempty" example:"2026-12-31T23:59:59Z"`
	IsLive            bool    `json:"is_live" example:"true"`
	TotalReceived     float64 `json:"total_received" example:"15000.00"`
}

type VirtualAccountTransactionResponse struct {
	ID               string  `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	CreatedAt        string  `json:"created_at" example:"2026-07-01T12:00:00Z"`
	UpdatedAt        string  `json:"updated_at" example:"2026-07-01T12:00:00Z"`
	VirtualAccountID string  `json:"virtual_account_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	ProjectID        string  `json:"project_id" example:"123e4567-e89b-12d3-a456-426614174000"`
	PvcID            string  `json:"pvc_id" example:"VA-123456789"`
	Amount           float64 `json:"amount" example:"15000.00"`
	Currency         string  `json:"currency" example:"NGN"`
	SenderName       string  `json:"sender_name" example:"John Doe"`
	SenderAccount    string  `json:"sender_account" example:"1234567890"`
	SenderBank       string  `json:"sender_bank" example:"Guaranty Trust Bank"`
	Reference        string  `json:"reference" example:"API-VACT_TRA-067fg..."`
	Status           string  `json:"status" example:"success"`
	Provider         string  `json:"provider" example:"nomba"`
	IsLive           bool    `json:"is_live" example:"true"`
}
