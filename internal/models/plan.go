package models

import (
	"github.com/google/uuid"
)

type Plan struct {
	Base
	ProjectID   uuid.UUID `gorm:"type:uuid;not null;index" json:"project_id"`
	Project     *Project  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"project,omitempty"`
	PlanCode    string    `gorm:"unique;not null;index" json:"plan_code"`
	Name        string    `gorm:"not null" json:"name"`
	Amount      float64   `gorm:"not null" json:"amount"`
	Interval    string    `gorm:"not null" json:"interval"`
	Currency    string    `gorm:"not null" json:"currency"`
	Description string    `json:"description"`
	Provider    string    `gorm:"not null" json:"provider"`
	IsLive      bool      `gorm:"default:false;index" json:"is_live"`
}
