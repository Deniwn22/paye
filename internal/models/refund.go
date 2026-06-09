package models

import (
	"github.com/google/uuid"
)

type Refund struct {
	Base
	ProjectID            uuid.UUID `gorm:"type:uuid;not null;index" json:"project_id"`
	Project              *Project  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"project,omitempty"`
	TransactionReference string    `gorm:"not null;index" json:"transaction_reference"`
	Amount               float64   `gorm:"not null" json:"amount"`
	Currency             string    `gorm:"not null" json:"currency"`
	CustomerNote         string    `json:"customer_note"`
	MerchantNote         string    `json:"merchant_note"`
	Status               string    `gorm:"default:pending" json:"status"` // pending, success, failed
	RawResponse          string    `json:"raw_response,omitempty"`
	IsLive               bool      `gorm:"default:false;index" json:"is_live"`
}
