package providers

import (
	"context"
	"fmt"

	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/models"
)

type ProviderService struct {
	repo          *ProviderRepo
	encryptionKey string
}

func NewProviderService(repo *ProviderRepo, encryptionKey string) *ProviderService {
	return &ProviderService{repo: repo, encryptionKey: encryptionKey}
}

// GetProviderByLabel retrieves a provider configuration by label for the given user.
func (s *ProviderService) GetProviderByLabel(ctx context.Context, userID string, label string) *models.ProviderConfig {
	return s.repo.GetProviderByLabel(ctx, userID, label)
}

// ListProviders retrieves all provider configurations for the given user.
func (s *ProviderService) ListProviders(ctx context.Context, userId string) ([]*dto.ProviderConfigResponse, error) {
	configs := s.repo.ListProviders(ctx, userId)
	res := make([]*dto.ProviderConfigResponse, 0, len(configs))
	for _, config := range configs {
		decrypted, err := s.decryptConfigKeys(config)
		if err != nil {
			// fallback if decryption fails
			cloned := *config
			cloned.SecretKey = "********"
			cloned.PublicKey = "********"
			res = append(res, dto.ToProviderConfigResponse(&cloned))
			continue
		}
		res = append(res, dto.ToProviderConfigResponse(decrypted))
	}
	return res, nil
}

// AddProvider adds a new provider configuration for the given user.
func (s *ProviderService) AddProvider(ctx context.Context, pcreq *dto.ProviderConfigRequest, userId string) (*dto.ProviderConfigResponse, error) {
	// we need to encrypt the secret key and public key before saving
	encryptedSecretKey, err := crypto.Encrypt(pcreq.SecretKey, s.encryptionKey)
	if err != nil {
		return nil, err
	}
	pcreq.SecretKey = encryptedSecretKey

	encryptedPublicKey, err := crypto.Encrypt(pcreq.PublicKey, s.encryptionKey)
	if err != nil {
		return nil, err
	}
	pcreq.PublicKey = encryptedPublicKey

	pc := dto.ToProviderConfig(pcreq)
	provider, err := s.repo.AddProvider(ctx, pc, userId)
	if err != nil {
		return nil, err
	}

	decrypted, err := s.decryptConfigKeys(provider)
	if err != nil {
		return nil, err
	}
	return dto.ToProviderConfigResponse(decrypted), nil
}

// UpdateProvider updates an existing provider configuration for the given user.
func (s *ProviderService) UpdateProvider(ctx context.Context, pcreq *dto.ProviderConfigRequest, userId string, providerId string) (*dto.ProviderConfigResponse, error) {
	// find provider by id
	provider, err := s.repo.FindProviderById(ctx, providerId, userId)
	if err != nil {
		return nil, err
	}
	if provider == nil {
		return nil, fmt.Errorf("provider not found")
	}
	// we need to encrypt the secret key and public key before saving
	encryptedSecretKey, err := crypto.Encrypt(pcreq.SecretKey, s.encryptionKey)
	if err != nil {
		return nil, err
	}
	pcreq.SecretKey = encryptedSecretKey
	encryptedPublicKey, err := crypto.Encrypt(pcreq.PublicKey, s.encryptionKey)
	if err != nil {
		return nil, err
	}
	pcreq.PublicKey = encryptedPublicKey
	// update provider fields
	provider.SecretKey = pcreq.SecretKey
	provider.PublicKey = pcreq.PublicKey
	provider.Label = pcreq.Label
	provider.IsActive = pcreq.IsActive
	if err := s.repo.UpdateProvider(ctx, provider); err != nil {
		return nil, err
	}

	decrypted, err := s.decryptConfigKeys(provider)
	if err != nil {
		return nil, err
	}
	return dto.ToProviderConfigResponse(decrypted), nil
}

// ToggleProviderStatus toggles the active status of a provider for the given user.
func (s *ProviderService) ToggleProviderStatus(ctx context.Context, providerId string) error {
	err := s.repo.ToggleProviderStatus(ctx, providerId)
	if err != nil {
		return fmt.Errorf("Failed to toggle provider status : %w", err)
	}
	return nil
}

// DeleteProvider deletes a provider for the given user.
func (s *ProviderService) DeleteProvider(ctx context.Context, providerId string) error {
	if err := s.repo.DeleteProvider(ctx, providerId); err != nil {
		return fmt.Errorf("Failed to delete provider : %w", err)
	}
	return nil
}

func (s *ProviderService) decryptConfigKeys(config *models.ProviderConfig) (*models.ProviderConfig, error) {
	decryptedSecret, err := crypto.Decrypt(config.SecretKey, s.encryptionKey)
	if err != nil {
		return nil, err
	}
	decryptedPublic, err := crypto.Decrypt(config.PublicKey, s.encryptionKey)
	if err != nil {
		return nil, err
	}
	cloned := *config
	cloned.SecretKey = maskKey(decryptedSecret)
	cloned.PublicKey = decryptedPublic
	return &cloned, nil
}

func maskKey(key string) string {
	if len(key) <= 8 {
		return "********"
	}
	return key[:4] + "********" + key[len(key)-4:]
}
