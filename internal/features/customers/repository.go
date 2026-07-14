package customers

import (
	"context"

	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
)

type CustomerRepo struct {
	db *gorm.DB
}

func NewCustomerRepo(db *gorm.DB) *CustomerRepo {
	return &CustomerRepo{db: db}
}

// CreateOrUpdate creates a new customer or returns the existing one based on ProjectID, Email, and Environment
func (r *CustomerRepo) CreateOrUpdate(ctx context.Context, customer *models.Customer) error {
	var existing models.Customer
	err := r.db.WithContext(ctx).Where("project_id = ? AND email = ? AND is_live = ?", customer.ProjectID, customer.Email, customer.IsLive).First(&existing).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Create
			return r.db.WithContext(ctx).Create(customer).Error
		}
		return err
	}

	// Update existing if new fields are provided (optional merging logic could go here)
	customer.ID = existing.ID
	customer.CustomerCode = existing.CustomerCode
	customer.TotalSpent = existing.TotalSpent
	customer.TransactionsCount = existing.TransactionsCount
	customer.CreatedAt = existing.CreatedAt

	if customer.FirstName != "" {
		existing.FirstName = customer.FirstName
	}
	if customer.LastName != "" {
		existing.LastName = customer.LastName
	}
	if customer.Phone != "" {
		existing.Phone = customer.Phone
	}

	return r.db.WithContext(ctx).Save(&existing).Error
}

func (r *CustomerRepo) FindByEmail(ctx context.Context, projectID string, email string, isLive bool) (*models.Customer, error) {
	var customer models.Customer
	err := r.db.WithContext(ctx).Where("project_id = ? AND email = ? AND is_live = ?", projectID, email, isLive).First(&customer).Error
	return &customer, err
}

func (r *CustomerRepo) FindByCode(ctx context.Context, projectID string, code string, isLive bool) (*models.Customer, error) {
	var customer models.Customer
	err := r.db.WithContext(ctx).Where("project_id = ? AND customer_code = ? AND is_live = ?", projectID, code, isLive).First(&customer).Error
	return &customer, err
}

func (r *CustomerRepo) IncrementLTV(ctx context.Context, customerID string, amount float64) error {
	return r.db.WithContext(ctx).Model(&models.Customer{}).Where("id = ?", customerID).
		Updates(map[string]interface{}{
			"total_spent":        gorm.Expr("total_spent + ?", amount),
			"transactions_count": gorm.Expr("transactions_count + 1"),
		}).Error
}

func (r *CustomerRepo) ListCustomers(ctx context.Context, projectID string, isLive bool, page, perPage int) ([]models.Customer, int64, error) {
	var customers []models.Customer
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Customer{}).Where("project_id = ? AND is_live = ?", projectID, isLive)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * perPage
	if err := query.Order("created_at desc").Offset(offset).Limit(perPage).Find(&customers).Error; err != nil {
		return nil, 0, err
	}

	return customers, total, nil
}
