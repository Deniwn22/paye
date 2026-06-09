package models

import (
	"github.com/google/uuid"
)

type Transfer struct {
	Base
	ProjectID     uuid.UUID `gorm:"type:uuid;not null;index" json:"project_id"`
	Project       *Project  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"project,omitempty"`
	RecipientCode string    `gorm:"not null;index" json:"recipient_code"`
	Amount        float64   `gorm:"not null" json:"amount"`
	Currency      string    `gorm:"not null" json:"currency"`
	Reason        string    `json:"reason"`
	Reference     string    `gorm:"unique;not null;index" json:"reference"`
	TransferCode  string    `gorm:"index" json:"transfer_code"`
	Status        string    `gorm:"default:pending" json:"status"` // pending, success, failed
	Provider      string    `gorm:"not null" json:"provider"`
	IsLive        bool      `gorm:"default:false;index" json:"is_live"`
}
