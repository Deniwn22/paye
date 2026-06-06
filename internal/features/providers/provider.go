// internal/providers/provider.go
package providers

type TransactionRequest struct {
	Amount    float64
	Email     string
	Currency  string
	Reference string
	Metadata  map[string]any
}

type TransactionResponse struct {
	Status     bool
	Message    string
	Reference  string
	AuthURL    string
	AccessCode string
	Provider   string
	Amount     float64
	Currency   string
	Metadata   map[string]any
}

type WebhookEvent struct {
	Event     string
	Reference string
	Amount    float64
	Status    string
	Provider  string
}

// Refund types
type RefundRequest struct {
	TransactionReference string
	Amount               float64 // optional — partial refund if set, full if 0
	Currency             string
	CustomerNote         string
	MerchantNote         string
}

type RefundResponse struct {
	Status         bool
	Message        string
	TransactionRef string
	Amount         float64
	Currency       string
	Provider       string
}

// Transfer types
type TransferRecipientRequest struct {
	Name          string
	AccountNumber string
	BankCode      string
	Currency      string
}

type TransferRecipientResponse struct {
	Status        bool
	Message       string
	RecipientCode string
	Provider      string
}

type TransferRequest struct {
	Amount        float64
	RecipientCode string
	Reason        string
	Reference     string
	Currency      string
}

type TransferResponse struct {
	Status       bool
	Message      string
	TransferCode string
	Reference    string
	Amount       float64
	Currency     string
	Provider     string
}

// Plans & Subscriptions types
type PlanRequest struct {
	Name        string
	Interval    string // daily, weekly, monthly, annually
	Amount      float64
	Currency    string
	Description string
}

type PlanResponse struct {
	Status   bool
	Message  string
	PlanCode string
	Name     string
	Amount   float64
	Interval string
	Provider string
}

type SubscriptionRequest struct {
	CustomerEmail string
	PlanCode      string
	Authorization string // auth code from a previous charge
	StartDate     string // ISO 8601
}

type SubscriptionResponse struct {
	Status           bool
	Message          string
	SubscriptionCode string
	CustomerEmail    string
	PlanCode         string
	Provider         string
}

type Provider interface {
	Name() string
	InitializeTransaction(req TransactionRequest) (*TransactionResponse, error)
	VerifyTransaction(reference string) (*TransactionResponse, error)
	HandleWebhook(signature string, payload []byte) (*WebhookEvent, error)

	// Refunds
	RefundTransaction(req RefundRequest) (*RefundResponse, error)

	// Transfers
	CreateTransferRecipient(req TransferRecipientRequest) (*TransferRecipientResponse, error)
	InitiateTransfer(req TransferRequest) (*TransferResponse, error)

	// Plans & Subscriptions
	CreatePlan(req PlanRequest) (*PlanResponse, error)
	CreateSubscription(req SubscriptionRequest) (*SubscriptionResponse, error)
	CancelSubscription(subscriptionCode string, emailToken string) error
}
