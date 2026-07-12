package subscriptions

import (
	"context"
	"math"

	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
)

type SubscriptionRepo struct {
	db *gorm.DB
}

func NewSubscriptionRepo(db *gorm.DB) *SubscriptionRepo {
	return &SubscriptionRepo{db: db}
}

func (r *SubscriptionRepo) CreatePlan(ctx context.Context, plan *models.Plan) error {
	return r.db.WithContext(ctx).Create(plan).Error
}

func (r *SubscriptionRepo) GetPlanByCode(ctx context.Context, projectID string, planCode string) (*models.Plan, error) {
	var plan models.Plan
	if err := r.db.WithContext(ctx).Where("project_id = ? AND plan_code = ?", projectID, planCode).First(&plan).Error; err != nil {
		return nil, err
	}
	return &plan, nil
}

func (r *SubscriptionRepo) ListPlans(ctx context.Context, projectID string, isLive bool, page, limit int) ([]models.Plan, PaginationMeta, error) {
	var plans []models.Plan
	var total int64

	offset := (page - 1) * limit
	query := r.db.WithContext(ctx).Model(&models.Plan{}).Where("project_id = ? AND is_live = ?", projectID, isLive)

	if err := query.Count(&total).Error; err != nil {
		return nil, PaginationMeta{}, err
	}

	if err := query.Order("created_at desc").Offset(offset).Limit(limit).Find(&plans).Error; err != nil {
		return nil, PaginationMeta{}, err
	}

	meta := PaginationMeta{
		Total:       total,
		PerPage:     limit,
		CurrentPage: page,
		TotalPages:  int(math.Ceil(float64(total) / float64(limit))),
	}

	return plans, meta, nil
}

func (r *SubscriptionRepo) ListSubscriptions(ctx context.Context, projectID string, isLive bool, page, limit int) ([]models.Subscription, PaginationMeta, error) {
	var subs []models.Subscription
	var total int64

	offset := (page - 1) * limit
	query := r.db.WithContext(ctx).Model(&models.Subscription{}).Where("project_id = ? AND is_live = ?", projectID, isLive)

	if err := query.Count(&total).Error; err != nil {
		return nil, PaginationMeta{}, err
	}

	if err := query.Order("created_at desc").Offset(offset).Limit(limit).Find(&subs).Error; err != nil {
		return nil, PaginationMeta{}, err
	}

	meta := PaginationMeta{
		Total:       total,
		PerPage:     limit,
		CurrentPage: page,
		TotalPages:  int(math.Ceil(float64(total) / float64(limit))),
	}

	return subs, meta, nil
}

func (r *SubscriptionRepo) CancelSubscription(ctx context.Context, projectID string, subCode string) error {
	return r.db.WithContext(ctx).Model(&models.Subscription{}).
		Where("project_id = ? AND subscription_code = ?", projectID, subCode).
		Update("status", "cancelled").Error
}
