// internal/providers/provider.go
package provider

type TransactionRequest struct {
	Amount    float64
	Email     string
	Currency  string
	Reference string
	Metadata  map[string]any
}

type TransactionResponse struct {
	Status    bool
	Message   string
	Reference string
	AuthURL   string
	Provider  string
	Amount    float64
	Currency  string
	Metadata  map[string]any
}

type WebhookEvent struct {
	Event     string
	Reference string
	Amount    float64
	Status    string
	Provider  string
}

type Provider interface {
	Name() string
	InitializeTransaction(req TransactionRequest) (*TransactionResponse, error)
	VerifyTransaction(reference string) (*TransactionResponse, error)
	HandleWebhook(signature string, payload []byte) (*WebhookEvent, error)
}
