package models

// using gorm

// id will be uuid
type User struct {
	Base
	Name         string `gorm:"size:255"`
	Email        string `gorm:"unique;"`
	Password     string `gorm:"not null"`
	ApiKey       string `gorm:"unique;not null"`
	PublicID     string `gorm:"unique;not null"`
	TestApiKey   string `gorm:"unique;index"`
	TestPublicID string `gorm:"unique;index"`
}
