package models

import "github.com/google/uuid"

type VaReason string

const (
	VaReasonNotFound  VaReason = "va_not_found"
	VaReasonSuspended VaReason = "va_suspended"
	VaReasonExpired   VaReason = "va_expired"
)

type MisdirectedPayment struct {
	Base
	ProjectID         *uuid.UUID `gorm:"type:uuid;index" json:"project_id,omitempty"` // nullable — may be unresolvable
	BankAccountNumber string     `gorm:"not null;index" json:"bank_account_number"`
	Amount            float64    `gorm:"not null" json:"amount"`
	Currency          string     `json:"currency"`
	SenderName        string     `json:"sender_name"`
	SenderAccount     string     `json:"sender_account"`
	SenderBank        string     `json:"sender_bank"`
	Reference         string     `gorm:"unique;not null" json:"reference"`
	Reason            string     `json:"reason"`                                    // "va_not_found" | "va_suspended" | "va_expired"
	Status            string     `gorm:"not null;default:unresolved" json:"status"` // "unresolved" | "resolved"
	Provider          string     `json:"provider"`
	IsLive            bool       `gorm:"default:false;index" json:"is_live"`
}
