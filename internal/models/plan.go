package models

import (
	"github.com/google/uuid"
)

type Plan struct {
	Base
	ProjectID   uuid.UUID `gorm:"type:uuid;not null;index"`
	Project     *Project  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE"`
	PlanCode    string    `gorm:"unique;not null;index"`
	Name        string    `gorm:"not null"`
	Amount      float64   `gorm:"not null"`
	Interval    string    `gorm:"not null"`
	Currency    string    `gorm:"not null"`
	Description string
	Provider    string    `gorm:"not null"`
}
