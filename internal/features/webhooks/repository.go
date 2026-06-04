package webhooks

import (
	"context"

	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
)

type WebhookRepo struct {
	db *gorm.DB
}

func NewWebhookRepo(db *gorm.DB) *WebhookRepo {
	return &WebhookRepo{db: db}
}

func (r *WebhookRepo) Create(ctx context.Context, wc *models.WebhookConfig, userId string) (*models.WebhookConfig, error) {
	uID, err := uuid.Parse(userId)
	if err != nil {
		return nil, err
	}
	wc.UserID = uID
	if err := r.db.WithContext(ctx).Create(&wc).Error; err != nil {
		return nil, err
	}
	return wc, nil
}

func (r *WebhookRepo) List(ctx context.Context, userId string) ([]*models.WebhookConfig, error) {
	var configs []*models.WebhookConfig
	if err := r.db.WithContext(ctx).Where("user_id = ?", userId).Find(&configs).Error; err != nil {
		return nil, err
	}
	return configs, nil
}

func (r *WebhookRepo) FindByID(ctx context.Context, id string, userId string) (*models.WebhookConfig, error) {
	var config models.WebhookConfig
	if err := r.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userId).First(&config).Error; err != nil {
		return nil, err
	}
	return &config, nil
}

func (r *WebhookRepo) FindBySlug(ctx context.Context, slug string) (*models.WebhookConfig, error) {
	var config models.WebhookConfig
	if err := r.db.WithContext(ctx).Where("paye_webhook_slug = ?", slug).First(&config).Error; err != nil {
		return nil, err
	}
	return &config, nil
}

func (r *WebhookRepo) Update(ctx context.Context, wc *models.WebhookConfig) error {
	return r.db.WithContext(ctx).Save(&wc).Error
}

func (r *WebhookRepo) Delete(ctx context.Context, id string, userId string) error {
	return r.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userId).Delete(&models.WebhookConfig{}).Error
}

func (r *WebhookRepo) CreateLog(ctx context.Context, wl *models.WebhookLog) error {
	return r.db.WithContext(ctx).Create(wl).Error
}

func (r *WebhookRepo) UpdateLog(ctx context.Context, wl *models.WebhookLog) error {
	return r.db.WithContext(ctx).Save(wl).Error
}