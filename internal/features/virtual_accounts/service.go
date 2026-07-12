package virtual_accounts

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/providers/flutterwave"
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

func (s *VAService) getVAProvider(ctx context.Context, projectID string) (providers.VirtualAccountProvider, string, string, error) {
	isLive := middleware.GetIsLiveFromContext(ctx)
	env := "test"
	if isLive {
		env = "live"
	}

	pc, err := s.providerRepo.GetActiveProvider(ctx, projectID, env)
	if err != nil {
		return nil, "", "", fmt.Errorf("no active provider found for project: %w", err)
	}

	if pc.ProviderName != "nomba" && pc.ProviderName != "flutterwave" {
		return nil, "", "", fmt.Errorf("The active provider does not support virtual accounts")
	}

	encSecret := pc.SecretKey
	clientSecret, err := crypto.Decrypt(encSecret, s.encryptionKey)
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to decrypt client secret: %w", err)
	}

	if pc.ProviderName == "flutterwave" {
		client := flutterwave.New(clientSecret)
		return client, "flutterwave", "", nil
	}

	encClientID := pc.PublicKey
	clientID, err := crypto.Decrypt(encClientID, s.encryptionKey)
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to decrypt client id: %w", err)
	}

	accountID := pc.Metadata.NombaAccountID
	subAccountID := pc.Metadata.NombaSubAccountID

	webhookSecret, _ := crypto.Decrypt(pc.WebhookSecret, s.encryptionKey)
	client := nomba.New(clientID, clientSecret, webhookSecret, accountID, subAccountID, isLive)
	return client, "nomba", subAccountID, nil
}

func (s *VAService) getProviderInstance(ctx context.Context, projectID string, providerName string, isLive bool) (providers.VirtualAccountProvider, error) {
	env := "test"
	if isLive {
		env = "live"
	}
	pc, err := s.providerRepo.GetProviderByNameAndEnv(ctx, projectID, providerName, env)
	if err != nil {
		return nil, fmt.Errorf("provider config not found: %w", err)
	}

	encSecret := pc.SecretKey
	clientSecret, err := crypto.Decrypt(encSecret, s.encryptionKey)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt client secret: %w", err)
	}

	if pc.ProviderName == "flutterwave" {
		client := flutterwave.New(clientSecret)
		return client, nil
	}

	encClientID := pc.PublicKey
	clientID, err := crypto.Decrypt(encClientID, s.encryptionKey)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt client id: %w", err)
	}

	accountID := pc.Metadata.NombaAccountID
	subAccountID := pc.Metadata.NombaSubAccountID

	webhookSecret, _ := crypto.Decrypt(pc.WebhookSecret, s.encryptionKey)
	client := nomba.New(clientID, clientSecret, webhookSecret, accountID, subAccountID, isLive)
	return client, nil
}

func (s *VAService) CreateVirtualAccount(ctx context.Context, projectID string, dto dto.CreateVirtualAccountDTO) (*models.VirtualAccount, error) {
	provider, providerName, subAccountID, err := s.getVAProvider(ctx, projectID)
	if err != nil {
		return nil, err
	}

	var project models.Project
	if err := s.repo.GetDB().WithContext(ctx).First(&project, "id = ?", projectID).Error; err != nil {
		return nil, fmt.Errorf("project not found: %w", err)
	}

	payeVaID := "pva_" + uuid.New().String()

	// check if customer_reference already has an active VA under this project
	existing, err := s.repo.FindByCustomerRef(ctx, dto.CustomerReference, projectID)
	if err == nil && existing != nil {
		if existing.Provider == providerName {
			// Idempotent: VA already exists on the active provider. Return it.
			return existing, nil
		}

		if existing.PayeVaID != "" {
			payeVaID = existing.PayeVaID
		}

		if project.AutoMigrateVAs {
			// MIGRATION: Provider has switched and AutoMigrateVAs is ON!
			oldProvider, err := s.getProviderInstance(ctx, projectID, existing.Provider, existing.IsLive)
			if err == nil {
				if err := oldProvider.ExpireVirtualAccount(ctx, existing.AccountRef); err != nil {
					if !strings.Contains(err.Error(), "expire VA not supported") {
						slog.Error("failed to expire old VA on provider during auto-migration", "provider", existing.Provider, "error", err)
					}
				}
			}

			// Safely deprecate the old Virtual Account by marking it expired locally.
			existing.Status = "expired"
			s.repo.UpdateVirtualAccount(ctx, existing)
		} else {
			// AutoMigrateVAs is OFF! Let them keep using their old VA.
			return existing, nil
		}
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
		SubAccountID:   subAccountID,
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
		PayeVaID:          payeVaID,
		Metadata:          result.Metadata,
	}

	if dto.ExpiryDate != "" {
		// parse and set ExpiryDate on model if needed
	}

	return s.repo.CreateVirtualAccount(ctx, va)
}

func (s *VAService) GetVirtualAccount(ctx context.Context, projectID string, pvcID string) (*models.VirtualAccount, error) {
	return s.repo.FindByPvcID(ctx, pvcID, projectID)
}

func (s *VAService) ListVirtualAccounts(ctx context.Context, projectID string, provider string, limit, offset int) ([]*models.VirtualAccount, int64, error) {
	return s.repo.ListVirtualAccounts(ctx, projectID, provider, limit, offset)
}

func (s *VAService) SuspendVirtualAccount(ctx context.Context, projectID string, pvcID string) error {
	va, err := s.repo.FindByPvcID(ctx, pvcID, projectID)
	if err != nil {
		return fmt.Errorf("virtual account not found: %w", err)
	}

	provider, _, _, err := s.getVAProvider(ctx, projectID)
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

	provider, _, _, err := s.getVAProvider(ctx, projectID)
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

func (s *VAService) MigrateVirtualAccount(ctx context.Context, projectID string, pvcID string) (*models.VirtualAccount, error) {
	// 1. Get the existing virtual account
	existing, err := s.repo.FindByPvcID(ctx, pvcID, projectID)
	if err != nil {
		return nil, fmt.Errorf("virtual account not found: %w", err)
	}
	if existing.Status != "active" {
		return nil, fmt.Errorf("cannot migrate a %s virtual account", existing.Status)
	}

	// 2. Get current active provider
	provider, providerName, subAccountID, err := s.getVAProvider(ctx, projectID)
	if err != nil {
		return nil, err
	}

	if existing.Provider == providerName {
		return nil, fmt.Errorf("virtual account is already on the active provider (%s)", providerName)
	}

	// 3. Expire old VA on the previous provider's network
	oldProvider, err := s.getProviderInstance(ctx, projectID, existing.Provider, existing.IsLive)
	if err == nil {
		if err := oldProvider.ExpireVirtualAccount(ctx, existing.AccountRef); err != nil {
			if !strings.Contains(err.Error(), "expire VA not supported") {
				slog.Error("failed to expire old VA on provider during manual migration", "provider", existing.Provider, "error", err)
			}
		}
	}

	// Mark old VA as expired locally
	existing.Status = "expired"
	if err := s.repo.UpdateVirtualAccount(ctx, existing); err != nil {
		return nil, err
	}

	// 4. Create new VA
	newPvcID := "pvc_" + uuid.New().String()
	accountRef := "paye_" + uuid.New().String()

	req := providers.CreateVARequest{
		AccountRef:     accountRef,
		AccountName:    existing.AccountName,
		Currency:       existing.Currency,
		SubAccountID:   subAccountID,
		ExpectedAmount: existing.ExpectedAmount,
	}

	if existing.ExpiryDate != nil {
		req.ExpiryDate = existing.ExpiryDate.Format(time.RFC3339)
	}

	result, err := provider.CreateVirtualAccount(ctx, req)
	if err != nil {
		// Rollback if creation fails
		existing.Status = "active"
		s.repo.UpdateVirtualAccount(ctx, existing)
		return nil, fmt.Errorf("failed to create virtual account on provider: %w", err)
	}

	pID, _ := uuid.Parse(projectID)

	payeVaID := existing.PayeVaID
	if payeVaID == "" {
		payeVaID = "pva_" + uuid.New().String()
		// update old one to share the ID retroactively
		existing.PayeVaID = payeVaID
		s.repo.UpdateVirtualAccount(ctx, existing)
	}

	newVa := &models.VirtualAccount{
		PvcID:             newPvcID,
		ProjectID:         pID,
		CustomerReference: existing.CustomerReference,
		AccountRef:        accountRef,
		AccountName:       existing.AccountName,
		BankName:          result.BankName,
		BankAccountNumber: result.AccountNumber,
		BankAccountName:   result.AccountName,
		Currency:          existing.Currency,
		Provider:          providerName,
		Type:              existing.Type,
		Status:            "active",
		ExpectedAmount:    existing.ExpectedAmount,
		ExpiryDate:        existing.ExpiryDate,
		IsLive:            middleware.GetIsLiveFromContext(ctx),
		PayeVaID:          payeVaID,
		Metadata:          result.Metadata,
	}

	return s.repo.CreateVirtualAccount(ctx, newVa)
}

func (s *VAService) ExpireVirtualAccount(ctx context.Context, projectID string, pvcID string) error {
	targetVa, err := s.repo.FindByPvcID(ctx, pvcID, projectID)
	if err != nil {
		return fmt.Errorf("virtual account not found: %w", err)
	}

	var vasToExpire []*models.VirtualAccount
	if targetVa.PayeVaID != "" {
		vasToExpire, err = s.repo.FindVAsByPayeID(ctx, targetVa.PayeVaID, projectID)
		if err != nil {
			return fmt.Errorf("failed to fetch related virtual accounts: %w", err)
		}
	} else {
		vasToExpire = append(vasToExpire, targetVa)
	}

	for _, va := range vasToExpire {
		if va.Status == "expired" {
			continue // Already expired locally
		}

		// Initialize the appropriate provider for this specific VA
		provider, err := s.getProviderInstance(ctx, projectID, va.Provider, va.IsLive)
		if err != nil {
			slog.Error("failed to initialize provider", "provider", va.Provider, "error", err)
			continue
		}

		if err := provider.ExpireVirtualAccount(ctx, va.AccountRef); err != nil {
			if !strings.Contains(err.Error(), "expire VA not supported") {
				slog.Error("failed to expire on provider", "provider", va.Provider, "error", err)
				// we won't strictly fail the whole request, but we will log it.
			}
		}

		va.Status = "expired"
		if err := s.repo.UpdateVirtualAccount(ctx, va); err != nil {
			slog.Error("failed to update VA status in DB", "pvc_id", va.PvcID, "error", err)
		}
	}

	return nil
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

func (s *VAService) PollVirtualAccounts(ctx context.Context) error {
	envs := []string{"live", "test"}
	for _, env := range envs {
		isLive := (env == "live")
		// Get all active Nomba providers
		nombaProviders, err := s.providerRepo.FindAllActiveProvidersByEnv(ctx, "nomba", env)
		if err != nil {
			continue
		}

		for _, pc := range nombaProviders {
			encSecret := pc.SecretKey
			encClientID := pc.PublicKey

			clientSecret, _ := crypto.Decrypt(encSecret, s.encryptionKey)
			clientID, _ := crypto.Decrypt(encClientID, s.encryptionKey)

			accountID := pc.Metadata.NombaAccountID
			subAccountID := pc.Metadata.NombaSubAccountID

			webhookSecret, _ := crypto.Decrypt(pc.WebhookSecret, s.encryptionKey)
			client := nomba.New(clientID, clientSecret, webhookSecret, accountID, subAccountID, isLive)

			// Poll transactions for the last 1 hour
			endDate := time.Now()
			startDate := endDate.Add(-1 * time.Hour)
			txs, err := client.PollVirtualAccountTransactions(ctx, startDate, endDate)
			if err != nil {
				continue
			}

			for _, tx := range txs {
				// IDEMPOTENCY: check if processed
				if _, err := s.repo.FindTransactionByReference(ctx, tx.Reference); err == nil {
					continue
				}

				// Check if TargetAccount (aliasAccountNumber) belongs to a VA in our DB
				va, err := s.repo.FindByBankAccountNumber(ctx, tx.TargetAccount, pc.ProjectID.String())
				if err != nil {
					// Misdirected - no VA matches
					mp := &models.MisdirectedPayment{
						ProjectID:         &pc.ProjectID,
						BankAccountNumber: tx.TargetAccount,
						Amount:            tx.Amount,
						Currency:          "NGN",
						SenderName:        tx.SenderName,
						SenderAccount:     tx.SenderAccount,
						SenderBank:        tx.SenderBank,
						Reference:         tx.Reference,
						Reason:            "va_not_found",
						Status:            "unresolved",
						Provider:          "nomba",
						IsLive:            isLive,
					}
					s.repo.CreateMisdirectedPayment(ctx, mp)
					continue
				}

				if va.Status != "active" {
					// Misdirected - inactive VA
					mp := &models.MisdirectedPayment{
						ProjectID:         &pc.ProjectID,
						BankAccountNumber: tx.TargetAccount,
						Amount:            tx.Amount,
						Currency:          "NGN",
						SenderName:        tx.SenderName,
						SenderAccount:     tx.SenderAccount,
						SenderBank:        tx.SenderBank,
						Reference:         tx.Reference,
						Reason:            "va_" + va.Status,
						Status:            "unresolved",
						Provider:          "nomba",
						IsLive:            isLive,
					}
					s.repo.CreateMisdirectedPayment(ctx, mp)
					continue
				}

				// Create the transaction
				vatx := &models.VirtualAccountTransaction{
					VirtualAccountID: va.Base.ID,
					ProjectID:        pc.ProjectID,
					PvcID:            va.PvcID,
					Amount:           tx.Amount,
					Currency:         "NGN",
					SenderName:       tx.SenderName,
					SenderAccount:    tx.SenderAccount,
					SenderBank:       tx.SenderBank,
					Reference:        tx.Reference,
					Status:           tx.Status,
					Provider:         "nomba",
					IsLive:           isLive,
				}
				s.repo.CreateTransaction(ctx, vatx)

				// Fabricate webhook payload for the merchant
				merchantPayload, _ := json.Marshal(map[string]any{
					"event":              "virtual_account.credit",
					"pvc_id":             va.PvcID,
					"customer_reference": va.CustomerReference,
					"amount":             tx.Amount,
					"currency":           "NGN",
					"sender_name":        tx.SenderName,
					"sender_account":     tx.SenderAccount,
					"sender_bank":        tx.SenderBank,
					"reference":          tx.Reference,
				})

				// Fetch WebhookConfig and trigger it
				var wcs []models.WebhookConfig
				s.repo.GetDB().WithContext(ctx).Preload("Project").Where("project_id = ? AND event_name = ? AND is_active = ? AND is_live = ?", pc.ProjectID, "virtual_account.credit", true, isLive).Find(&wcs)

				for _, wc := range wcs {
					wl := &models.WebhookLog{
						ProjectID:       pc.ProjectID,
						WebhookConfigID: &wc.Base.ID,
						Event:           "virtual_account.credit",
						Reference:       tx.Reference,
						Amount:          tx.Amount,
						Status:          "success",
						ForwardedStatus: 0,
						Payload:         "{\"source\": \"polling_fallback\"}",
						IsLive:          isLive,
					}

					if wc.TargetURL == "" {
						wl.ForwardedStatus = 200
						wl.ErrorMessage = "Locally stored; no forwarding target URL configured"
						s.repo.GetDB().WithContext(ctx).Create(wl)
					} else {
						apiKey := wc.Project.ApiKey
						if !isLive && wc.Project.TestApiKey != "" {
							apiKey = wc.Project.TestApiKey
						}
						go s.forwardWebhook(wl, wc.TargetURL, apiKey, merchantPayload)
					}
				}
			}
		}
	}
	return nil
}

func (s *VAService) forwardWebhook(wl *models.WebhookLog, targetURL, apiKey string, payload []byte) {
	mac := hmac.New(sha256.New, []byte(apiKey))
	mac.Write(payload)
	payeSignature := hex.EncodeToString(mac.Sum(nil))

	req, _ := http.NewRequest("POST", targetURL, bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-paye-signature", payeSignature)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)

	if err != nil {
		wl.ErrorMessage = err.Error()
	} else {
		defer resp.Body.Close()
		wl.ForwardedStatus = resp.StatusCode
	}
	s.repo.GetDB().WithContext(context.Background()).Create(wl)
}
