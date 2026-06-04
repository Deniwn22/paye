package providers

import (
	"context"

	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
)

type ProviderRepo struct {
	db *gorm.DB
}

func NewProviderRepo(db *gorm.DB) *ProviderRepo {
	return &ProviderRepo{db: db}
}

// AddProvider adds a  provider (userID, provider-config)
func (p *ProviderRepo) AddProvider(ctx context.Context, pc *models.ProviderConfig, userId string) (*models.ProviderConfig, error) {
	uID, err := uuid.Parse(userId)
	if err != nil {
		return nil, err
	}
	pc.UserID = uID
	if err := p.db.WithContext(ctx).Create(&pc).Error; err != nil {
		return nil, err
	}
	return pc, nil
}

// ListProviders returns a list of all providers for a given user
func (p *ProviderRepo) ListProviders(ctx context.Context, userId string) []*models.ProviderConfig {
	var providers []*models.ProviderConfig
	p.db.WithContext(ctx).Where("user_id = ?", userId).Find(&providers)
	return providers
}

// GetProvider returns a single provider by name
func (p *ProviderRepo) GetProviderByLabel(ctx context.Context, userID string, label string) *models.ProviderConfig {
	var provider models.ProviderConfig
	p.db.WithContext(ctx).First(&provider, "user_id = ? AND label = ?", userID, label)
	return &provider
}

// UpdateProvider updates a provider's details
func (p *ProviderRepo) UpdateProvider(ctx context.Context, pc *models.ProviderConfig) error {
	return p.db.WithContext(ctx).Save(&pc).Error
}

// DeleteProvider deletes a provider by ID
func (p *ProviderRepo) DeleteProvider(ctx context.Context, id string) error {
	return p.db.WithContext(ctx).Where("id = ?", id).Delete(&models.ProviderConfig{}).Error
}

// ToggleProviderStatus toggles a provider's status
func (p *ProviderRepo) ToggleProviderStatus(ctx context.Context, id string) error {
	var provider models.ProviderConfig
	p.db.WithContext(ctx).First(&provider, "id = ?", id)
	provider.IsActive = !provider.IsActive
	return p.db.WithContext(ctx).Save(&provider).Error
}

// FindProviderById returns a provider by ID
func (p *ProviderRepo) FindProviderById(ctx context.Context, id string, userId string) (*models.ProviderConfig, error) {
	var provider models.ProviderConfig
	return &provider, p.db.WithContext(ctx).First(&provider, "id = ? AND user_id = ?", id, userId).Error
}

// FindActiveProvider returns an active provider config by provider name and user ID
func (p *ProviderRepo) FindActiveProvider(ctx context.Context, userId string, providerName string) (*models.ProviderConfig, error) {
	var provider models.ProviderConfig
	err := p.db.WithContext(ctx).First(&provider, "user_id = ? AND provider_name = ? AND is_active = ?", userId, providerName, true).Error
	return &provider, err
}
