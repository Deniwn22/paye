package flutterwave

import (
	"context"

	"github.com/ttomsin/paye/internal/middleware"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
)

type FlutterwaveRepository struct {
	db *gorm.DB
}

func NewFlutterwaveRepository(db *gorm.DB) *FlutterwaveRepository {
	return &FlutterwaveRepository{db: db}
}

// CreateRefund persists a refund transaction record
func (r *FlutterwaveRepository) CreateRefund(ctx context.Context, refund *models.Refund) (*models.Refund, error) {
	if err := r.db.WithContext(ctx).Create(refund).Error; err != nil {
		return nil, err
	}
	return refund, nil
}

// CreateTransferRecipient persists a transfer recipient record
func (r *FlutterwaveRepository) CreateTransferRecipient(ctx context.Context, recipient *models.TransferRecipient) (*models.TransferRecipient, error) {
	if err := r.db.WithContext(ctx).Create(recipient).Error; err != nil {
		return nil, err
	}
	return recipient, nil
}

// CreateTransfer persists a transfer request record
func (r *FlutterwaveRepository) CreateTransfer(ctx context.Context, transfer *models.Transfer) (*models.Transfer, error) {
	if err := r.db.WithContext(ctx).Create(transfer).Error; err != nil {
		return nil, err
	}
	return transfer, nil
}

// CreatePlan persists a subscription plan record
func (r *FlutterwaveRepository) CreatePlan(ctx context.Context, plan *models.Plan) (*models.Plan, error) {
	if err := r.db.WithContext(ctx).Create(plan).Error; err != nil {
		return nil, err
	}
	return plan, nil
}

// CreateSubscription persists a customer subscription record
func (r *FlutterwaveRepository) CreateSubscription(ctx context.Context, sub *models.Subscription) (*models.Subscription, error) {
	if err := r.db.WithContext(ctx).Create(sub).Error; err != nil {
		return nil, err
	}
	return sub, nil
}

// FindSubscriptionByCode retrieves a subscription by its unique subscription code and projectID
func (r *FlutterwaveRepository) FindSubscriptionByCode(ctx context.Context, projectID string, code string) (*models.Subscription, error) {
	var sub models.Subscription
	err := r.db.WithContext(ctx).Where("project_id = ? AND subscription_code = ?", projectID, code).First(&sub).Error
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

// UpdateSubscription updates subscription details (e.g. status cancellations)
func (r *FlutterwaveRepository) UpdateSubscription(ctx context.Context, sub *models.Subscription) error {
	return r.db.WithContext(ctx).Save(sub).Error
}

// FindActiveSubscription looks for an existing active subscription for a specific customer email and plan code
func (r *FlutterwaveRepository) FindActiveSubscription(ctx context.Context, projectID string, email string, planCode string) (*models.Subscription, error) {
	var sub models.Subscription
	err := r.db.WithContext(ctx).Where("project_id = ? AND customer_email = ? AND plan_code = ? AND status = ?", projectID, email, planCode, "active").First(&sub).Error
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

// FindTransactionByRef locates a transaction by its reference and project ID
func (r *FlutterwaveRepository) FindTransactionByRef(ctx context.Context, projectID string, reference string) (*models.Transaction, error) {
	var tx models.Transaction
	err := r.db.WithContext(ctx).Where("project_id = ? AND reference = ?", projectID, reference).First(&tx).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

// ListRefunds retrieves all refunds for a project sorted by creation date and scoped by mode
func (r *FlutterwaveRepository) ListRefunds(ctx context.Context, projectID string) ([]*models.Refund, error) {
	var refunds []*models.Refund
	isLive := middleware.GetIsLiveFromContext(ctx)
	err := r.db.WithContext(ctx).Where("project_id = ? AND is_live = ?", projectID, isLive).Order("created_at DESC").Find(&refunds).Error
	return refunds, err
}

// ListTransferRecipients retrieves all transfer recipients for a project scoped by mode
func (r *FlutterwaveRepository) ListTransferRecipients(ctx context.Context, projectID string) ([]*models.TransferRecipient, error) {
	var recipients []*models.TransferRecipient
	isLive := middleware.GetIsLiveFromContext(ctx)
	err := r.db.WithContext(ctx).Where("project_id = ? AND is_live = ?", projectID, isLive).Order("created_at DESC").Find(&recipients).Error
	return recipients, err
}

// ListTransfers retrieves all transfers for a project sorted by creation date and scoped by mode
func (r *FlutterwaveRepository) ListTransfers(ctx context.Context, projectID string) ([]*models.Transfer, error) {
	var transfers []*models.Transfer
	isLive := middleware.GetIsLiveFromContext(ctx)
	err := r.db.WithContext(ctx).Where("project_id = ? AND is_live = ?", projectID, isLive).Order("created_at DESC").Find(&transfers).Error
	return transfers, err
}

// ListPlans retrieves all subscription plans for a project sorted by creation date and scoped by mode
func (r *FlutterwaveRepository) ListPlans(ctx context.Context, projectID string) ([]*models.Plan, error) {
	var plans []*models.Plan
	isLive := middleware.GetIsLiveFromContext(ctx)
	err := r.db.WithContext(ctx).Where("project_id = ? AND is_live = ?", projectID, isLive).Order("created_at DESC").Find(&plans).Error
	return plans, err
}

// ListSubscriptions retrieves all subscriptions for a project sorted by creation date and scoped by mode
func (r *FlutterwaveRepository) ListSubscriptions(ctx context.Context, projectID string) ([]*models.Subscription, error) {
	var subs []*models.Subscription
	isLive := middleware.GetIsLiveFromContext(ctx)
	err := r.db.WithContext(ctx).Where("project_id = ? AND is_live = ?", projectID, isLive).Order("created_at DESC").Find(&subs).Error
	return subs, err
}
