package models

import (
	"github.com/google/uuid"
)

type Refund struct {
	Base
	ProjectID            uuid.UUID `gorm:"type:uuid;not null;index"`
	Project              *Project  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE"`
	TransactionReference string    `gorm:"not null;index"`
	Amount               float64   `gorm:"not null"`
	Currency             string    `gorm:"not null"`
	CustomerNote         string
	MerchantNote         string
	Status               string    `gorm:"default:pending"` // pending, success, failed
	RawResponse          string
}
