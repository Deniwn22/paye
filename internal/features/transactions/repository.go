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

// FindTransactionByRef searches for a transaction by reference and user ID for isolation security
func (r *TransactionRepo) FindTransactionByRef(ctx context.Context, reference string, userID string) (*models.Transaction, error) {
	var tx models.Transaction
	err := r.db.WithContext(ctx).Where("reference = ? AND user_id = ?", reference, userID).First(&tx).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

// UpdateTransaction saves changes to a transaction (e.g. status updates)
func (r *TransactionRepo) UpdateTransaction(ctx context.Context, tx *models.Transaction) error {
	return r.db.WithContext(ctx).Save(tx).Error
}
