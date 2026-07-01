package dto

type CreateVirtualAccountDTO struct {
	AccountName       string  `json:"account_name" binding:"required" example:"Thompson Oretan" description:"The name to display on the virtual account"`
	CustomerReference string  `json:"customer_reference" binding:"required" example:"cust_12345" description:"Your internal reference for the customer"`
	Currency          string  `json:"currency" binding:"required" example:"NGN" enums:"NGN,USD" description:"The currency for the virtual account"`
	BVN               string  `json:"bvn" example:"22222222222" description:"Optional BVN for KYC"`
	Type              string  `json:"type" example:"static" enums:"static,dynamic" default:"static" description:"Type of virtual account. Static accounts do not expire and can accept multiple payments. Dynamic accounts expire after a set time or payment."`
	ExpectedAmount    float64 `json:"expected_amount" example:"15000.00" description:"(Dynamic only) The exact amount expected for this account"`
	ExpiryDate        string  `json:"expiry_date" example:"2026-12-31T23:59:59Z" description:"(Dynamic only) ISO-8601 date string when the account expires"`
}

type UpdateVADTO struct {
	AccountName string `json:"account_name" example:"Thompson Oretan Updated" description:"The new name to display on the virtual account"`
}
