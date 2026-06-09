package transactions

import (
	"context"

	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
)

type TransactionRepo struct {
	db *gorm.DB
}

func NewTransactionRepo(db *gorm.DB) *TransactionRepo {
	return &TransactionRepo{db: db}
}

// CreateTransaction saves a new transaction in the database
func (r *TransactionRepo) CreateTransaction(ctx context.Context, tx *models.Transaction) (*models.Transaction, error) {
	if err := r.db.WithContext(ctx).Create(tx).Error; err != nil {
		return nil, err
	}
	return tx, nil
}

// FindTransactionByRef searches for a transaction by reference and project ID for isolation security
func (r *TransactionRepo) FindTransactionByRef(ctx context.Context, reference string, projectID string) (*models.Transaction, error) {
	var tx models.Transaction
	err := r.db.WithContext(ctx).Where("reference = ? AND project_id = ?", reference, projectID).First(&tx).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

// UpdateTransaction saves changes to a transaction (e.g. status updates)
func (r *TransactionRepo) UpdateTransaction(ctx context.Context, tx *models.Transaction) error {
	return r.db.WithContext(ctx).Save(tx).Error
}

// ListTransactions returns a paginated list of transactions for a project sorted by creation date and scoped by mode
func (r *TransactionRepo) ListTransactions(ctx context.Context, projectID string, limit int, offset int, isLive bool) ([]*models.Transaction, error) {
	var txs []*models.Transaction
	err := r.db.WithContext(ctx).Where("project_id = ? AND is_live = ?", projectID, isLive).Order("created_at DESC").Limit(limit).Offset(offset).Find(&txs).Error
	return txs, err
}
