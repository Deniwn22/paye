package providers

import (
	"context"
	"fmt"

	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/models"
)

type PaystackServiceClient interface {
	Refund(ctx context.Context, projectID string, req RefundRequest) (*RefundResponse, error)
	CreateTransferRecipient(ctx context.Context, projectID string, req TransferRecipientRequest) (*TransferRecipientResponse, error)
	InitiateTransfer(ctx context.Context, projectID string, req TransferRequest) (*TransferResponse, error)
	CreatePlan(ctx context.Context, projectID string, req PlanRequest) (*PlanResponse, error)
	CreateSubscription(ctx context.Context, projectID string, req SubscriptionRequest) (*SubscriptionResponse, error)
	CancelSubscription(ctx context.Context, projectID string, subscriptionCode string, emailToken string) error
}

type ProviderService struct {
	repo            *ProviderRepo
	encryptionKey   string
	paystackService PaystackServiceClient
}

func NewProviderService(repo *ProviderRepo, encryptionKey string) *ProviderService {
	return &ProviderService{repo: repo, encryptionKey: encryptionKey}
}

func (s *ProviderService) SetPaystackService(ps PaystackServiceClient) {
	s.paystackService = ps
}

// GetProviderByLabel retrieves a provider configuration by label for the given project.
func (s *ProviderService) GetProviderByLabel(ctx context.Context, projectID string, label string) *models.ProviderConfig {
	return s.repo.GetProviderByLabel(ctx, projectID, label)
}

// ListProviders retrieves all provider configurations for the given project.
func (s *ProviderService) ListProviders(ctx context.Context, projectID string) ([]*dto.ProviderConfigResponse, error) {
	configs := s.repo.ListProviders(ctx, projectID)
	res := make([]*dto.ProviderConfigResponse, 0, len(configs))
	for _, config := range configs {
		decrypted, err := s.decryptConfigKeys(config)
		if err != nil {
			// fallback if decryption fails
			cloned := *config
			cloned.SecretKey = "********"
			cloned.PublicKey = "********"
			res = append(res, dto.ToProviderConfigResponse(&cloned))
			continue
		}
		res = append(res, dto.ToProviderConfigResponse(decrypted))
	}
	return res, nil
}

// AddProvider adds a new provider configuration for the given project.
func (s *ProviderService) AddProvider(ctx context.Context, pcreq *dto.ProviderConfigRequest, projectID string) (*dto.ProviderConfigResponse, error) {
	// we need to encrypt the secret key and public key before saving
	encryptedSecretKey, err := crypto.Encrypt(pcreq.SecretKey, s.encryptionKey)
	if err != nil {
		return nil, err
	}
	pcreq.SecretKey = encryptedSecretKey

	encryptedPublicKey, err := crypto.Encrypt(pcreq.PublicKey, s.encryptionKey)
	if err != nil {
		return nil, err
	}
	pcreq.PublicKey = encryptedPublicKey

	pc := dto.ToProviderConfig(pcreq)
	provider, err := s.repo.AddProvider(ctx, pc, projectID)
	if err != nil {
		return nil, err
	}

	decrypted, err := s.decryptConfigKeys(provider)
	if err != nil {
		return nil, err
	}
	return dto.ToProviderConfigResponse(decrypted), nil
}

// UpdateProvider updates an existing provider configuration for the given project.
func (s *ProviderService) UpdateProvider(ctx context.Context, pcreq *dto.ProviderConfigRequest, projectID string, providerId string) (*dto.ProviderConfigResponse, error) {
	// find provider by id
	provider, err := s.repo.FindProviderById(ctx, providerId, projectID)
	if err != nil {
		return nil, err
	}
	if provider == nil {
		return nil, fmt.Errorf("provider not found")
	}
	// we need to encrypt the secret key and public key before saving
	encryptedSecretKey, err := crypto.Encrypt(pcreq.SecretKey, s.encryptionKey)
	if err != nil {
		return nil, err
	}
	pcreq.SecretKey = encryptedSecretKey
	encryptedPublicKey, err := crypto.Encrypt(pcreq.PublicKey, s.encryptionKey)
	if err != nil {
		return nil, err
	}
	pcreq.PublicKey = encryptedPublicKey
	// update provider fields
	provider.SecretKey = pcreq.SecretKey
	provider.PublicKey = pcreq.PublicKey
	provider.Label = pcreq.Label
	provider.IsActive = pcreq.IsActive
	if err := s.repo.UpdateProvider(ctx, provider); err != nil {
		return nil, err
	}

	decrypted, err := s.decryptConfigKeys(provider)
	if err != nil {
		return nil, err
	}
	return dto.ToProviderConfigResponse(decrypted), nil
}

// ToggleProviderStatus toggles the active status of a provider for the given user.
func (s *ProviderService) ToggleProviderStatus(ctx context.Context, providerId string) error {
	err := s.repo.ToggleProviderStatus(ctx, providerId)
	if err != nil {
		return fmt.Errorf("Failed to toggle provider status : %w", err)
	}
	return nil
}

// DeleteProvider deletes a provider for the given user.
func (s *ProviderService) DeleteProvider(ctx context.Context, providerId string) error {
	if err := s.repo.DeleteProvider(ctx, providerId); err != nil {
		return fmt.Errorf("Failed to delete provider : %w", err)
	}
	return nil
}

func (s *ProviderService) decryptConfigKeys(config *models.ProviderConfig) (*models.ProviderConfig, error) {
	decryptedSecret, err := crypto.Decrypt(config.SecretKey, s.encryptionKey)
	if err != nil {
		return nil, err
	}
	decryptedPublic, err := crypto.Decrypt(config.PublicKey, s.encryptionKey)
	if err != nil {
		return nil, err
	}
	cloned := *config
	cloned.SecretKey = maskKey(decryptedSecret)
	cloned.PublicKey = decryptedPublic
	return &cloned, nil
}

func maskKey(key string) string {
	if len(key) <= 8 {
		return "********"
	}
	return key[:4] + "********" + key[len(key)-4:]
}

// RefundTransaction delegates the refund request to the Paystack service
func (s *ProviderService) RefundTransaction(ctx context.Context, projectID string, provider string, req RefundRequest) (*RefundResponse, error) {
	switch provider {
	case "paystack":
		if s.paystackService == nil {
			return nil, fmt.Errorf("paystack service not registered")
		}
		return s.paystackService.Refund(ctx, projectID, req)
	default:
		return nil, fmt.Errorf("provider %s does not support refunds", provider)
	}
}

// CreateTransferRecipient delegates the transfer recipient creation to the Paystack service
func (s *ProviderService) CreateTransferRecipient(ctx context.Context, projectID string, provider string, req TransferRecipientRequest) (*TransferRecipientResponse, error) {
	switch provider {
	case "paystack":
		if s.paystackService == nil {
			return nil, fmt.Errorf("paystack service not registered")
		}
		return s.paystackService.CreateTransferRecipient(ctx, projectID, req)
	default:
		return nil, fmt.Errorf("provider %s does not support transfer recipients", provider)
	}
}

// InitiateTransfer delegates the transfer initiation to the Paystack service
func (s *ProviderService) InitiateTransfer(ctx context.Context, projectID string, provider string, req TransferRequest) (*TransferResponse, error) {
	switch provider {
	case "paystack":
		if s.paystackService == nil {
			return nil, fmt.Errorf("paystack service not registered")
		}
		return s.paystackService.InitiateTransfer(ctx, projectID, req)
	default:
		return nil, fmt.Errorf("provider %s does not support transfers", provider)
	}
}

// CreatePlan delegates the plan creation to the Paystack service
func (s *ProviderService) CreatePlan(ctx context.Context, projectID string, provider string, req PlanRequest) (*PlanResponse, error) {
	switch provider {
	case "paystack":
		if s.paystackService == nil {
			return nil, fmt.Errorf("paystack service not registered")
		}
		return s.paystackService.CreatePlan(ctx, projectID, req)
	default:
		return nil, fmt.Errorf("provider %s does not support plans", provider)
	}
}

// CreateSubscription delegates the subscription creation to the Paystack service
func (s *ProviderService) CreateSubscription(ctx context.Context, projectID string, provider string, req SubscriptionRequest) (*SubscriptionResponse, error) {
	switch provider {
	case "paystack":
		if s.paystackService == nil {
			return nil, fmt.Errorf("paystack service not registered")
		}
		return s.paystackService.CreateSubscription(ctx, projectID, req)
	default:
		return nil, fmt.Errorf("provider %s does not support subscriptions", provider)
	}
}

// CancelSubscription delegates the subscription cancellation to the Paystack service
func (s *ProviderService) CancelSubscription(ctx context.Context, projectID string, provider string, subscriptionCode string, emailToken string) error {
	switch provider {
	case "paystack":
		if s.paystackService == nil {
			return fmt.Errorf("paystack service not registered")
		}
		return s.paystackService.CancelSubscription(ctx, projectID, subscriptionCode, emailToken)
	default:
		return fmt.Errorf("provider %s does not support subscription cancellation", provider)
	}
}
