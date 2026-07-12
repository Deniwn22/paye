package virtual_accounts

import (
	"context"
	"time"

	"github.com/google/uuid"
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
	if err == nil {
		if va.PayeVaID == "" {
			va.PayeVaID = "pva_" + uuid.New().String()
			r.db.WithContext(ctx).Save(&va)
		}

		var total float64
		r.db.WithContext(ctx).Model(&models.VirtualAccountTransaction{}).
			Where("pvc_id = ? AND status = ?", pvcID, "success").
			Select("COALESCE(SUM(amount), 0)").Scan(&total)
		va.TotalReceived = total

		if va.PayeVaID != "" {
			var payeTotal float64
			r.db.WithContext(ctx).Model(&models.VirtualAccountTransaction{}).
				Joins("JOIN virtual_accounts ON virtual_accounts.id = virtual_account_transactions.virtual_account_id").
				Where("virtual_accounts.paye_va_id = ? AND virtual_account_transactions.status = ?", va.PayeVaID, "success").
				Select("COALESCE(SUM(virtual_account_transactions.amount), 0)").Scan(&payeTotal)
			va.PayeTotalReceived = payeTotal

			var vaCount int64
			r.db.WithContext(ctx).Model(&models.VirtualAccount{}).
				Where("paye_va_id = ?", va.PayeVaID).
				Count(&vaCount)
			va.PayeVACount = vaCount
		}
	}
	return &va, err
}

func (r *VARepository) FindVAsByPayeID(ctx context.Context, payeID string, projectID string) ([]*models.VirtualAccount, error) {
	var vas []*models.VirtualAccount
	err := r.db.WithContext(ctx).Where("paye_va_id = ? AND project_id = ?", payeID, projectID).Find(&vas).Error
	return vas, err
}

func (r *VARepository) FindByCustomerRef(ctx context.Context, customerRef string, projectID string) (*models.VirtualAccount, error) {
	var va models.VirtualAccount
	err := r.db.WithContext(ctx).Where("customer_reference = ? AND project_id = ? AND status = ?", customerRef, projectID, "active").Order("created_at DESC").First(&va).Error
	return &va, err
}

func (r *VARepository) ListVirtualAccounts(ctx context.Context, projectID string, provider string, limit, offset int) ([]*models.VirtualAccount, int64, error) {
	var vas []*models.VirtualAccount
	var total int64
	isLive := middleware.GetIsLiveFromContext(ctx)

	query := r.db.WithContext(ctx).Model(&models.VirtualAccount{}).Where("project_id = ? AND is_live = ?", projectID, isLive)
	if provider != "" {
		query = query.Where("provider = ?", provider)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&vas).Error

	if err == nil && len(vas) > 0 {
		for _, va := range vas {
			if va.PayeVaID == "" {
				va.PayeVaID = "pva_" + uuid.New().String()
				r.db.WithContext(ctx).Save(va)
			}
		}

		var totals []struct {
			PvcID string
			Total float64
		}
		r.db.WithContext(ctx).Model(&models.VirtualAccountTransaction{}).
			Select("pvc_id, COALESCE(SUM(amount), 0) as total").
			Where("project_id = ? AND status = ?", projectID, "success").
			Group("pvc_id").Scan(&totals)

		totalsMap := make(map[string]float64)
		for _, t := range totals {
			totalsMap[t.PvcID] = t.Total
		}

		var payeTotals []struct {
			PayeVaID string
			Total    float64
		}
		r.db.WithContext(ctx).Model(&models.VirtualAccountTransaction{}).
			Joins("JOIN virtual_accounts ON virtual_accounts.id = virtual_account_transactions.virtual_account_id").
			Select("virtual_accounts.paye_va_id, COALESCE(SUM(virtual_account_transactions.amount), 0) as total").
			Where("virtual_account_transactions.project_id = ? AND virtual_account_transactions.status = ? AND virtual_accounts.paye_va_id != ''", projectID, "success").
			Group("virtual_accounts.paye_va_id").Scan(&payeTotals)

		payeTotalsMap := make(map[string]float64)
		for _, t := range payeTotals {
			payeTotalsMap[t.PayeVaID] = t.Total
		}

		var payeCounts []struct {
			PayeVaID string
			Count    int64
		}
		r.db.WithContext(ctx).Model(&models.VirtualAccount{}).
			Select("paye_va_id, count(*) as count").
			Where("project_id = ? AND paye_va_id != ''", projectID).
			Group("paye_va_id").Scan(&payeCounts)

		payeCountsMap := make(map[string]int64)
		for _, c := range payeCounts {
			payeCountsMap[c.PayeVaID] = c.Count
		}

		for _, va := range vas {
			va.TotalReceived = totalsMap[va.PvcID]
			if va.PayeVaID != "" {
				va.PayeTotalReceived = payeTotalsMap[va.PayeVaID]
				va.PayeVACount = payeCountsMap[va.PayeVaID]
			}
		}
	}

	return vas, total, err
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

// GetVATransactionsForStatement fetches transactions for a specific virtual account within a date range and matching specific statuses
func (r *VARepository) GetVATransactionsForStatement(ctx context.Context, projectID, pvcID string, isLive bool, startTime, endTime time.Time, statuses []string) ([]*models.VirtualAccountTransaction, error) {
	var txs []*models.VirtualAccountTransaction
	query := r.db.WithContext(ctx).Where("project_id = ? AND pvc_id = ? AND is_live = ? AND created_at >= ? AND created_at <= ?", projectID, pvcID, isLive, startTime, endTime)
	if len(statuses) > 0 {
		query = query.Where("status IN ?", statuses)
	}
	err := query.Order("created_at DESC").Find(&txs).Error
	return txs, err
}

// GetAggregatorVATransactionsForStatement fetches all VA transactions across a project for aggregator statements
func (r *VARepository) GetAggregatorVATransactionsForStatement(ctx context.Context, projectID string, isLive bool, startTime, endTime time.Time, statuses []string) ([]*models.VirtualAccountTransaction, error) {
	var txs []*models.VirtualAccountTransaction
	query := r.db.WithContext(ctx).Where("project_id = ? AND is_live = ? AND created_at >= ? AND created_at <= ?", projectID, isLive, startTime, endTime)
	if len(statuses) > 0 {
		query = query.Where("status IN ?", statuses)
	}
	err := query.Order("created_at DESC").Find(&txs).Error
	return txs, err
}
