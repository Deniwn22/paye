package models

import (
	"github.com/google/uuid"
)

type TransferRecipient struct {
	Base
	ProjectID     uuid.UUID `gorm:"type:uuid;not null;index" json:"project_id"`
	Project       *Project  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"project,omitempty"`
	Name          string    `gorm:"not null" json:"name"`
	AccountNumber string    `gorm:"not null" json:"account_number"`
	BankCode      string    `gorm:"not null" json:"bank_code"`
	Currency      string    `gorm:"not null" json:"currency"`
	RecipientCode string    `gorm:"unique;not null;index" json:"recipient_code"`
	Provider      string    `gorm:"not null" json:"provider"`
}
