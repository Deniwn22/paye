package models

import "github.com/google/uuid"

type Project struct {
	Base
	Name     string    `gorm:"size:255;not null"`
	ApiKey   string    `gorm:"unique;not null;index"`
	PublicID string    `gorm:"unique;not null;index"`
	UserID   uuid.UUID `gorm:"type:uuid;not null;index"`
	User     *User     `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}
