package models

import "github.com/google/uuid"

type WebhookLog struct {
	Base
	ProjectID       uuid.UUID      `gorm:"type:uuid;not null;index" json:"project_id"`
	Project         *Project       `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE;" json:"-"`
	WebhookConfigID *uuid.UUID     `gorm:"type:uuid" json:"webhook_config_id"` // nullable for locally-handled webhooks
	WebhookConfig   *WebhookConfig `gorm:"foreignKey:WebhookConfigID;constraint:OnDelete:SET NULL;" json:"-"`
	Event           string         `gorm:"not null" json:"event"`
	Reference       string         `json:"reference"`
	Amount          float64        `json:"amount"`
	Status          string         `json:"status"`
	ForwardedStatus int            `json:"forwarded_status"`
	ErrorMessage    string         `gorm:"type:text" json:"error_message"`
	Payload         string         `gorm:"type:text" json:"payload"`
	IsLive          bool           `gorm:"default:false;index" json:"is_live"`
}
