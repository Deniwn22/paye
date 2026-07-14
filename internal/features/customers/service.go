package customers

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/models"
)

type CustomerService struct {
	repo *CustomerRepo
}

func NewCustomerService(repo *CustomerRepo) *CustomerService {
	return &CustomerService{repo: repo}
}

// FindOrCreateCustomer is used by the Transaction Engine when a checkout is initialized
func (s *CustomerService) FindOrCreateCustomer(ctx context.Context, projectID string, email, firstName, lastName, phone string, isLive bool) (*models.Customer, error) {
	projUUID, err := uuid.Parse(projectID)
	if err != nil {
		return nil, fmt.Errorf("invalid project id")
	}

	customer := &models.Customer{
		ProjectID:    projUUID,
		CustomerCode: "pcust_" + uuid.New().String()[:16],
		Email:        email,
		FirstName:    firstName,
		LastName:     lastName,
		Phone:        phone,
		IsLive:       isLive,
	}

	if err := s.repo.CreateOrUpdate(ctx, customer); err != nil {
		return nil, err
	}

	return customer, nil
}

// IncrementLTV is used by Webhooks and Verify APIs to update lifetime value on successful transactions
func (s *CustomerService) IncrementLTV(ctx context.Context, customerID string, amount float64) error {
	return s.repo.IncrementLTV(ctx, customerID, amount)
}

func (s *CustomerService) ListCustomers(ctx context.Context, projectID string, isLive bool, page, perPage int) (*dto.CustomerListResponse, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	customers, total, err := s.repo.ListCustomers(ctx, projectID, isLive, page, perPage)
	if err != nil {
		return nil, err
	}

	var dtos []dto.CustomerResponse
	for _, c := range customers {
		dtos = append(dtos, dto.CustomerResponse{
			CustomerCode:      c.CustomerCode,
			Email:             c.Email,
			FirstName:         c.FirstName,
			LastName:          c.LastName,
			Phone:             c.Phone,
			TotalSpent:        c.TotalSpent,
			TransactionsCount: c.TransactionsCount,
			CreatedAt:         c.CreatedAt,
		})
	}

	if dtos == nil {
		dtos = make([]dto.CustomerResponse, 0)
	}

	return &dto.CustomerListResponse{
		Data: dtos,
		Meta: dto.PaginationMeta{
			Page:  page,
			Total: total,
			Limit: perPage,
		},
	}, nil
}

func (s *CustomerService) GetCustomer(ctx context.Context, projectID string, code string, isLive bool) (*dto.CustomerResponse, error) {
	c, err := s.repo.FindByCode(ctx, projectID, code, isLive)
	if err != nil {
		return nil, fmt.Errorf("customer not found")
	}

	return &dto.CustomerResponse{
		CustomerCode:      c.CustomerCode,
		Email:             c.Email,
		FirstName:         c.FirstName,
		LastName:          c.LastName,
		Phone:             c.Phone,
		TotalSpent:        c.TotalSpent,
		TransactionsCount: c.TransactionsCount,
		CreatedAt:         c.CreatedAt,
	}, nil
}
