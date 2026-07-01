package dto

type CreateVirtualAccountDTO struct {
	AccountName       string  `json:"account_name" binding:"required" required:"true" example:"Thompson Oretan" description:"Required. The name to display on the virtual account"`
	CustomerReference string  `json:"customer_reference" binding:"required" required:"true" example:"cust_12345" description:"Required. Your internal reference for the customer"`
	Currency          string  `json:"currency" binding:"required" required:"true" example:"NGN" enums:"NGN,USD" description:"Required. The currency for the virtual account"`
	BVN               string  `json:"bvn,omitempty" example:"22222222222" description:"Optional. BVN for KYC"`
	Type              string  `json:"type" example:"static" enums:"static,dynamic" default:"static" description:"Optional. Type of virtual account. Static accounts do not expire and can accept multiple payments. Dynamic accounts expire after a set time or payment."`
	ExpectedAmount    float64 `json:"expected_amount,omitempty" example:"15000.00" description:"Optional (Required for Dynamic). The exact amount expected for this account"`
	ExpiryDate        string  `json:"expiry_date,omitempty" example:"2026-12-31T23:59:59Z" description:"Optional (Required for Dynamic). ISO-8601 date string when the account expires"`
	SubAccountID      string  `json:"sub_account_id,omitempty" example:"sub_12345" description:"Optional. A subaccount ID to route payments directly to a specific pocket of money."`
}

type UpdateVADTO struct {
	AccountName string `json:"account_name" example:"Thompson Oretan Updated" description:"The new name to display on the virtual account"`
}
