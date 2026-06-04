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

func (s *WebhookService) CreateWebhook(ctx context.Context, req *dto.WebhookConfigRequest, userId string) (*dto.WebhookConfigResponse, error) {
	slug := req.PayeWebhookSlug
	if slug == "" {
		slug = uuid.New().String()
	}

	wc := dto.ToWebhookConfig(req)
	wc.PayeWebhookSlug = slug

	config, err := s.repo.Create(ctx, wc, userId)
	if err != nil {
		return nil, err
	}
	return dto.ToWebhookConfigResponse(config), nil
}

func (s *WebhookService) ListWebhooks(ctx context.Context, userId string) ([]*dto.WebhookConfigResponse, error) {
	configs, err := s.repo.List(ctx, userId)
	if err != nil {
		return nil, err
	}
	res := make([]*dto.WebhookConfigResponse, 0, len(configs))
	for _, config := range configs {
		res = append(res, dto.ToWebhookConfigResponse(config))
	}
	return res, nil
}

func (s *WebhookService) UpdateWebhook(ctx context.Context, req *dto.WebhookConfigRequest, userId string, id string) (*dto.WebhookConfigResponse, error) {
	wc, err := s.repo.FindByID(ctx, id, userId)
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

func (s *WebhookService) DeleteWebhook(ctx context.Context, id string, userId string) error {
	wc, err := s.repo.FindByID(ctx, id, userId)
	if err != nil {
		return err
	}
	if wc == nil {
		return errors.New("webhook configuration not found")
	}
	return s.repo.Delete(ctx, id, userId)
}

func (s *WebhookService) ProcessWebhook(ctx context.Context, slug string, signature string, payload []byte) error {
	// Fetch webhook config
	wc, err := s.repo.FindBySlug(ctx, slug)
	if err != nil {
		return fmt.Errorf("webhook config not found for slug %s: %w", slug, err)
	}

	// Fetch active provider config
	pc, err := s.providerRepo.FindActiveProvider(ctx, wc.UserID.String(), wc.ProviderName)
	if err != nil {
		return fmt.Errorf("active provider config not found for provider %s: %w", wc.ProviderName, err)
	}

	// Decrypt provider secret key
	decryptedSecret, err := crypto.Decrypt(pc.SecretKey, s.encryptionKey)
	if err != nil {
		return fmt.Errorf("failed to decrypt provider secret key: %w", err)
	}

	// Instantiate provider client and handle signature verification
	var providerClient providers.Provider
	switch wc.ProviderName {
	case "paystack":
		providerClient = paystack.New(decryptedSecret)
	default:
		return fmt.Errorf("unsupported provider: %s", wc.ProviderName)
	}

	webhookEvent, err := providerClient.HandleWebhook(signature, payload)
	if err != nil {
		return fmt.Errorf("invalid webhook signature: %w", err)
	}

	// Create a WebhookLog record in the database
	wl := &models.WebhookLog{
		WebhookConfigID: wc.Base.ID,
		Event:           webhookEvent.Event,
		Reference:       webhookEvent.Reference,
		Amount:          webhookEvent.Amount,
		Status:          webhookEvent.Status,
		ForwardedStatus: 0,
		Payload:         string(payload),
	}
	err = s.repo.CreateLog(ctx, wl)
	if err != nil {
		log.Printf("WebhookProxy Warning: Failed to create WebhookLog: %v", err)
	}

	// Fetch user to get ApiKey for signing the proxied request
	u, err := s.userRepo.FindByID(wc.UserID.String())
	if err != nil {
		return fmt.Errorf("failed to fetch user for webhook config: %w", err)
	}

	// Asynchronously forward the webhook to the target URL
	go s.forwardWebhook(wl, wc.TargetURL, u.ApiKey, payload)

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
