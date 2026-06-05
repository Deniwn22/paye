package dashboard

import (
	"context"

	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
)

type DashboardRepo struct {
	db *gorm.DB
}

func NewDashboardRepo(db *gorm.DB) *DashboardRepo {
	return &DashboardRepo{db: db}
}

func (r *DashboardRepo) GetStats(ctx context.Context, projectID string) (*dto.DashboardStatsResponse, error) {
	var stats dto.DashboardStatsResponse

	// Total Volume (sum of successful transaction amounts)
	err := r.db.WithContext(ctx).Table("webhook_logs").
		Joins("JOIN webhook_configs ON webhook_configs.id = webhook_logs.webhook_config_id").
		Where("webhook_configs.project_id = ? AND webhook_logs.status = ?", projectID, "success").
		Select("COALESCE(SUM(webhook_logs.amount), 0)").
		Row().Scan(&stats.TotalVolume)
	if err != nil {
		return nil, err
	}

	// Total Successful Transactions
	err = r.db.WithContext(ctx).Table("webhook_logs").
		Joins("JOIN webhook_configs ON webhook_configs.id = webhook_logs.webhook_config_id").
		Where("webhook_configs.project_id = ? AND webhook_logs.status = ?", projectID, "success").
		Count(&stats.TotalTransactions).Error
	if err != nil {
		return nil, err
	}

	// Failed Transactions
	err = r.db.WithContext(ctx).Table("webhook_logs").
		Joins("JOIN webhook_configs ON webhook_configs.id = webhook_logs.webhook_config_id").
		Where("webhook_configs.project_id = ? AND webhook_logs.status = ?", projectID, "failed").
		Count(&stats.FailedTransactions).Error
	if err != nil {
		return nil, err
	}

	// Successful Webhook Deliveries (status in [200, 299])
	err = r.db.WithContext(ctx).Table("webhook_logs").
		Joins("JOIN webhook_configs ON webhook_configs.id = webhook_logs.webhook_config_id").
		Where("webhook_configs.project_id = ? AND webhook_logs.forwarded_status >= ? AND webhook_logs.forwarded_status < ?", projectID, 200, 300).
		Count(&stats.SuccessfulDeliveries).Error
	if err != nil {
		return nil, err
	}

	// Failed Webhook Deliveries (status < 200 OR >= 300, and > 0 since 0 means pending/not run)
	err = r.db.WithContext(ctx).Table("webhook_logs").
		Joins("JOIN webhook_configs ON webhook_configs.id = webhook_logs.webhook_config_id").
		Where("webhook_configs.project_id = ? AND (webhook_logs.forwarded_status < ? OR webhook_logs.forwarded_status >= ?) AND webhook_logs.forwarded_status > ?", projectID, 200, 300, 0).
		Count(&stats.FailedDeliveries).Error
	if err != nil {
		return nil, err
	}

	// Active Providers Count
	err = r.db.WithContext(ctx).Model(&models.ProviderConfig{}).
		Where("project_id = ? AND is_active = ?", projectID, true).
		Count(&stats.ActiveProvidersCount).Error
	if err != nil {
		return nil, err
	}

	return &stats, nil
}

func (r *DashboardRepo) GetLogs(ctx context.Context, projectID string, limit int, offset int) ([]*models.WebhookLog, error) {
	var logs []*models.WebhookLog
	err := r.db.WithContext(ctx).Table("webhook_logs").
		Joins("JOIN webhook_configs ON webhook_configs.id = webhook_logs.webhook_config_id").
		Where("webhook_configs.project_id = ?", projectID).
		Order("webhook_logs.created_at DESC").
		Limit(limit).
		Offset(offset).
		Select("webhook_logs.*").
		Find(&logs).Error
	return logs, err
}
