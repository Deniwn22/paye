package dto

import "github.com/ttomsin/paye/internal/models"

type ProviderType string

const (
	Paystack ProviderType = "paystack"
)

type ProviderConfigRequest struct {
	Label        string       `json:"label" binding:"required"`
	ProviderName ProviderType `json:"provider_name" binding:"required" enums:"paystack"`
	SecretKey    string       `json:"secret_key" binding:"required"`
	PublicKey    string       `json:"public_key" binding:"required"`
	IsActive     bool         `json:"is_active"`
}

type ProviderConfigResponse struct {
	ID           string `json:"id"`
	Label        string `json:"label"`
	ProviderName string `json:"provider_name"`
	SecretKey    string `json:"secret_key"`
	PublicKey    string `json:"public_key"`
	IsActive     bool   `json:"is_active"`
}


func ToProviderConfigResponse(config *models.ProviderConfig) *ProviderConfigResponse {
	return &ProviderConfigResponse{
		ID:           config.Base.ID.String(),
		Label:        config.Label,
		ProviderName: config.ProviderName,
		SecretKey:    config.SecretKey,
		PublicKey:    config.PublicKey,
		IsActive:     config.IsActive,
	}
}

func ToProviderConfig(config *ProviderConfigRequest) *models.ProviderConfig {
	return &models.ProviderConfig{
		Label:        config.Label,
		ProviderName: string(config.ProviderName),
		SecretKey:    config.SecretKey,
		PublicKey:    config.PublicKey,
		IsActive:     config.IsActive,
	}
}
