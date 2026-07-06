package dashboard

import (
	"context"

	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/middleware"
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
	isLive := middleware.GetIsLiveFromContext(ctx)

	var checkoutVolume float64
	err := r.db.WithContext(ctx).Table("transactions").
		Where("project_id = ? AND is_live = ? AND status = ?", projectID, isLive, "success").
		Select("COALESCE(SUM(amount), 0)").
		Row().Scan(&checkoutVolume)
	if err != nil {
		return nil, err
	}

	var vaVolume float64
	err = r.db.WithContext(ctx).Table("virtual_account_transactions").
		Where("project_id = ? AND is_live = ? AND status = ?", projectID, isLive, "success").
		Select("COALESCE(SUM(amount), 0)").
		Row().Scan(&vaVolume)
	if err != nil {
		return nil, err
	}
	stats.TotalVolume = checkoutVolume + vaVolume

	// Total Successful Transactions
	var checkoutCount int64
	err = r.db.WithContext(ctx).Table("transactions").
		Where("project_id = ? AND is_live = ? AND status = ?", projectID, isLive, "success").
		Count(&checkoutCount).Error
	if err != nil {
		return nil, err
	}

	var vaCount int64
	err = r.db.WithContext(ctx).Table("virtual_account_transactions").
		Where("project_id = ? AND is_live = ? AND status = ?", projectID, isLive, "success").
		Count(&vaCount).Error
	if err != nil {
		return nil, err
	}
	stats.TotalTransactions = checkoutCount + vaCount

	// Failed Transactions
	var failedCheckoutCount int64
	err = r.db.WithContext(ctx).Table("transactions").
		Where("project_id = ? AND is_live = ? AND status = ?", projectID, isLive, "failed").
		Count(&failedCheckoutCount).Error
	if err != nil {
		return nil, err
	}

	var failedVACount int64
	err = r.db.WithContext(ctx).Table("virtual_account_transactions").
		Where("project_id = ? AND is_live = ? AND status = ?", projectID, isLive, "failed").
		Count(&failedVACount).Error
	if err != nil {
		return nil, err
	}
	stats.FailedTransactions = failedCheckoutCount + failedVACount

	// Successful Webhook Deliveries (status in [200, 299])
	err = r.db.WithContext(ctx).Table("webhook_logs").
		Where("project_id = ? AND is_live = ? AND forwarded_status >= ? AND forwarded_status < ?", projectID, isLive, 200, 300).
		Count(&stats.SuccessfulDeliveries).Error
	if err != nil {
		return nil, err
	}

	// Failed Webhook Deliveries (status < 200 OR >= 300, and > 0 since 0 means pending/not run)
	err = r.db.WithContext(ctx).Table("webhook_logs").
		Where("project_id = ? AND is_live = ? AND (forwarded_status < ? OR forwarded_status >= ?) AND forwarded_status > ?", projectID, isLive, 200, 300, 0).
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

	// Total Virtual Accounts Count
	err = r.db.WithContext(ctx).Model(&models.VirtualAccount{}).
		Where("project_id = ? AND is_live = ?", projectID, isLive).
		Count(&stats.TotalVirtualAccounts).Error
	if err != nil {
		return nil, err
	}

	return &stats, nil
}

func (r *DashboardRepo) GetLogs(ctx context.Context, projectID string, limit int, offset int) ([]*models.WebhookLog, error) {
	var logs []*models.WebhookLog
	isLive := middleware.GetIsLiveFromContext(ctx)
	err := r.db.WithContext(ctx).Table("webhook_logs").
		Where("project_id = ? AND is_live = ?", projectID, isLive).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&logs).Error
	return logs, err
}
