package subscriptions

import (
	"time"

	"github.com/ttomsin/paye/internal/models"
)

type CreatePlanRequest struct {
	Name        string  `json:"name" binding:"required"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Interval    string  `json:"interval" binding:"required,oneof=daily weekly monthly annually"`
	Currency    string  `json:"currency" binding:"required,len=3"`
	Description string  `json:"description"`
}

type PlanResponse struct {
	ID          string    `json:"id"`
	PlanCode    string    `json:"plan_code"`
	Name        string    `json:"name"`
	Amount      float64   `json:"amount"`
	Interval    string    `json:"interval"`
	Currency    string    `json:"currency"`
	Description string    `json:"description"`
	IsLive      bool      `json:"is_live"`
	CreatedAt   time.Time `json:"created_at"`
}

type SubscriptionResponse struct {
	ID               string    `json:"id"`
	SubscriptionCode string    `json:"subscription_code"`
	CustomerEmail    string    `json:"customer_email"`
	PlanCode         string    `json:"plan_code"`
	Status           string    `json:"status"`
	StartDate        time.Time `json:"start_date"`
	NextBillingDate  time.Time `json:"next_billing_date"`
	Provider         string    `json:"provider"` // Displayed for transparency (where the card is vaulted)
	IsLive           bool      `json:"is_live"`
	CreatedAt        time.Time `json:"created_at"`
}

type PlanListResponse struct {
	Data []PlanResponse `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

type SubscriptionListResponse struct {
	Data []SubscriptionResponse `json:"data"`
	Meta PaginationMeta         `json:"meta"`
}

type PaginationMeta struct {
	Total       int64 `json:"total"`
	PerPage     int   `json:"per_page"`
	CurrentPage int   `json:"current_page"`
	TotalPages  int   `json:"total_pages"`
}

func ToPlanResponse(plan *models.Plan) *PlanResponse {
	return &PlanResponse{
		ID:          plan.ID.String(),
		PlanCode:    plan.PlanCode,
		Name:        plan.Name,
		Amount:      plan.Amount,
		Interval:    plan.Interval,
		Currency:    plan.Currency,
		Description: plan.Description,
		IsLive:      plan.IsLive,
		CreatedAt:   plan.CreatedAt,
	}
}

func ToSubscriptionResponse(sub *models.Subscription) *SubscriptionResponse {
	return &SubscriptionResponse{
		ID:               sub.ID.String(),
		SubscriptionCode: sub.SubscriptionCode,
		CustomerEmail:    sub.CustomerEmail,
		PlanCode:         sub.PlanCode,
		Status:           sub.Status,
		StartDate:        sub.StartDate,
		NextBillingDate:  sub.NextBillingDate,
		Provider:         sub.Provider,
		IsLive:           sub.IsLive,
		CreatedAt:        sub.CreatedAt,
	}
}
