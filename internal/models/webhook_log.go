package models

import "github.com/google/uuid"

type WebhookLog struct {
	Base
	WebhookConfigID uuid.UUID      `gorm:"type:uuid;not null"`
	WebhookConfig   *WebhookConfig `gorm:"foreignKey:WebhookConfigID;constraint:OnDelete:CASCADE;"`
	Event           string         `gorm:"not null"`
	Reference       string
	Amount          float64
	Status          string
	ForwardedStatus int
	ErrorMessage    string `gorm:"type:text"`
	Payload         string `gorm:"type:text"`
}
