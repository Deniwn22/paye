package models

import (
	"github.com/google/uuid"
)

type Transaction struct {
	Base
	UserID      uuid.UUID `gorm:"type:uuid;not null;index"`
	User        *User     `gorm:"foreignKey:UserID"`
	Provider    string    `gorm:"not null"` // "paystack", "flutterwave"
	Reference   string    `gorm:"unique;not null;index"`
	Amount      float64   `gorm:"not null"`
	Currency    string    `gorm:"not null"`
	Email       string    `gorm:"not null"`
	Status      string    `gorm:"default:pending"` // pending, success, failed
	AuthURL     string    // redirect URL for payment
	RawResponse string    // store raw provider response as JSON string
}
