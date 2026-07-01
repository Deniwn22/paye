package subscriptions

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/providers/flutterwave"
	"github.com/ttomsin/paye/internal/features/providers/paystack"
	"github.com/ttomsin/paye/internal/middleware"
	"github.com/ttomsin/paye/internal/models"
	"github.com/ttomsin/paye/pkg/paye"
	"gorm.io/gorm"
)

type SubscriptionService struct {
	db            *gorm.DB
	providerRepo  *providers.ProviderRepo
	encryptionKey string
}

func NewSubscriptionService(db *gorm.DB, providerRepo *providers.ProviderRepo, encryptionKey string) *SubscriptionService {
	return &SubscriptionService{
		db:            db,
		providerRepo:  providerRepo,
		encryptionKey: encryptionKey,
	}
}

// CreateSubscription creates a local Paye-managed subscription.
func (s *SubscriptionService) CreateSubscription(ctx context.Context, projectID uuid.UUID, customerEmail string, planID string, authorizationCode string, provider string) (*models.Subscription, error) {
	var plan models.Plan
	if err := s.db.WithContext(ctx).Where("id = ? AND project_id = ?", planID, projectID).First(&plan).Error; err != nil {
		return nil, fmt.Errorf("plan not found")
	}

	// Calculate next billing date based on interval
	now := time.Now()
	nextBilling := now
	switch plan.Interval {
	case "daily":
		nextBilling = now.AddDate(0, 0, 1)
	case "weekly":
		nextBilling = now.AddDate(0, 0, 7)
	case "monthly":
		nextBilling = now.AddDate(0, 1, 0)
	case "annually":
		nextBilling = now.AddDate(1, 0, 0)
	default:
		nextBilling = now.AddDate(0, 1, 0) // default monthly
	}

	subCode := "SUB_" + uuid.New().String()[:12]

	sub := &models.Subscription{
		ProjectID:        projectID,
		SubscriptionCode: subCode,
		CustomerEmail:    customerEmail,
		PlanCode:         plan.PlanCode,
		Status:           "active",
		Authorization:    authorizationCode,
		StartDate:        now,
		NextBillingDate:  nextBilling,
		Provider:         provider,
	}

	if err := s.db.WithContext(ctx).Create(sub).Error; err != nil {
		return nil, fmt.Errorf("failed to create subscription: %w", err)
	}

	return sub, nil
}

// ProcessDueSubscriptions finds all due subscriptions and charges them.
func (s *SubscriptionService) ProcessDueSubscriptions(ctx context.Context) error {
	var dueSubs []models.Subscription
	if err := s.db.WithContext(ctx).Where("status = ? AND next_billing_date <= ?", "active", time.Now()).Find(&dueSubs).Error; err != nil {
		return err
	}

	for _, sub := range dueSubs {
		slog.Info("Processing subscription", "subscription_code", sub.SubscriptionCode, "customer", sub.CustomerEmail)
		err := s.chargeSubscription(ctx, &sub)
		if err != nil {
			slog.Error("Failed to charge subscription", "subscription_code", sub.SubscriptionCode, "error", err)
			sub.Status = "past_due"
			s.db.WithContext(ctx).Save(&sub)
			continue
		}

		// Update next billing date
		var plan models.Plan
		s.db.WithContext(ctx).Where("plan_code = ?", sub.PlanCode).First(&plan)

		now := time.Now()
		switch plan.Interval {
		case "daily":
			sub.NextBillingDate = now.AddDate(0, 0, 1)
		case "weekly":
			sub.NextBillingDate = now.AddDate(0, 0, 7)
		case "monthly":
			sub.NextBillingDate = now.AddDate(0, 1, 0)
		case "annually":
			sub.NextBillingDate = now.AddDate(1, 0, 0)
		default:
			sub.NextBillingDate = now.AddDate(0, 1, 0)
		}

		sub.Status = "active"
		s.db.WithContext(ctx).Save(&sub)
	}

	return nil
}

func (s *SubscriptionService) chargeSubscription(ctx context.Context, sub *models.Subscription) error {
	var plan models.Plan
	if err := s.db.WithContext(ctx).Where("plan_code = ?", sub.PlanCode).First(&plan).Error; err != nil {
		return err
	}

	isLive := sub.IsLive || middleware.GetIsLiveFromContext(ctx)
	env := "test"
	if isLive {
		env = "live"
	}

	pc, err := s.providerRepo.FindActiveProvider(ctx, sub.ProjectID.String(), sub.Provider, env)
	if err != nil {
		return fmt.Errorf("active provider config not found: %w", err)
	}

	encSecret := pc.SecretKey

	decryptedSecret, err := crypto.Decrypt(encSecret, s.encryptionKey)
	if err != nil {
		return fmt.Errorf("failed to decrypt provider secret key: %w", err)
	}

	client := paye.NewClient()

	var providerClient providers.Provider
	switch sub.Provider {
	case "paystack":
		providerClient = paystack.New(decryptedSecret)
	case "flutterwave":
		providerClient = flutterwave.New(decryptedSecret)
	default:
		return fmt.Errorf("unsupported provider: %s", sub.Provider)
	}

	client.RegisterProvider(providerClient)
	p, ok := client.GiveMe(sub.Provider)
	if !ok {
		return fmt.Errorf("provider %s not registered", sub.Provider)
	}

	req := providers.ChargeTokenRequest{
		Amount:        plan.Amount,
		Currency:      plan.Currency,
		Email:         sub.CustomerEmail,
		Authorization: sub.Authorization,
		Reference:     "SUB_CHARGE_" + uuid.New().String()[:8],
	}

	resp, err := p.ChargeToken(req)
	if err != nil {
		return err
	}

	if !resp.Status {
		return fmt.Errorf("charge failed: %s", resp.Message)
	}

	// Create a transaction record
	tx := &models.Transaction{
		ProjectID:         sub.ProjectID,
		Provider:          sub.Provider,
		Reference:         resp.Reference,
		Amount:            plan.Amount,
		Currency:          plan.Currency,
		Email:             sub.CustomerEmail,
		Status:            "success",
		AuthorizationCode: sub.Authorization,
	}
	s.db.WithContext(ctx).Create(tx)

	return nil
}
