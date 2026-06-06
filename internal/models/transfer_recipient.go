package models

import (
	"github.com/google/uuid"
)

type TransferRecipient struct {
	Base
	ProjectID     uuid.UUID `gorm:"type:uuid;not null;index"`
	Project       *Project  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE"`
	Name          string    `gorm:"not null"`
	AccountNumber string    `gorm:"not null"`
	BankCode      string    `gorm:"not null"`
	Currency      string    `gorm:"not null"`
	RecipientCode string    `gorm:"unique;not null;index"`
	Provider      string    `gorm:"not null"`
}
