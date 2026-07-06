package models

import "github.com/google/uuid"

type Project struct {
	Base
	Name         string    `gorm:"size:255;not null"`
	ApiKey       string    `gorm:"unique;not null;index"`
	PublicID     string    `gorm:"unique;not null;index"`
	TestApiKey   string    `gorm:"unique;index"`
	TestPublicID string    `gorm:"unique;index"`
	UserID         uuid.UUID `gorm:"type:uuid;not null;index"`
	User           *User     `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	AutoMigrateVAs bool      `gorm:"default:false"`
}
