package models

import (
	"github.com/google/uuid"
)

type Customer struct {
	Base
	ProjectID         uuid.UUID `gorm:"type:uuid;not null;index"`
	Project           *Project  `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE"`
	CustomerCode      string    `gorm:"uniqueIndex;not null"`
	Email             string    `gorm:"not null;index"`
	FirstName         string
	LastName          string
	Phone             string
	TotalSpent        float64 `gorm:"default:0"`
	TransactionsCount int     `gorm:"default:0"`
	IsLive            bool    `gorm:"default:false;index"`
}
