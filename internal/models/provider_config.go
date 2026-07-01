package models

import "github.com/google/uuid"

type ProviderMetadata struct {
	NombaAccountID    string `json:"nomba_account_id,omitempty"`    // Required for Nomba
	NombaSubAccountID string `json:"nomba_subaccount_id,omitempty"` // Optional for Nomba
	OpayAccountID     string `json:"opay_account_id,omitempty"`     // Required for Opay
	// Add other provider-specific fields here safely
}

type ProviderConfig struct {
	Base
	Label         string `gorm:"not null"` // e.g "paystack-test", "paystack-live"
	ProviderName  string // (e.g "paystack", "flutterwave", "nomba")
	Environment   string `gorm:"not null;default:'test'"` // "test" or "live"
	SecretKey     string // stored encrypted
	PublicKey     string // stored encrypted (optional for some providers)
	WebhookSecret string // stored encrypted
	IsActive      bool

	// Foreign keys
	ProjectID uuid.UUID // (foreign key -> Project)
	Project   *Project  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE"`

	Metadata ProviderMetadata `gorm:"serializer:json;type:jsonb"`
}

// GetKeys returns the encrypted secret and public keys.
// Deprecated: Services should now rely on fetching the ProviderConfig by Environment directly.
func (pc *ProviderConfig) GetKeys() (string, string) {
	return pc.SecretKey, pc.PublicKey
}
