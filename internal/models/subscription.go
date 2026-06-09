package models

import (
	"time"

	"github.com/google/uuid"
)

type Subscription struct {
	Base
	ProjectID        uuid.UUID `gorm:"type:uuid;not null;index" json:"project_id"`
	Project          *Project  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"project,omitempty"`
	SubscriptionCode string    `gorm:"unique;not null;index" json:"subscription_code"`
	CustomerEmail    string    `gorm:"not null;index" json:"customer_email"`
	PlanCode         string    `gorm:"not null;index" json:"plan_code"`
	Status           string    `gorm:"default:active" json:"status"` // active, past_due, cancelled
	Authorization    string    `json:"authorization"`
	StartDate        time.Time `json:"start_date"`
	NextBillingDate  time.Time `json:"next_billing_date"`
	Provider         string    `gorm:"not null" json:"provider"`
	IsLive           bool      `gorm:"default:false;index" json:"is_live"`
}
