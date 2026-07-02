package models

import (
	"time"

	"github.com/google/uuid"
)

type StatementRecord struct {
	Base
	ProjectID        uuid.UUID  `gorm:"type:uuid;not null;index" json:"project_id"`
	Project          *Project   `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"-"`
	Type             string     `gorm:"not null" json:"type"` // "aggregator" or "virtual_account"
	EntityID         string     `gorm:"index" json:"entity_id"` // pvc_id if type is virtual_account
	TotalVolume      float64    `gorm:"not null" json:"total_volume"`
	TransactionCount int64      `gorm:"not null" json:"transaction_count"`
	StartDate        time.Time  `gorm:"not null" json:"start_date"`
	EndDate          time.Time  `gorm:"not null" json:"end_date"`
	IsLive           bool       `gorm:"default:false;index" json:"is_live"`
}
