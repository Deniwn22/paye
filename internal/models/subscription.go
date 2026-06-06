package models

import (
	"github.com/google/uuid"
)

type Subscription struct {
	Base
	ProjectID        uuid.UUID `gorm:"type:uuid;not null;index"`
	Project          *Project  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE"`
	SubscriptionCode string    `gorm:"unique;not null;index"`
	CustomerEmail    string    `gorm:"not null;index"`
	PlanCode         string    `gorm:"not null;index"`
	Status           string    `gorm:"default:active"` // active, cancelled
	Authorization    string
	StartDate        string
	Provider         string    `gorm:"not null"`
}
