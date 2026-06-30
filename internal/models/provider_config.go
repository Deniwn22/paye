package models

import "github.com/google/uuid"

type ProviderConfig struct {
	Base
	Label             string `gorm:"not null"` // e.g "paystack-test", "paystack-live", "flutterwave-main"
	ProviderName      string // (e.g "paystack", "flutterwave")
	SecretKey         string // stored encrypted via crypto.Encrypt (Legacy / fallback)
	PublicKey         string // (Legacy / fallback)
	TestSecretKey     string // stored encrypted
	TestPublicKey     string
	LiveSecretKey     string // stored encrypted
	LivePublicKey     string
	TestWebhookSecret string // stored encrypted
	LiveWebhookSecret string // stored encrypted
	IsActive          bool

	// Foreign keys
	ProjectID uuid.UUID // (foreign key -> Project)
	Project   *Project  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE"`

	Metadata map[string]string `gorm:"serializer:json"`
}

// GetKeysForMode returns the encrypted secret and public keys based on environment mode
func (pc *ProviderConfig) GetKeysForMode(isLive bool) (string, string) {
	if isLive {
		sec := pc.LiveSecretKey
		pub := pc.LivePublicKey
		if sec == "" {
			sec = pc.SecretKey
		}
		if pub == "" {
			pub = pc.PublicKey
		}
		return sec, pub
	}

	sec := pc.TestSecretKey
	pub := pc.TestPublicKey
	if sec == "" {
		sec = pc.SecretKey
	}
	if pub == "" {
		pub = pc.PublicKey
	}
	return sec, pub
}
