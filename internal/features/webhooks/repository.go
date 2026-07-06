package webhooks

import (
	"context"
	"errors"
	"time"

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

func (r *WebhookRepo) List(ctx context.Context, projectID string, env string) ([]*models.WebhookConfig, error) {
	var configs []*models.WebhookConfig
	query := r.db.WithContext(ctx).Where("project_id = ?", projectID)
	if env != "" {
		query = query.Where("environment = ?", env)
	}
	if err := query.Find(&configs).Error; err != nil {
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

func (r *WebhookRepo) FindByProjectProviderAndEnv(ctx context.Context, projectID string, providerName string, env string) (*models.WebhookConfig, error) {
	var config models.WebhookConfig
	err := r.db.WithContext(ctx).Where("project_id = ? AND provider_name = ? AND environment = ?", projectID, providerName, env).First(&config).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &config, nil
}

func (r *WebhookRepo) Update(ctx context.Context, wc *models.WebhookConfig) error {
	return r.db.WithContext(ctx).Save(&wc).Error
}

func (r *WebhookRepo) Delete(ctx context.Context, id string, projectID string) error {
	return r.db.WithContext(ctx).Unscoped().Where("id = ? AND project_id = ?", id, projectID).Delete(&models.WebhookConfig{}).Error
}

func (r *WebhookRepo) CreateLog(ctx context.Context, wl *models.WebhookLog) error {
	return r.db.WithContext(ctx).Create(wl).Error
}

func (r *WebhookRepo) UpdateLog(ctx context.Context, wl *models.WebhookLog) error {
	return r.db.WithContext(ctx).Save(wl).Error
}

func (r *WebhookRepo) UpdateTransactionStatusAndAuthCode(ctx context.Context, reference string, authCode string, status string, transactionStatus string, rawPayload string) error {
	updates := map[string]any{
		"status":       status,
		"raw_response": rawPayload,
	}
	if authCode != "" {
		updates["authorization_code"] = authCode
	}
	if transactionStatus != "" {
		updates["transaction_status"] = transactionStatus
	}
	return r.db.WithContext(ctx).Model(&models.Transaction{}).
		Where("reference = ?", reference).
		Updates(updates).Error
}

func (r *WebhookRepo) ListLogs(ctx context.Context, projectID string, isLive bool, limit int, offset int) ([]*models.WebhookLog, error) {
	var logs []*models.WebhookLog
	err := r.db.WithContext(ctx).
		Preload("WebhookConfig").
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

func (r *WebhookRepo) ListRecentLogs(ctx context.Context, duration time.Duration) ([]*models.WebhookLog, error) {
	var logs []*models.WebhookLog
	err := r.db.WithContext(ctx).
		Where("created_at >= ?", time.Now().Add(-duration)).
		Order("created_at DESC").
		Find(&logs).Error
	return logs, err
}
