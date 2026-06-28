package dto

type CreateVirtualAccountDTO struct {
	AccountName       string  `json:"account_name" binding:"required"`
	CustomerReference string  `json:"customer_reference" binding:"required"`
	Currency          string  `json:"currency" binding:"required"`
	BVN               string  `json:"bvn"`
	Type              string  `json:"type"`            // "static" | "dynamic", defaults to static
	ExpectedAmount    float64 `json:"expected_amount"` // dynamic only
	ExpiryDate        string  `json:"expiry_date"`     // dynamic only
}
