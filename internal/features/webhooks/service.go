package webhooks

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/features/notifications"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/providers/flutterwave"
	"github.com/ttomsin/paye/internal/features/providers/nomba"
	"github.com/ttomsin/paye/internal/features/providers/opay"
	"github.com/ttomsin/paye/internal/features/providers/paystack"
	"github.com/ttomsin/paye/internal/features/user"
	"github.com/ttomsin/paye/internal/features/virtual_accounts"
	"github.com/ttomsin/paye/internal/models"
)

type WebhookService struct {
	repo          *WebhookRepo
	vaRepo        *virtual_accounts.VARepository
	providerRepo  *providers.ProviderRepo
	userRepo      user.IUserRepo
	encryptionKey string
	httpClient    *http.Client
	notifier      *notifications.NotificationService
}

func NewWebhookService(repo *WebhookRepo, vaRepo *virtual_accounts.VARepository, providerRepo *providers.ProviderRepo, userRepo user.IUserRepo, encryptionKey string, notifier *notifications.NotificationService) *WebhookService {
	return &WebhookService{
		repo:          repo,
		vaRepo:        vaRepo,
		providerRepo:  providerRepo,
		userRepo:      userRepo,
		encryptionKey: encryptionKey,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		notifier: notifier,
	}
}

func (s *WebhookService) CreateWebhook(ctx context.Context, req *dto.WebhookConfigRequest, projectID string) (*dto.WebhookConfigResponse, error) {
	env := req.Environment
	if env == "" {
		env = "test"
	}
	existing, err := s.repo.FindByProjectProviderAndEnv(ctx, projectID, req.ProviderName, env)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("a webhook configuration for this provider and environment already exists")
	}

	slug := req.PayeWebhookSlug
	if slug == "" {
		slug = uuid.New().String()
	}
	if !strings.HasPrefix(slug, env+"_") {
		slug = env + "_" + slug
	}

	wc := dto.ToWebhookConfig(req)
	wc.PayeWebhookSlug = slug

	config, err := s.repo.Create(ctx, wc, projectID)
	if err != nil {
		return nil, err
	}
	return dto.ToWebhookConfigResponse(config), nil
}

func (s *WebhookService) ListWebhooks(ctx context.Context, projectID string, env string) ([]*dto.WebhookConfigResponse, error) {
	configs, err := s.repo.List(ctx, projectID, env)
	if err != nil {
		return nil, err
	}
	res := make([]*dto.WebhookConfigResponse, 0, len(configs))
	for _, config := range configs {
		res = append(res, dto.ToWebhookConfigResponse(config))
	}
	return res, nil
}

func (s *WebhookService) UpdateWebhook(ctx context.Context, req *dto.WebhookConfigRequest, projectID string, id string) (*dto.WebhookConfigResponse, error) {
	wc, err := s.repo.FindByID(ctx, id, projectID)
	if err != nil {
		return nil, err
	}
	if wc == nil {
		return nil, errors.New("webhook configuration not found")
	}

	wc.ProviderName = req.ProviderName
	wc.TargetURL = req.TargetURL
	env := wc.Environment
	if req.Environment != "" {
		env = req.Environment
		wc.Environment = req.Environment
	}
	if req.PayeWebhookSlug != "" {
		slug := req.PayeWebhookSlug
		if !strings.HasPrefix(slug, env+"_") {
			slug = env + "_" + slug
		}
		wc.PayeWebhookSlug = slug
	}

	if err := s.repo.Update(ctx, wc); err != nil {
		return nil, err
	}
	return dto.ToWebhookConfigResponse(wc), nil
}

func (s *WebhookService) DeleteWebhook(ctx context.Context, id string, projectID string) error {
	wc, err := s.repo.FindByID(ctx, id, projectID)
	if err != nil {
		return err
	}
	if wc == nil {
		return errors.New("webhook configuration not found")
	}
	return s.repo.Delete(ctx, id, projectID)
}

func (s *WebhookService) ProcessWebhook(ctx context.Context, slug string, signature string, payload []byte) error {
	// Fetch webhook config
	wc, err := s.repo.FindBySlug(ctx, slug)
	if err != nil {
		return fmt.Errorf("webhook config not found for slug %s: %w", slug, err)
	}

	// Fetch active provider configs scoped to project
	pcs, err := s.providerRepo.FindAllActiveProvidersByName(ctx, wc.ProjectID.String(), wc.ProviderName)
	if err != nil || len(pcs) == 0 {
		return fmt.Errorf("active provider config not found for provider %s: %w", wc.ProviderName, err)
	}

	var webhookEvent *providers.WebhookEvent
	var isLive bool
	var verifyErr error

	for _, pc := range pcs {
		secret := pc.WebhookSecret
		if secret == "" {
			secret = pc.SecretKey
		}
		if secret != "" {
			decryptedSecret, err := crypto.Decrypt(secret, s.encryptionKey)
			if err == nil {
				var providerClient providers.Provider
				isLiveEnv := pc.Environment == "live"
				switch wc.ProviderName {
				case "paystack":
					providerClient = paystack.New(decryptedSecret)
				case "flutterwave":
					providerClient = flutterwave.New(decryptedSecret)
				case "nomba":
					decryptedPublic, _ := crypto.Decrypt(pc.PublicKey, s.encryptionKey)
					decryptedWebhookSecret, _ := crypto.Decrypt(pc.WebhookSecret, s.encryptionKey)
					accountID := pc.Metadata.NombaAccountID
					providerClient = nomba.New(decryptedPublic, decryptedSecret, decryptedWebhookSecret, accountID, isLiveEnv)
				case "opay":
					decryptedPublic, _ := crypto.Decrypt(pc.PublicKey, s.encryptionKey)
					merchantID := pc.Metadata.OpayAccountID
					providerClient = opay.New(decryptedPublic, decryptedSecret, merchantID, isLiveEnv)
				}
				if providerClient != nil {
					we, verr := providerClient.HandleWebhook(signature, payload)
					if verr == nil {
						webhookEvent = we
						isLive = isLiveEnv
						verifyErr = nil
						break // successful verification!
					} else {
						verifyErr = verr // save last error
					}
				}
			}
		}
	}

	if webhookEvent == nil {
		errStr := "failed to verify webhook signature: no credentials succeeded"
		if verifyErr != nil {
			errStr = verifyErr.Error()
		}

		// Try parsing basic info from payload for logging
		var eventName, ref string
		var amt float64
		var payloadData struct {
			Event string         `json:"event"`
			Data  map[string]any `json:"data"`
		}
		if err := json.Unmarshal(payload, &payloadData); err == nil {
			eventName = payloadData.Event
			if payloadData.Data != nil {
				if r, ok := payloadData.Data["tx_ref"].(string); ok {
					ref = r
				} else if r, ok := payloadData.Data["reference"].(string); ok {
					ref = r
				}
				if a, ok := payloadData.Data["amount"].(float64); ok {
					amt = a
				}
			}
		}

		// Determine isLive based on transaction lookup
		isLive := false
		if ref != "" {
			var tx models.Transaction
			if s.repo.db.WithContext(ctx).Where("reference = ?", ref).First(&tx).Error == nil {
				isLive = tx.IsLive
			}
		}

		// Branch based on webhook type
		switch wc.Type {
		case models.VA:
			return s.processVAWebhook(ctx, wc, payload, isLive)
		case models.ALL:
			var eventPayload struct {
				EventType string `json:"event_type"`
				Data      struct {
					Transaction struct {
						Type string `json:"type"`
					} `json:"transaction"`
				} `json:"data"`
			}
			json.Unmarshal(payload, &eventPayload)
			if eventPayload.Data.Transaction.Type == "vact_transfer" {
				return s.processVAWebhook(ctx, wc, payload, isLive)
			}
			// else fall through to payment flow
		}

		// Create a failed WebhookLog record in the database for debugging
		wl := &models.WebhookLog{
			ProjectID:       wc.ProjectID,
			WebhookConfigID: &wc.Base.ID,
			Event:           eventName,
			Reference:       ref,
			Amount:          amt,
			Status:          "failed",
			ForwardedStatus: 0,
			Payload:         string(payload),
			IsLive:          isLive,
			ErrorMessage:    errStr,
		}

		_ = s.repo.CreateLog(ctx, wl)

		return fmt.Errorf("%s", errStr)
	}

	// Create a WebhookLog record in the database
	wl := &models.WebhookLog{
		ProjectID:       wc.ProjectID,
		WebhookConfigID: &wc.Base.ID,
		Event:           webhookEvent.Event,
		Reference:       webhookEvent.Reference,
		Amount:          webhookEvent.Amount,
		Status:          webhookEvent.Status,
		ForwardedStatus: 0,
		Payload:         string(payload),
		IsLive:          isLive,
	}

	if wc.TargetURL == "" {
		wl.ForwardedStatus = 200
		wl.ErrorMessage = "Locally stored; no forwarding target URL configured"
	}

	err = s.repo.CreateLog(ctx, wl)
	if err != nil {
		slog.Warn("WebhookProxy: Failed to create WebhookLog", "error", err)
	}

	dbStatus := "pending"
	if webhookEvent.Status == string(providers.StatusSuccess) || webhookEvent.Status == "success" {
		dbStatus = "success"
	} else if webhookEvent.Status == string(providers.StatusFailed) || webhookEvent.Status == "failed" {
		dbStatus = "failed"
	}

	_ = s.repo.UpdateTransactionStatusAndAuthCode(
		ctx,
		webhookEvent.Reference,
		webhookEvent.AuthorizationCode,
		dbStatus,
		webhookEvent.Status,
		string(payload),
	)

	// Fetch transaction and broadcast real-time notification
	var tx models.Transaction
	if s.repo.db.WithContext(ctx).Where("reference = ?", webhookEvent.Reference).First(&tx).Error == nil {
		if s.notifier != nil {
			title := "Transaction Pending"
			message := fmt.Sprintf("Transaction reference %s of %s %.2f is pending via %s.", tx.Reference, tx.Currency, tx.Amount, tx.Provider)
			if tx.Status == "success" {
				title = "Transaction Successful"
				message = fmt.Sprintf("Transaction reference %s of %s %.2f was successful via %s.", tx.Reference, tx.Currency, tx.Amount, tx.Provider)
			} else if tx.Status == "failed" {
				title = "Transaction Failed"
				message = fmt.Sprintf("Transaction reference %s of %s %.2f failed via %s.", tx.Reference, tx.Currency, tx.Amount, tx.Provider)
			}
			_ = s.notifier.CreateAndNotify(ctx, tx.ProjectID.String(), title, message, tx.Status, dto.ToVerifyTransactionResponse(&tx, ""))
		}
	}

	// Forward webhook if TargetURL is not empty
	if wc.TargetURL != "" {
		apiKey := wc.Project.ApiKey
		if !isLive {
			if wc.Project.TestApiKey != "" {
				apiKey = wc.Project.TestApiKey
			}
		}
		go s.forwardWebhook(wl, wc.TargetURL, apiKey, payload)
	}

	return nil
}

func (s *WebhookService) forwardWebhook(wl *models.WebhookLog, targetURL string, apiKey string, payload []byte) {
	// Calculate HMAC-SHA256 signature using the user's API Key
	mac := hmac.New(sha256.New, []byte(apiKey))
	mac.Write(payload)
	payeSignature := hex.EncodeToString(mac.Sum(nil))

	req, err := http.NewRequest("POST", targetURL, bytes.NewBuffer(payload))
	if err != nil {
		slog.Error("WebhookProxy: Failed to create request", "target_url", targetURL, "error", err)
		if wl != nil {
			wl.ForwardedStatus = 0
			wl.ErrorMessage = fmt.Sprintf("failed to create request: %v", err)
			_ = s.repo.UpdateLog(context.Background(), wl)
		}
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Paye-Signature", payeSignature)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		slog.Error("WebhookProxy: Failed to forward payload", "target_url", targetURL, "error", err)
		if wl != nil {
			wl.ForwardedStatus = 0
			wl.ErrorMessage = fmt.Sprintf("network error: %v", err)
			_ = s.repo.UpdateLog(context.Background(), wl)
		}
		return
	}
	defer resp.Body.Close()

	if wl != nil {
		wl.ForwardedStatus = resp.StatusCode
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			wl.ErrorMessage = fmt.Sprintf("target server returned status %s", resp.Status)
		}
		_ = s.repo.UpdateLog(context.Background(), wl)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		slog.Warn("WebhookProxy: Target responded with warning status", "target_url", targetURL, "status", resp.Status)
	} else {
		slog.Info("WebhookProxy: Successfully forwarded event", "target_url", targetURL, "status", resp.Status)
	}
}

func (s *WebhookService) ListLogs(ctx context.Context, projectID string, isLive bool, limit int, offset int) ([]*models.WebhookLog, error) {
	return s.repo.ListLogs(ctx, projectID, isLive, limit, offset)
}

func (s *WebhookService) ListAllLogs(ctx context.Context, projectID string, limit int, offset int) ([]*models.WebhookLog, error) {
	return s.repo.ListAllLogs(ctx, projectID, limit, offset)
}

func (s *WebhookService) processVAWebhook(ctx context.Context, wc *models.WebhookConfig, payload []byte, isLive bool) error {
	var nombaPayload struct {
		Data struct {
			Transaction struct {
				TransactionID string  `json:"transactionId"`
				Type          string  `json:"type"`
				Amount        float64 `json:"transactionAmount"`
				Reference     string  `json:"sessionId"`
			} `json:"transaction"`
			Customer struct {
				SenderName    string `json:"senderName"`
				BankName      string `json:"bankName"`
				AccountNumber string `json:"accountNumber"`
			} `json:"customer"`
			Merchant struct {
				WalletID string `json:"walletId"`
			} `json:"merchant"`
		} `json:"data"`
	}

	if err := json.Unmarshal(payload, &nombaPayload); err != nil {
		return fmt.Errorf("va webhook: failed to parse payload: %w", err)
	}

	// aliasAccountNumber is the VA account number — use it to look up the VA
	// we look up by accountRef stored in DB, but we need to find VA by bank account number
	var aliasPayload struct {
		Data struct {
			Transaction struct {
				AliasAccountNumber string `json:"aliasAccountNumber"`
			} `json:"transaction"`
		} `json:"data"`
	}
	json.Unmarshal(payload, &aliasPayload)
	bankAccountNumber := aliasPayload.Data.Transaction.AliasAccountNumber

	if bankAccountNumber == "" {
		return fmt.Errorf("va webhook: aliasAccountNumber missing from payload")
	}

	// Look up VA by bank account number scoped to project
	va, err := s.vaRepo.FindByBankAccountNumber(ctx, bankAccountNumber, wc.ProjectID.String())
	if err != nil {
		mp := &models.MisdirectedPayment{
			ProjectID:         &wc.ProjectID,
			BankAccountNumber: bankAccountNumber,
			Amount:            nombaPayload.Data.Transaction.Amount,
			Currency:          "NGN",
			SenderName:        nombaPayload.Data.Customer.SenderName,
			SenderAccount:     nombaPayload.Data.Customer.AccountNumber,
			SenderBank:        nombaPayload.Data.Customer.BankName,
			Reference:         nombaPayload.Data.Transaction.TransactionID,
			Reason:            "va_not_found",
			Status:            "unresolved",
			Provider:          "nomba",
			IsLive:            isLive,
		}
		s.vaRepo.CreateMisdirectedPayment(ctx, mp)
		s.notifyMisdirected(ctx, wc, mp, payload, isLive)
		return nil
	}

	// VA found but not active
	if va.Status != "active" {
		mp := &models.MisdirectedPayment{
			ProjectID:         &wc.ProjectID,
			BankAccountNumber: bankAccountNumber,
			Amount:            nombaPayload.Data.Transaction.Amount,
			Currency:          "NGN",
			SenderName:        nombaPayload.Data.Customer.SenderName,
			SenderAccount:     nombaPayload.Data.Customer.AccountNumber,
			SenderBank:        nombaPayload.Data.Customer.BankName,
			Reference:         nombaPayload.Data.Transaction.TransactionID,
			Reason:            "va_" + va.Status,
			Status:            "unresolved",
			Provider:          "nomba",
			IsLive:            isLive,
		}
		s.vaRepo.CreateMisdirectedPayment(ctx, mp)
		s.notifyMisdirected(ctx, wc, mp, payload, isLive)
		return nil
	}

	// Idempotency check we must not process same transaction twice
	if _, err := s.vaRepo.FindTransactionByReference(ctx, nombaPayload.Data.Transaction.TransactionID); err == nil {
		// already processed
		return nil
	}

	// VA is active — process normally
	vatx := &models.VirtualAccountTransaction{
		VirtualAccountID: va.Base.ID,
		ProjectID:        wc.ProjectID,
		PvcID:            va.PvcID,
		Amount:           nombaPayload.Data.Transaction.Amount,
		Currency:         "NGN",
		SenderName:       nombaPayload.Data.Customer.SenderName,
		SenderAccount:    nombaPayload.Data.Customer.AccountNumber,
		SenderBank:       nombaPayload.Data.Customer.BankName,
		Reference:        nombaPayload.Data.Transaction.TransactionID,
		Status:           "success",
		Provider:         "nomba",
		IsLive:           isLive,
	}
	
	if _, err := s.vaRepo.CreateTransaction(ctx, vatx); err != nil {
		return fmt.Errorf("va webhook: failed to persist transaction: %w", err)
	}

	merchantPayload, _ := json.Marshal(map[string]any{
		"event":              "virtual_account.credit",
		"pvc_id":             va.PvcID,
		"customer_reference": va.CustomerReference,
		"amount":             nombaPayload.Data.Transaction.Amount,
		"currency":           "NGN",
		"sender_name":        nombaPayload.Data.Customer.SenderName,
		"sender_account":     nombaPayload.Data.Customer.AccountNumber,
		"sender_bank":        nombaPayload.Data.Customer.BankName,
		"reference":          nombaPayload.Data.Transaction.TransactionID,
	})

	wl := &models.WebhookLog{
		ProjectID:       wc.ProjectID,
		WebhookConfigID: &wc.Base.ID,
		Event:           "virtual_account.credit",
		Reference:       nombaPayload.Data.Transaction.TransactionID,
		Amount:          nombaPayload.Data.Transaction.Amount,
		Status:          "success",
		ForwardedStatus: 0,
		Payload:         string(payload),
		IsLive:          isLive,
	}

	if wc.TargetURL == "" {
		wl.ForwardedStatus = 200
		wl.ErrorMessage = "Locally stored; no forwarding target URL configured"
	}
	_ = s.repo.CreateLog(ctx, wl)

	if wc.TargetURL != "" {
		apiKey := wc.Project.ApiKey
		if !isLive {
			if wc.Project.TestApiKey != "" {
				apiKey = wc.Project.TestApiKey
			}
		}
		go s.forwardWebhook(wl, wc.TargetURL, apiKey, merchantPayload)
	}
	return nil
}

func (s *WebhookService) notifyMisdirected(ctx context.Context, wc *models.WebhookConfig, mp *models.MisdirectedPayment, payload []byte, isLive bool) {
	wl := &models.WebhookLog{
		ProjectID:       wc.ProjectID,
		WebhookConfigID: &wc.Base.ID,
		Event:           "virtual_account.misdirected",
		Reference:       mp.Reference,
		Amount:          mp.Amount,
		Status:          "misdirected",
		ForwardedStatus: 0,
		Payload:         string(payload),
		IsLive:          isLive,
		ErrorMessage:    mp.Reason,
	}

	if wc.TargetURL == "" {
		wl.ForwardedStatus = 200
		wl.ErrorMessage = mp.Reason + "; locally stored"
	}
	_ = s.repo.CreateLog(ctx, wl)

	if wc.TargetURL != "" {
		merchantPayload, _ := json.Marshal(map[string]any{
			"event":               "virtual_account.misdirected",
			"bank_account_number": mp.BankAccountNumber,
			"amount":              mp.Amount,
			"currency":            mp.Currency,
			"sender_name":         mp.SenderName,
			"sender_account":      mp.SenderAccount,
			"sender_bank":         mp.SenderBank,
			"reference":           mp.Reference,
			"reason":              mp.Reason,
		})
		apiKey := wc.Project.ApiKey
		if !isLive {
			if wc.Project.TestApiKey != "" {
				apiKey = wc.Project.TestApiKey
			}
		}
		go s.forwardWebhook(wl, wc.TargetURL, apiKey, merchantPayload)
	}
}
