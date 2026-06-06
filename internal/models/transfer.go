package models

import (
	"github.com/google/uuid"
)

type Transfer struct {
	Base
	ProjectID     uuid.UUID `gorm:"type:uuid;not null;index"`
	Project       *Project  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE"`
	RecipientCode string    `gorm:"not null;index"`
	Amount        float64   `gorm:"not null"`
	Currency      string    `gorm:"not null"`
	Reason        string
	Reference     string    `gorm:"unique;not null;index"`
	TransferCode  string    `gorm:"index"`
	Status        string    `gorm:"default:pending"` // pending, success, failed
	Provider      string    `gorm:"not null"`
}
