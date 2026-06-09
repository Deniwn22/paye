package webhooks

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/providers/flutterwave"
	"github.com/ttomsin/paye/internal/features/providers/paystack"
	"github.com/ttomsin/paye/internal/features/user"
	"github.com/ttomsin/paye/internal/models"
)

type WebhookService struct {
	repo          *WebhookRepo
	providerRepo  *providers.ProviderRepo
	userRepo      user.IUserRepo
	encryptionKey string
	httpClient    *http.Client
}

func NewWebhookService(repo *WebhookRepo, providerRepo *providers.ProviderRepo, userRepo user.IUserRepo, encryptionKey string) *WebhookService {
	return &WebhookService{
		repo:          repo,
		providerRepo:  providerRepo,
		userRepo:      userRepo,
		encryptionKey: encryptionKey,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (s *WebhookService) CreateWebhook(ctx context.Context, req *dto.WebhookConfigRequest, projectID string) (*dto.WebhookConfigResponse, error) {
	slug := req.PayeWebhookSlug
	if slug == "" {
		slug = uuid.New().String()
	}

	wc := dto.ToWebhookConfig(req)
	wc.PayeWebhookSlug = slug

	config, err := s.repo.Create(ctx, wc, projectID)
	if err != nil {
		return nil, err
	}
	return dto.ToWebhookConfigResponse(config), nil
}

func (s *WebhookService) ListWebhooks(ctx context.Context, projectID string) ([]*dto.WebhookConfigResponse, error) {
	configs, err := s.repo.List(ctx, projectID)
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
	if req.PayeWebhookSlug != "" {
		wc.PayeWebhookSlug = req.PayeWebhookSlug
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

	// Fetch active provider config scoped to project
	pc, err := s.providerRepo.FindActiveProvider(ctx, wc.ProjectID.String(), wc.ProviderName)
	if err != nil {
		return fmt.Errorf("active provider config not found for provider %s: %w", wc.ProviderName, err)
	}

	// Try verifying with Live keys first, then Test keys
	var webhookEvent *providers.WebhookEvent
	var isLive bool
	var verifyErr error

	// Try Live key
	liveSecret, _ := pc.GetKeysForMode(true)
	if liveSecret != "" {
		decryptedSecret, err := crypto.Decrypt(liveSecret, s.encryptionKey)
		if err == nil {
			var providerClient providers.Provider
			switch wc.ProviderName {
			case "paystack":
				providerClient = paystack.New(decryptedSecret)
			case "flutterwave":
				providerClient = flutterwave.New(decryptedSecret)
			}
			if providerClient != nil {
				webhookEvent, verifyErr = providerClient.HandleWebhook(signature, payload)
				if verifyErr == nil {
					isLive = true
				}
			}
		}
	}

	// Try Test key if live verification failed or was not configured
	if webhookEvent == nil {
		testSecret, _ := pc.GetKeysForMode(false)
		if testSecret != "" {
			decryptedSecret, err := crypto.Decrypt(testSecret, s.encryptionKey)
			if err == nil {
				var providerClient providers.Provider
				switch wc.ProviderName {
				case "paystack":
					providerClient = paystack.New(decryptedSecret)
				case "flutterwave":
					providerClient = flutterwave.New(decryptedSecret)
				}
				if providerClient != nil {
					webhookEvent, verifyErr = providerClient.HandleWebhook(signature, payload)
					if verifyErr == nil {
						isLive = false
					}
				}
			}
		}
	}

	if webhookEvent == nil {
		if verifyErr != nil {
			return fmt.Errorf("invalid webhook signature: %w", verifyErr)
		}
		return fmt.Errorf("failed to verify webhook signature: no credentials succeeded")
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
		log.Printf("WebhookProxy Warning: Failed to create WebhookLog: %v", err)
	}

	if webhookEvent.AuthorizationCode != "" {
		_ = s.repo.UpdateTransactionAuthCode(ctx, webhookEvent.Reference, webhookEvent.AuthorizationCode, "success", string(payload))
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
		log.Printf("WebhookProxy Error: Failed to create request to %s: %v", targetURL, err)
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
		log.Printf("WebhookProxy Error: Failed to forward payload to %s: %v", targetURL, err)
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
		log.Printf("WebhookProxy Warning: Target %s responded with status %s", targetURL, resp.Status)
	} else {
		log.Printf("WebhookProxy Success: Successfully forwarded event to %s with status %s", targetURL, resp.Status)
	}
}

func (s *WebhookService) ListLogs(ctx context.Context, projectID string, isLive bool, limit int, offset int) ([]*models.WebhookLog, error) {
	return s.repo.ListLogs(ctx, projectID, isLive, limit, offset)
}
