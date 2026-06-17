package dto

import "github.com/ttomsin/paye/internal/models"

type ProviderType string

const (
	Paystack ProviderType = "paystack"
)

type ProviderConfigRequest struct {
	Label         string            `json:"label" binding:"required"`
	ProviderName  ProviderType      `json:"provider_name" binding:"required"`
	SecretKey     string            `json:"secret_key"` // legacy
	PublicKey     string            `json:"public_key"` // legacy
	TestSecretKey string            `json:"test_secret_key"`
	TestPublicKey string            `json:"test_public_key"`
	LiveSecretKey string            `json:"live_secret_key"`
	LivePublicKey string            `json:"live_public_key"`
	IsActive      bool              `json:"is_active"`
	Metadata      map[string]string `json:"metadata"`
}

type ProviderConfigResponse struct {
	ID            string            `json:"id"`
	Label         string            `json:"label"`
	ProviderName  string            `json:"provider_name"`
	SecretKey     string            `json:"secret_key"` // legacy
	PublicKey     string            `json:"public_key"` // legacy
	TestSecretKey string            `json:"test_secret_key"`
	TestPublicKey string            `json:"test_public_key"`
	LiveSecretKey string            `json:"live_secret_key"`
	LivePublicKey string            `json:"live_public_key"`
	IsActive      bool              `json:"is_active"`
	Metadata      map[string]string `json:"metadata"`
}


func ToProviderConfigResponse(config *models.ProviderConfig) *ProviderConfigResponse {
	return &ProviderConfigResponse{
		ID:            config.Base.ID.String(),
		Label:         config.Label,
		ProviderName:  config.ProviderName,
		SecretKey:     config.SecretKey,
		PublicKey:     config.PublicKey,
		TestSecretKey: config.TestSecretKey,
		TestPublicKey: config.TestPublicKey,
		LiveSecretKey: config.LiveSecretKey,
		LivePublicKey: config.LivePublicKey,
		IsActive:      config.IsActive,
		Metadata:      config.Metadata,
	}
}

func ToProviderConfig(config *ProviderConfigRequest) *models.ProviderConfig {
	return &models.ProviderConfig{
		Label:         config.Label,
		ProviderName:  string(config.ProviderName),
		SecretKey:     config.SecretKey,
		PublicKey:     config.PublicKey,
		TestSecretKey: config.TestSecretKey,
		TestPublicKey: config.TestPublicKey,
		LiveSecretKey: config.LiveSecretKey,
		LivePublicKey: config.LivePublicKey,
		IsActive:      config.IsActive,
		Metadata:      config.Metadata,
	}
}
