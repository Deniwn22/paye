// internal/providers/provider.go
package providers

type TransactionStatus string

const (
	StatusSuccess TransactionStatus = "SUCCESS"
	StatusFailed  TransactionStatus = "FAIL"
	StatusPending TransactionStatus = "PENDING"
	StatusInitial TransactionStatus = "INITIAL"
	StatusClose   TransactionStatus = "CLOSE"
)

type TransactionRequest struct {
	Amount      float64
	Email       string
	Currency    string
	Reference   string
	CallbackURL string
	Metadata    map[string]any
}

type TransactionResponse struct {
	Status bool
	StatusText        string
	Message           string
	Reference         string
	AuthURL           string
	AccessCode        string
	Provider          string
	Amount            float64
	Currency          string
	AuthorizationCode string
	Metadata          map[string]any
}

type WebhookEvent struct {
	Event             string
	Reference         string
	Amount            float64
	Status            string
	Provider          string
	AuthorizationCode string
	SubscriptionCode  string
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
	Status         bool    `json:"status"`
	Message        string  `json:"message"`
	TransactionRef string  `json:"transaction_ref"`
	Amount         float64 `json:"amount"`
	Currency       string  `json:"currency"`
	Provider       string  `json:"provider"`
}

// Transfer types
type TransferRecipientRequest struct {
	Name          string
	AccountNumber string
	BankCode      string
	Currency      string
}

type TransferRecipientResponse struct {
	Status        bool   `json:"status"`
	Message       string `json:"message"`
	RecipientCode string `json:"recipient_code"`
	Provider      string `json:"provider"`
}

type TransferRequest struct {
	Amount           float64 `json:"amount" binding:"required"`
	RecipientCode    string  `json:"recipient_code"`
	RecipientAccount string  `json:"recipientAccount"`
	BankCode         string  `json:"bankCode"`
	Reason           string  `json:"reason"`
	Reference        string  `json:"reference"`
	Currency         string  `json:"currency"`
	Provider         string  `json:"provider"`
}

type TransferResponse struct {
	Status       bool    `json:"status"`
	Message      string  `json:"message"`
	TransferCode string  `json:"transfer_code"`
	Reference    string  `json:"reference"`
	Amount       float64 `json:"amount"`
	Currency     string  `json:"currency"`
	Provider     string  `json:"provider"`
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
	Status   bool    `json:"status"`
	Message  string  `json:"message"`
	PlanCode string  `json:"plan_code"`
	Name     string  `json:"name"`
	Amount   float64 `json:"amount"`
	Interval string  `json:"interval"`
	Provider string  `json:"provider"`
}

type SubscriptionRequest struct {
	CustomerEmail string
	PlanCode      string
	Authorization string // auth code from a previous charge
	StartDate     string // ISO 8601
}

type SubscriptionResponse struct {
	Status           bool   `json:"status"`
	Message          string `json:"message"`
	SubscriptionCode string `json:"subscription_code"`
	CustomerEmail    string `json:"customer_email"`
	PlanCode         string `json:"plan_code"`
	Provider         string `json:"provider"`
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

	// Custom Paye-Managed Subscription charging
	ChargeToken(req ChargeTokenRequest) (*TransactionResponse, error)
}

type ChargeTokenRequest struct {
	Amount        float64
	Currency      string
	Email         string
	Authorization string
	Reference     string
}
