package models

import "github.com/google/uuid"

type ProviderConfig struct {
	Base
	Label        string `gorm:"not null"` // e.g "paystack-test", "paystack-live", "flutterwave-main"
	ProviderName string // (e.g "paystack", "flutterwave")
	SecretKey    string // stored encrypted via crypto.Encrypt
	PublicKey    string
	IsActive     bool

	// Foreign keys
	UserID uuid.UUID // (foreign key -> User)
	User   *User     `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}
