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

func (r *WebhookRepo) Create(ctx context.Context, wc *models.WebhookConfig, projectID string) (*models.WebhookConfig, error) {
	projID, err := uuid.Parse(projectID)
	if err != nil {
		return nil, err
	}
	wc.ProjectID = projID
	if err := r.db.WithContext(ctx).Create(&wc).Error; err != nil {
		return nil, err
	}
	return wc, nil
}

func (r *WebhookRepo) List(ctx context.Context, projectID string) ([]*models.WebhookConfig, error) {
	var configs []*models.WebhookConfig
	if err := r.db.WithContext(ctx).Where("project_id = ?", projectID).Find(&configs).Error; err != nil {
		return nil, err
	}
	return configs, nil
}

func (r *WebhookRepo) FindByID(ctx context.Context, id string, projectID string) (*models.WebhookConfig, error) {
	var config models.WebhookConfig
	if err := r.db.WithContext(ctx).Where("id = ? AND project_id = ?", id, projectID).First(&config).Error; err != nil {
		return nil, err
	}
	return &config, nil
}

func (r *WebhookRepo) FindBySlug(ctx context.Context, slug string) (*models.WebhookConfig, error) {
	var config models.WebhookConfig
	if err := r.db.WithContext(ctx).Preload("Project").Where("paye_webhook_slug = ?", slug).First(&config).Error; err != nil {
		return nil, err
	}
	return &config, nil
}

func (r *WebhookRepo) Update(ctx context.Context, wc *models.WebhookConfig) error {
	return r.db.WithContext(ctx).Save(&wc).Error
}

func (r *WebhookRepo) Delete(ctx context.Context, id string, projectID string) error {
	return r.db.WithContext(ctx).Where("id = ? AND project_id = ?", id, projectID).Delete(&models.WebhookConfig{}).Error
}

func (r *WebhookRepo) CreateLog(ctx context.Context, wl *models.WebhookLog) error {
	return r.db.WithContext(ctx).Create(wl).Error
}

func (r *WebhookRepo) UpdateLog(ctx context.Context, wl *models.WebhookLog) error {
	return r.db.WithContext(ctx).Save(wl).Error
}

func (r *WebhookRepo) UpdateTransactionAuthCode(ctx context.Context, reference string, authCode string, status string, rawPayload string) error {
	return r.db.WithContext(ctx).Model(&models.Transaction{}).
		Where("reference = ?", reference).
		Updates(map[string]any{
			"status":             status,
			"authorization_code": authCode,
			"raw_response":       rawPayload,
		}).Error
}

func (r *WebhookRepo) ListLogs(ctx context.Context, projectID string, isLive bool, limit int, offset int) ([]*models.WebhookLog, error) {
	var logs []*models.WebhookLog
	err := r.db.WithContext(ctx).
		Where("project_id = ? AND is_live = ?", projectID, isLive).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&logs).Error
	return logs, err
}

func (r *WebhookRepo) ListAllLogs(ctx context.Context, projectID string, limit int, offset int) ([]*models.WebhookLog, error) {
	var logs []*models.WebhookLog
	err := r.db.WithContext(ctx).
		Where("project_id = ?", projectID).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&logs).Error
	return logs, err
}
