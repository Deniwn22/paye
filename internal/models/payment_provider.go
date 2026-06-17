package models

type PaymentProvider struct {
	Base
	Name        string `gorm:"unique;not null" json:"name"`
	Label       string `gorm:"not null" json:"label"`
	Description string `json:"description"`
	IsSupported bool   `gorm:"default:false;index" json:"is_supported"`
}
