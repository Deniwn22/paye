package models

// using gorm

// id will be uuid
type User struct {
	Base
	Name     string `gorm:"size:255"`
	Email    string `gorm:"unique;"`
	Password string `gorm:"not null"`
	PublicID string `gorm:"unique;not null"`
}
