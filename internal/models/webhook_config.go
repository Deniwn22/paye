package models

import "github.com/google/uuid"

type WebhookConfig struct {
	Base
	ProviderName    string // (e.g "paystack", "flutterwave")
	TargetURL       string
	PayeWebhookSlug string    `gorm:"unique;not null"` // (e.g "paystack-webhook", "flutterwave-webhook")
	UserID          uuid.UUID // (foreign key -> User)
	User            *User     `gorm:"foreignKey:UserID"`
}
