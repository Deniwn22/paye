package models

import (
	"time"

	"github.com/google/uuid"
)

type VirtualAccount struct {
	Base
	PvcID             string         `gorm:"unique;not null;index" json:"pvc_id"`
	PayeVaID          string         `gorm:"index" json:"paye_va_id"`
	ProjectID         uuid.UUID      `gorm:"type:uuid;not null;index" json:"project_id"`
	Project           *Project       `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"-"`
	CustomerReference string         `gorm:"not null;index" json:"customer_reference"`
	AccountRef        string         `gorm:"unique;not null" json:"account_ref"`
	AccountName       string         `gorm:"not null" json:"account_name"`
	BankName          string         `json:"bank_name"`
	BankAccountNumber string         `gorm:"not null" json:"bank_account_number"`
	BankAccountName   string         `json:"bank_account_name"`
	Currency          string         `gorm:"not null;default:NGN" json:"currency"`
	Provider          string         `gorm:"not null" json:"provider"`
	Type              string         `gorm:"not null;default:static" json:"type"`
	Status            string         `gorm:"not null;default:active" json:"status"`
	ExpectedAmount    float64        `json:"expected_amount"`
	ExpiryDate        *time.Time     `json:"expiry_date,omitempty"`
	IsLive            bool           `gorm:"default:false;index" json:"is_live"`
	TotalReceived     float64        `gorm:"-" json:"total_received"`
	PayeTotalReceived float64        `gorm:"-" json:"paye_total_received"`
	PayeVACount       int64          `gorm:"-" json:"paye_va_count"`
	Metadata          map[string]any `gorm:"serializer:json" json:"metadata,omitempty"`
}

type VirtualAccountTransaction struct {
	Base
	VirtualAccountID uuid.UUID       `gorm:"type:uuid;not null;index" json:"virtual_account_id"`
	VirtualAccount   *VirtualAccount `gorm:"foreignKey:VirtualAccountID;constraint:OnDelete:CASCADE" json:"-"`
	ProjectID        uuid.UUID       `gorm:"type:uuid;not null;index" json:"project_id"`
	Project          *Project        `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"-"`
	PvcID            string          `gorm:"not null;index" json:"pvc_id"`
	Amount           float64         `gorm:"not null" json:"amount"`
	Currency         string          `gorm:"not null;default:NGN" json:"currency"`
	SenderName       string          `json:"sender_name"`
	SenderAccount    string          `json:"sender_account"`
	SenderBank       string          `json:"sender_bank"`
	Reference        string          `gorm:"unique;not null" json:"reference"`
	Status           string          `gorm:"not null;default:success" json:"status"`
	Provider         string          `gorm:"not null" json:"provider"`
	IsLive           bool            `gorm:"default:false;index" json:"is_live"`
}
