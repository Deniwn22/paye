package models

import "github.com/google/uuid"

type Notification struct {
	Base
	ProjectID uuid.UUID `gorm:"type:uuid;not null;index" json:"project_id"`
	Title     string    `gorm:"not null" json:"title"`
	Message   string    `gorm:"not null" json:"message"`
	Type      string    `gorm:"not null" json:"type"`
	IsRead    bool      `gorm:"default:false;not null" json:"is_read"`
}
