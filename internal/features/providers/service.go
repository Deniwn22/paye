package providers

import (
	"context"
	"fmt"

	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
)

type PaystackServiceClient interface {
	Refund(ctx context.Context, projectID string, req RefundRequest) (*RefundResponse, error)
	CreateTransferRecipient(ctx context.Context, projectID string, req TransferRecipientRequest) (*TransferRecipientResponse, error)
	InitiateTransfer(ctx context.Context, projectID string, req TransferRequest) (*TransferResponse, error)
	CreatePlan(ctx context.Context, projectID string, req PlanRequest) (*PlanResponse, error)
	CreateSubscription(ctx context.Context, projectID string, req SubscriptionRequest) (*SubscriptionResponse, error)
	CancelSubscription(ctx context.Context, projectID string, subscriptionCode string, emailToken string) error
	ListRefunds(ctx context.Context, projectID string) ([]*models.Refund, error)
	ListTransferRecipients(ctx context.Context, projectID string) ([]*models.TransferRecipient, error)
	ListTransfers(ctx context.Context, projectID string) ([]*models.Transfer, error)
	ListPlans(ctx context.Context, projectID string) ([]*models.Plan, error)
	ListSubscriptions(ctx context.Context, projectID string) ([]*models.Subscription, error)
}

type ProviderService struct {
	repo            *ProviderRepo
	encryptionKey   string
	paystackService PaystackServiceClient
	db              *gorm.DB
}

func NewProviderService(repo *ProviderRepo, encryptionKey string, db *gorm.DB) *ProviderService {
	return &ProviderService{repo: repo, encryptionKey: encryptionKey, db: db}
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

// InitiateTransfer initiates a balance transfer, routing to the preferred provider, or falling back across active providers.
func (s *ProviderService) InitiateTransfer(ctx context.Context, projectID string, req TransferRequest) (*TransferResponse, error) {
	// 1. Retrieve provider configurations for the project
	configs := s.repo.ListProviders(ctx, projectID)
	var activeProviders []string
	for _, pc := range configs {
		if pc.IsActive {
			activeProviders = append(activeProviders, pc.ProviderName)
		}
	}

	if len(activeProviders) == 0 {
		return nil, fmt.Errorf("no active payment providers configured for this project")
	}

	// 2. Determine preferred and fallback providers order
	var providersToTry []string
	if req.Provider != "" {
		// Verify if the requested provider is active
		isActive := false
		for _, name := range activeProviders {
			if name == req.Provider {
				isActive = true
				break
			}
		}
		if !isActive {
			return nil, fmt.Errorf("requested provider %s is not active for this project", req.Provider)
		}
		providersToTry = append(providersToTry, req.Provider)
		// Add other active providers as fallbacks
		for _, name := range activeProviders {
			if name != req.Provider {
				providersToTry = append(providersToTry, name)
			}
		}
	} else {
		providersToTry = activeProviders
	}

	var lastErr error
	// 3. Try each provider in sequence
	for _, provName := range providersToTry {
		// Resolve recipient code for this specific provider
		targetRecipientCode, err := s.resolveRecipientCodeForProvider(ctx, projectID, provName, req)
		if err != nil {
			lastErr = fmt.Errorf("failed to resolve recipient for provider %s: %w", provName, err)
			continue
		}

		provReq := req
		provReq.RecipientCode = targetRecipientCode

		var resp *TransferResponse
		switch provName {
		case "paystack":
			if s.paystackService == nil {
				lastErr = fmt.Errorf("paystack service not registered")
				continue
			}
			resp, err = s.paystackService.InitiateTransfer(ctx, projectID, provReq)
		default:
			err = fmt.Errorf("provider %s does not support transfers", provName)
		}

		if err == nil && resp != nil {
			return resp, nil
		}
		lastErr = err
	}

	return nil, fmt.Errorf("all active transfer providers failed. Last error: %w", lastErr)
}

func (s *ProviderService) resolveRecipientCodeForProvider(ctx context.Context, projectID string, providerName string, req TransferRequest) (string, error) {
	var accountNumber, bankCode, currency, name string

	// Case A: RecipientCode is specified
	if req.RecipientCode != "" {
		var recipient models.TransferRecipient
		err := s.db.WithContext(ctx).Where("project_id = ? AND recipient_code = ?", projectID, req.RecipientCode).First(&recipient).Error
		if err != nil {
			return "", fmt.Errorf("recipient code %s not found: %w", req.RecipientCode, err)
		}
		// If recipient already matches the provider, return it directly
		if recipient.Provider == providerName {
			return recipient.RecipientCode, nil
		}
		// Otherwise, extract properties to find/create on the new provider
		accountNumber = recipient.AccountNumber
		bankCode = recipient.BankCode
		currency = recipient.Currency
		name = recipient.Name
	} else if req.RecipientAccount != "" && req.BankCode != "" {
		// Case B: Account number and bank code are specified
		accountNumber = req.RecipientAccount
		bankCode = req.BankCode
		currency = req.Currency
		name = req.Reason // Default to reason or something generic
		if name == "" {
			name = "Recipient"
		}
	} else {
		return "", fmt.Errorf("must specify either recipient_code or both recipientAccount and bankCode")
	}

	if currency == "" {
		currency = "NGN"
	}

	// Look up if a recipient already exists for this account, bank, and provider
	var existing models.TransferRecipient
	err := s.db.WithContext(ctx).Where("project_id = ? AND account_number = ? AND bank_code = ? AND provider = ?", projectID, accountNumber, bankCode, providerName).First(&existing).Error
	if err == nil {
		return existing.RecipientCode, nil
	}

	// If not found, create one dynamically on this provider
	createReq := TransferRecipientRequest{
		Name:          name,
		AccountNumber: accountNumber,
		BankCode:      bankCode,
		Currency:      currency,
	}

	var createdCode string
	switch providerName {
	case "paystack":
		if s.paystackService == nil {
			return "", fmt.Errorf("paystack service not registered")
		}
		cresp, err := s.paystackService.CreateTransferRecipient(ctx, projectID, createReq)
		if err != nil {
			return "", fmt.Errorf("failed to create recipient on Paystack: %w", err)
		}
		createdCode = cresp.RecipientCode
	default:
		return "", fmt.Errorf("provider %s does not support dynamic recipient creation", providerName)
	}

	return createdCode, nil
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

// ListRefunds delegates the refund listing to the Paystack service
func (s *ProviderService) ListRefunds(ctx context.Context, projectID string, provider string) ([]*models.Refund, error) {
	switch provider {
	case "paystack":
		if s.paystackService == nil {
			return nil, fmt.Errorf("paystack service not registered")
		}
		return s.paystackService.ListRefunds(ctx, projectID)
	default:
		return nil, fmt.Errorf("provider %s does not support refund listing", provider)
	}
}

// ListTransferRecipients delegates the recipient listing to the Paystack service
func (s *ProviderService) ListTransferRecipients(ctx context.Context, projectID string, provider string) ([]*models.TransferRecipient, error) {
	switch provider {
	case "paystack":
		if s.paystackService == nil {
			return nil, fmt.Errorf("paystack service not registered")
		}
		return s.paystackService.ListTransferRecipients(ctx, projectID)
	default:
		return nil, fmt.Errorf("provider %s does not support recipient listing", provider)
	}
}

// ListTransfers delegates the transfer listing to the Paystack service
func (s *ProviderService) ListTransfers(ctx context.Context, projectID string, provider string) ([]*models.Transfer, error) {
	switch provider {
	case "paystack":
		if s.paystackService == nil {
			return nil, fmt.Errorf("paystack service not registered")
		}
		return s.paystackService.ListTransfers(ctx, projectID)
	default:
		return nil, fmt.Errorf("provider %s does not support transfer listing", provider)
	}
}

// ListPlans delegates the plan listing to the Paystack service
func (s *ProviderService) ListPlans(ctx context.Context, projectID string, provider string) ([]*models.Plan, error) {
	switch provider {
	case "paystack":
		if s.paystackService == nil {
			return nil, fmt.Errorf("paystack service not registered")
		}
		return s.paystackService.ListPlans(ctx, projectID)
	default:
		return nil, fmt.Errorf("provider %s does not support plan listing", provider)
	}
}

// ListSubscriptions delegates the subscription listing to the Paystack service
func (s *ProviderService) ListSubscriptions(ctx context.Context, projectID string, provider string) ([]*models.Subscription, error) {
	switch provider {
	case "paystack":
		if s.paystackService == nil {
			return nil, fmt.Errorf("paystack service not registered")
		}
		return s.paystackService.ListSubscriptions(ctx, projectID)
	default:
		return nil, fmt.Errorf("provider %s does not support subscription listing", provider)
	}
}

