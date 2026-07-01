package virtual_accounts

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/providers/nomba"
	"github.com/ttomsin/paye/internal/middleware"
	"github.com/ttomsin/paye/internal/models"
)

type VAService struct {
	repo          *VARepository
	providerRepo  *providers.ProviderRepo
	encryptionKey string
}

func NewVAService(repo *VARepository, providerRepo *providers.ProviderRepo, encryptionKey string) *VAService {
	return &VAService{
		repo:          repo,
		providerRepo:  providerRepo,
		encryptionKey: encryptionKey,
	}
}

func (s *VAService) getVAProvider(ctx context.Context, projectID string) (providers.VirtualAccountProvider, string, error) {
	isLive := middleware.GetIsLiveFromContext(ctx)
	env := "test"
	if isLive {
		env = "live"
	}

	// try nomba for now — extend this when other providers support VAs
	pc, err := s.providerRepo.FindActiveProvider(ctx, projectID, "nomba", env)
	if err != nil {
		return nil, "", fmt.Errorf("no active VA provider found for project: %w", err)
	}

	encSecret := pc.SecretKey
	encClientID := pc.PublicKey

	clientSecret, err := crypto.Decrypt(encSecret, s.encryptionKey)
	if err != nil {
		return nil, "", fmt.Errorf("failed to decrypt client secret: %w", err)
	}

	clientID, err := crypto.Decrypt(encClientID, s.encryptionKey)
	if err != nil {
		return nil, "", fmt.Errorf("failed to decrypt client id: %w", err)
	}

	accountID := pc.Metadata.NombaAccountID
	subAccountID := "" // Add to ProviderMetadata if needed later
	_ = subAccountID   // available if needed later

	client := nomba.New(clientID, clientSecret, accountID, isLive)
	return client, "nomba", nil
}

func (s *VAService) CreateVirtualAccount(ctx context.Context, projectID string, dto dto.CreateVirtualAccountDTO) (*models.VirtualAccount, error) {
	// check if customer_reference already has a VA under this project
	existing, err := s.repo.FindByCustomerRef(ctx, dto.CustomerReference, projectID)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("virtual account already exists for customer reference: %s", dto.CustomerReference)
	}

	provider, providerName, err := s.getVAProvider(ctx, projectID)
	if err != nil {
		return nil, err
	}

	pvcID := "pvc_" + uuid.New().String()
	accountRef := "paye_" + uuid.New().String()

	vaType := dto.Type
	if vaType == "" {
		vaType = "static"
	}

	req := providers.CreateVARequest{
		AccountRef:     accountRef,
		AccountName:    dto.AccountName,
		Currency:       dto.Currency,
		BVN:            dto.BVN,
		SubAccountID:   dto.SubAccountID,
		ExpectedAmount: dto.ExpectedAmount,
		ExpiryDate:     dto.ExpiryDate,
	}

	result, err := provider.CreateVirtualAccount(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to create virtual account on provider: %w", err)
	}

	pID, err := uuid.Parse(projectID)
	if err != nil {
		return nil, err
	}

	va := &models.VirtualAccount{
		PvcID:             pvcID,
		ProjectID:         pID,
		CustomerReference: dto.CustomerReference,
		AccountRef:        accountRef,
		AccountName:       dto.AccountName,
		BankName:          result.BankName,
		BankAccountNumber: result.AccountNumber,
		BankAccountName:   result.AccountName,
		Currency:          dto.Currency,
		Provider:          providerName,
		Type:              vaType,
		Status:            "active",
		ExpectedAmount:    dto.ExpectedAmount,
		IsLive:            middleware.GetIsLiveFromContext(ctx),
	}

	if dto.ExpiryDate != "" {
		// parse and set ExpiryDate on model if needed
	}

	return s.repo.CreateVirtualAccount(ctx, va)
}

func (s *VAService) GetVirtualAccount(ctx context.Context, projectID string, pvcID string) (*models.VirtualAccount, error) {
	return s.repo.FindByPvcID(ctx, pvcID, projectID)
}

func (s *VAService) ListVirtualAccounts(ctx context.Context, projectID string) ([]*models.VirtualAccount, error) {
	return s.repo.ListVirtualAccounts(ctx, projectID)
}

func (s *VAService) SuspendVirtualAccount(ctx context.Context, projectID string, pvcID string) error {
	va, err := s.repo.FindByPvcID(ctx, pvcID, projectID)
	if err != nil {
		return fmt.Errorf("virtual account not found: %w", err)
	}

	provider, _, err := s.getVAProvider(ctx, projectID)
	if err != nil {
		return err
	}

	if err := provider.SuspendVirtualAccount(ctx, va.AccountRef); err != nil {
		return fmt.Errorf("failed to suspend on provider: %w", err)
	}

	va.Status = "suspended"
	return s.repo.UpdateVirtualAccount(ctx, va)
}

func (s *VAService) ListTransactions(ctx context.Context, projectID string, pvcID string) ([]*models.VirtualAccountTransaction, error) {
	return s.repo.ListTransactions(ctx, pvcID, projectID)
}

func (s *VAService) UpdateVirtualAccount(ctx context.Context, projectID string, pvcID string, dto dto.UpdateVADTO) error {
	va, err := s.repo.FindByPvcID(ctx, pvcID, projectID)
	if err != nil {
		return fmt.Errorf("virtual account not found: %w", err)
	}

	provider, _, err := s.getVAProvider(ctx, projectID)
	if err != nil {
		return err
	}

	if err := provider.UpdateVirtualAccount(ctx, va.AccountRef, providers.UpdateVARequest{
		AccountName: dto.AccountName,
	}); err != nil {
		return fmt.Errorf("failed to update on provider: %w", err)
	}

	if dto.AccountName != "" {
		va.AccountName = dto.AccountName
	}

	return s.repo.UpdateVirtualAccount(ctx, va)
}

func (s *VAService) ExpireVirtualAccount(ctx context.Context, projectID string, pvcID string) error {
	va, err := s.repo.FindByPvcID(ctx, pvcID, projectID)
	if err != nil {
		return fmt.Errorf("virtual account not found: %w", err)
	}

	provider, _, err := s.getVAProvider(ctx, projectID)
	if err != nil {
		return err
	}

	if err := provider.ExpireVirtualAccount(ctx, va.AccountRef); err != nil {
		return fmt.Errorf("failed to expire on provider: %w", err)
	}

	va.Status = "expired"
	return s.repo.UpdateVirtualAccount(ctx, va)
}

func (s *VAService) ListMisdirectedPayments(ctx context.Context, projectID string) ([]*models.MisdirectedPayment, error) {
	return s.repo.ListMisdirectedPayments(ctx, projectID)
}

func (s *VAService) ResolveMisdirectedPayment(ctx context.Context, projectID string, id string) error {
	mp, err := s.repo.FindMisdirectedByID(ctx, id, projectID)
	if err != nil {
		return fmt.Errorf("misdirected payment not found: %w", err)
	}
	if mp.Status == "resolved" {
		return fmt.Errorf("payment already resolved")
	}
	mp.Status = "resolved"
	return s.repo.UpdateMisdirectedPayment(ctx, mp)
}
