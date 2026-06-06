package paystack

import (
	"context"

	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
)

type PaystackRepository struct {
	db *gorm.DB
}

func NewPaystackRepository(db *gorm.DB) *PaystackRepository {
	return &PaystackRepository{db: db}
}

// CreateRefund persists a refund transaction record
func (r *PaystackRepository) CreateRefund(ctx context.Context, refund *models.Refund) (*models.Refund, error) {
	if err := r.db.WithContext(ctx).Create(refund).Error; err != nil {
		return nil, err
	}
	return refund, nil
}

// CreateTransferRecipient persists a transfer recipient record
func (r *PaystackRepository) CreateTransferRecipient(ctx context.Context, recipient *models.TransferRecipient) (*models.TransferRecipient, error) {
	if err := r.db.WithContext(ctx).Create(recipient).Error; err != nil {
		return nil, err
	}
	return recipient, nil
}

// CreateTransfer persists a transfer request record
func (r *PaystackRepository) CreateTransfer(ctx context.Context, transfer *models.Transfer) (*models.Transfer, error) {
	if err := r.db.WithContext(ctx).Create(transfer).Error; err != nil {
		return nil, err
	}
	return transfer, nil
}

// CreatePlan persists a subscription plan record
func (r *PaystackRepository) CreatePlan(ctx context.Context, plan *models.Plan) (*models.Plan, error) {
	if err := r.db.WithContext(ctx).Create(plan).Error; err != nil {
		return nil, err
	}
	return plan, nil
}

// CreateSubscription persists a customer subscription record
func (r *PaystackRepository) CreateSubscription(ctx context.Context, sub *models.Subscription) (*models.Subscription, error) {
	if err := r.db.WithContext(ctx).Create(sub).Error; err != nil {
		return nil, err
	}
	return sub, nil
}

// FindSubscriptionByCode retrieves a subscription by its unique subscription code and projectID
func (r *PaystackRepository) FindSubscriptionByCode(ctx context.Context, projectID string, code string) (*models.Subscription, error) {
	var sub models.Subscription
	err := r.db.WithContext(ctx).Where("project_id = ? AND subscription_code = ?", projectID, code).First(&sub).Error
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

// UpdateSubscription updates subscription details (e.g. status cancellations)
func (r *PaystackRepository) UpdateSubscription(ctx context.Context, sub *models.Subscription) error {
	return r.db.WithContext(ctx).Save(sub).Error
}

// FindActiveSubscription looks for an existing active subscription for a specific customer email and plan code
func (r *PaystackRepository) FindActiveSubscription(ctx context.Context, projectID string, email string, planCode string) (*models.Subscription, error) {
	var sub models.Subscription
	err := r.db.WithContext(ctx).Where("project_id = ? AND customer_email = ? AND plan_code = ? AND status = ?", projectID, email, planCode, "active").First(&sub).Error
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

// FindTransactionByRef locates a transaction by its reference and project ID
func (r *PaystackRepository) FindTransactionByRef(ctx context.Context, projectID string, reference string) (*models.Transaction, error) {
	var tx models.Transaction
	err := r.db.WithContext(ctx).Where("project_id = ? AND reference = ?", projectID, reference).First(&tx).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}
