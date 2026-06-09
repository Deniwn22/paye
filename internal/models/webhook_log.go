package models

import "github.com/google/uuid"

type WebhookLog struct {
	Base
	ProjectID       uuid.UUID      `gorm:"type:uuid;not null;index"`
	Project         *Project       `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE;"`
	WebhookConfigID *uuid.UUID     `gorm:"type:uuid"` // nullable for locally-handled webhooks
	WebhookConfig   *WebhookConfig `gorm:"foreignKey:WebhookConfigID;constraint:OnDelete:SET NULL;"`
	Event           string         `gorm:"not null"`
	Reference       string
	Amount          float64
	Status          string
	ForwardedStatus int
	ErrorMessage    string `gorm:"type:text"`
	Payload         string `gorm:"type:text"`
	IsLive          bool   `gorm:"default:false;index"`
}
