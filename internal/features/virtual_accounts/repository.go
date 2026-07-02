package virtual_accounts

import (
	"context"

	"github.com/ttomsin/paye/internal/middleware"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type VARepository struct {
	db *gorm.DB
}

func NewVARepository(db *gorm.DB) *VARepository {
	return &VARepository{db: db}
}

func (r *VARepository) GetDB() *gorm.DB {
	return r.db
}

func (r *VARepository) CreateVirtualAccount(ctx context.Context, va *models.VirtualAccount) (*models.VirtualAccount, error) {
	if err := r.db.WithContext(ctx).Create(va).Error; err != nil {
		return nil, err
	}
	return va, nil
}

func (r *VARepository) FindByPvcID(ctx context.Context, pvcID string, projectID string) (*models.VirtualAccount, error) {
	var va models.VirtualAccount
	err := r.db.WithContext(ctx).Where("pvc_id = ? AND project_id = ?", pvcID, projectID).First(&va).Error
	return &va, err
}

func (r *VARepository) FindByCustomerRef(ctx context.Context, customerRef string, projectID string) (*models.VirtualAccount, error) {
	var va models.VirtualAccount
	err := r.db.WithContext(ctx).Where("customer_reference = ? AND project_id = ?", customerRef, projectID).First(&va).Error
	return &va, err
}

func (r *VARepository) ListVirtualAccounts(ctx context.Context, projectID string) ([]*models.VirtualAccount, error) {
	var vas []*models.VirtualAccount
	isLive := middleware.GetIsLiveFromContext(ctx)
	err := r.db.WithContext(ctx).Where("project_id = ? AND is_live = ?", projectID, isLive).Order("created_at DESC").Find(&vas).Error
	return vas, err
}

func (r *VARepository) UpdateVirtualAccount(ctx context.Context, va *models.VirtualAccount) error {
	return r.db.WithContext(ctx).Save(va).Error
}

func (r *VARepository) CreateTransaction(ctx context.Context, tx *models.VirtualAccountTransaction) (*models.VirtualAccountTransaction, error) {
	if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(tx).Error; err != nil {
		return nil, err
	}
	return tx, nil
}

func (r *VARepository) ListTransactions(ctx context.Context, pvcID string, projectID string) ([]*models.VirtualAccountTransaction, error) {
	var txs []*models.VirtualAccountTransaction
	isLive := middleware.GetIsLiveFromContext(ctx)
	err := r.db.WithContext(ctx).Where("pvc_id = ? AND project_id = ? AND is_live = ?", pvcID, projectID, isLive).Order("created_at DESC").Find(&txs).Error
	return txs, err
}

func (r *VARepository) FindByAccountRef(ctx context.Context, accountRef string, projectID string) (*models.VirtualAccount, error) {
	var va models.VirtualAccount
	err := r.db.WithContext(ctx).Where("account_ref = ? AND project_id = ?", accountRef, projectID).First(&va).Error
	return &va, err
}

func (r *VARepository) FindByBankAccountNumber(ctx context.Context, bankAccountNumber string, projectID string) (*models.VirtualAccount, error) {
	var va models.VirtualAccount
	err := r.db.WithContext(ctx).Where("bank_account_number = ? AND project_id = ?", bankAccountNumber, projectID).First(&va).Error
	return &va, err
}

func (r *VARepository) CreateMisdirectedPayment(ctx context.Context, mp *models.MisdirectedPayment) (*models.MisdirectedPayment, error) {
	if err := r.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(mp).Error; err != nil {
		return nil, err
	}
	return mp, nil
}

func (r *VARepository) ListMisdirectedPayments(ctx context.Context, projectID string) ([]*models.MisdirectedPayment, error) {
	var mps []*models.MisdirectedPayment
	isLive := middleware.GetIsLiveFromContext(ctx)
	err := r.db.WithContext(ctx).Where("project_id = ? AND is_live = ?", projectID, isLive).Order("created_at DESC").Find(&mps).Error
	return mps, err
}

func (r *VARepository) FindMisdirectedByID(ctx context.Context, id string, projectID string) (*models.MisdirectedPayment, error) {
	var mp models.MisdirectedPayment
	err := r.db.WithContext(ctx).Where("id = ? AND project_id = ?", id, projectID).First(&mp).Error
	return &mp, err
}

func (r *VARepository) UpdateMisdirectedPayment(ctx context.Context, mp *models.MisdirectedPayment) error {
	return r.db.WithContext(ctx).Save(mp).Error
}

func (r *VARepository) FindTransactionByReference(ctx context.Context, reference string) (*models.VirtualAccountTransaction, error) {
	var tx models.VirtualAccountTransaction
	err := r.db.WithContext(ctx).Where("reference = ?", reference).First(&tx).Error
	return &tx, err
}
