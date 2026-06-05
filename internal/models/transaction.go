package models

import (
	"github.com/google/uuid"
)

type Transaction struct {
	Base
	ProjectID   uuid.UUID `gorm:"type:uuid;not null;index"`
	Project     *Project  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE"`
	Provider    string    `gorm:"not null"` // "paystack", "flutterwave"
	Reference   string    `gorm:"unique;not null;index"`
	Amount      float64   `gorm:"not null"`
	Currency    string    `gorm:"not null"`
	Email       string    `gorm:"not null"`
	Status      string    `gorm:"default:pending"` // pending, success, failed
	AuthURL     string    // redirect URL for payment
	AccessCode  string    // access code for Paystack inline
	RawResponse string    // store raw provider response as JSON string
}
