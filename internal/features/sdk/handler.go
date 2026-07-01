package sdk

import (
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/api"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/features/projects"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/subscriptions"
	"github.com/ttomsin/paye/internal/features/transactions"
	"github.com/ttomsin/paye/internal/features/user"
	"github.com/ttomsin/paye/internal/middleware"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"

	"log/slog"
)

//go:embed paye.js
var payeJSTemplate string

type SDKHandler struct {
	userRepo            user.IUserRepo
	projectRepo         projects.IProjectRepo
	providerRepo        *providers.ProviderRepo
	transactionService  *transactions.TransactionService
	subscriptionService *subscriptions.SubscriptionService
	encryptionKey       string
	db                  *gorm.DB
}

func NewSDKHandler(
	userRepo user.IUserRepo,
	projectRepo projects.IProjectRepo,
	providerRepo *providers.ProviderRepo,
	transactionService *transactions.TransactionService,
	encryptionKey string,
	db *gorm.DB,
	subscriptionService *subscriptions.SubscriptionService,
) *SDKHandler {
	return &SDKHandler{
		userRepo:            userRepo,
		projectRepo:         projectRepo,
		providerRepo:        providerRepo,
		transactionService:  transactionService,
		subscriptionService: subscriptionService,
		encryptionKey:       encryptionKey,
		db:                  db,
	}
}

type InitializeSDKTransactionRequest struct {
	PublicID    string  `json:"publicId" binding:"required"`
	Amount      float64 `json:"amount" binding:"required"`
	Email       string  `json:"email" binding:"required,email"`
	Currency    string  `json:"currency"`
	Reference   string  `json:"reference"`
	CallbackURL string  `json:"callbackUrl"`
}

// ServeSDK serves the dynamic Javascript SDK script file for the merchant
// @Summary Serve dynamic Paye SDK script
// @Description Serve the Javascript SDK file customized for the merchant's active providers and keys
// @Tags SDK
// @Produce application/javascript
// @Param publicId path string true "Merchant or Project Public ID (ends with .js)"
// @Success 200 {string} string "JavaScript SDK Source"
// @Failure 400 {string} string "Missing or invalid Public ID"
// @Failure 404 {string} string "Project not found"
// @Router /sdk/{publicId} [get]
func (h *SDKHandler) ServeSDK(c *gin.Context) {
	param := c.Param("publicId")
	publicID := strings.TrimSuffix(param, ".js")

	if publicID == "" {
		c.Header("Content-Type", "application/javascript")
		c.String(http.StatusBadRequest, "console.error('Paye SDK Error: Missing or invalid Public ID parameter');")
		return
	}

	// 1. Resolve project by PublicID
	project, err := h.resolveProjectByPublicID(c.Request.Context(), publicID)
	if err != nil || project == nil {
		c.Header("Content-Type", "application/javascript")
		c.String(http.StatusNotFound, fmt.Sprintf("console.error('Paye SDK Error: Project/Merchant not found for Public ID: %s');", publicID))
		return
	}

	isLive := true
	if project.TestPublicID != "" && publicID == project.TestPublicID {
		isLive = false
	}

	// 2. Fetch project provider configurations
	configs := h.providerRepo.ListProviders(c.Request.Context(), project.Base.ID.String())

	var activeProviders []string
	var activePublicKey string

	env := "test"
	if isLive {
		env = "live"
	}

	for _, pc := range configs {
		if pc.IsActive && pc.Environment == env {
			activeProviders = append(activeProviders, pc.ProviderName)

			pubKeyEncrypted := pc.PublicKey
			if pubKeyEncrypted != "" {
				decryptedPublic, err := crypto.Decrypt(pubKeyEncrypted, h.encryptionKey)
				if err == nil && activePublicKey == "" {
					activePublicKey = decryptedPublic
				}
			}
		}
	}

	providersJSON, _ := json.Marshal(activeProviders)

	// Determine dynamic host domain
	scheme := "http"
	if c.Request.TLS != nil || c.Request.Header.Get("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	papiEndpoint := fmt.Sprintf("%s://%s/api/v1", scheme, c.Request.Host)

	replacer := strings.NewReplacer(
		"{{merchantId}}", publicID,
		"{{providers}}", string(providersJSON),
		"{{publicKey}}", activePublicKey,
		"{{papiEndpoint}}", papiEndpoint,
	)
	jsCode := replacer.Replace(payeJSTemplate)

	c.Header("Content-Type", "application/javascript")
	c.String(http.StatusOK, jsCode)
}

// InitializeSDKTransaction initializes transaction publicly using merchant's PublicID
// @Summary Initialize public transaction
// @Description Initialize a payment transaction from the client SDK using a project's Public ID
// @Tags SDK
// @Accept json
// @Produce json
// @Param request body InitializeSDKTransactionRequest true "Transaction details"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 404 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /sdk/transactions/initialize [post]
func (h *SDKHandler) InitializeSDKTransaction(c *gin.Context) {
	var req InitializeSDKTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	// 1. Resolve project by PublicID
	project, err := h.resolveProjectByPublicID(c.Request.Context(), req.PublicID)
	if err != nil || project == nil {
		c.JSON(http.StatusNotFound, api.Error(fmt.Sprintf("Project/Merchant not found for Public ID: %s", req.PublicID)))
		return
	}

	isLive := true
	if project.TestPublicID != "" && req.PublicID == project.TestPublicID {
		isLive = false
	}
	reqCtx := context.WithValue(c.Request.Context(), middleware.IsLiveCtxKey, isLive)
	c.Request = c.Request.WithContext(reqCtx)

	// 2. Delegate transaction initialization to TransactionService
	initReq := &dto.InitializeTransactionRequest{
		Amount:      req.Amount,
		Email:       req.Email,
		Currency:    req.Currency,
		Reference:   req.Reference,
		CallbackURL: req.CallbackURL,
	}
	if initReq.Currency == "" {
		initReq.Currency = "NGN"
	}

	resp, err := h.transactionService.InitializeTransaction(c.Request.Context(), project.Base.ID.String(), initReq)
	if err != nil {
		if strings.Contains(err.Error(), "active provider config not found") {
			envStr := "test"
			if isLive {
				envStr = "live"
			}
			msg := fmt.Sprintf("No active payment provider is configured for the %s environment. Please configure a %s provider in your Paye dashboard.", envStr, envStr)
			c.JSON(http.StatusBadRequest, api.Error(msg))
			return
		}
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error("An internal error occurred. Please try again later."))
		return
	}

	c.JSON(http.StatusOK, api.Success("Transaction initialized successfully", resp))
}

func (h *SDKHandler) resolveProjectByPublicID(ctx context.Context, publicID string) (*models.Project, error) {
	// Try finding project by PublicID first
	project, err := h.projectRepo.FindByPublicID(ctx, publicID)
	if err == nil && project != nil {
		return project, nil
	}

	// Legacy fallback: look up user by PublicID
	merchant, err := h.userRepo.FindByPublicID(publicID)
	if err != nil || merchant == nil {
		return nil, fmt.Errorf("merchant or project not found for Public ID: %s", publicID)
	}

	// Find first project or create default project
	projs, err := h.projectRepo.ListProjects(ctx, merchant.Base.ID.String())
	if err == nil && len(projs) > 0 {
		return projs[0], nil
	}

	// Auto-create default project
	liveApiKey, err := crypto.GenerateAPIKey(true)
	if err != nil {
		return nil, err
	}
	testApiKey, err := crypto.GenerateAPIKey(false)
	if err != nil {
		return nil, err
	}
	testPublicID, err := crypto.GeneratePublicID(false)
	if err != nil {
		return nil, err
	}

	defaultProject := &models.Project{
		Name:         "Default Project",
		ApiKey:       liveApiKey,
		PublicID:     merchant.PublicID,
		TestApiKey:   testApiKey,
		TestPublicID: testPublicID,
		UserID:       merchant.Base.ID,
	}
	if err := h.projectRepo.CreateProject(ctx, defaultProject); err != nil {
		return nil, err
	}
	return defaultProject, nil
}

type CreateSDKSubscriptionRequest struct {
	PublicID      string `json:"publicId" binding:"required"`
	CustomerEmail string `json:"customerEmail" binding:"required,email"`
	PlanID        string `json:"planId" binding:"required"`
	Reference     string `json:"reference" binding:"required"`
}

// @Summary Create public subscription
// @Description Initialize a subscription from the client SDK using a project's Public ID
// @Tags SDK
// @Accept json
// @Produce json
// @Param request body CreateSDKSubscriptionRequest true "Subscription details"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 404 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /sdk/subscriptions [post]
func (h *SDKHandler) CreateSDKSubscription(c *gin.Context) {
	var req CreateSDKSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	// 1. Resolve project by PublicID
	project, err := h.resolveProjectByPublicID(c.Request.Context(), req.PublicID)
	if err != nil || project == nil {
		c.JSON(http.StatusNotFound, api.Error(fmt.Sprintf("Project/Merchant not found for Public ID: %s", req.PublicID)))
		return
	}

	isLive := true
	if project.TestPublicID != "" && req.PublicID == project.TestPublicID {
		isLive = false
	}
	reqCtx := context.WithValue(c.Request.Context(), middleware.IsLiveCtxKey, isLive)
	c.Request = c.Request.WithContext(reqCtx)

	// 2. Look up the plan by planId scoped to that project
	var plan models.Plan
	if err := h.db.WithContext(c.Request.Context()).
		Where("id = ? AND project_id = ?", req.PlanID, project.Base.ID).
		First(&plan).Error; err != nil {
		c.JSON(http.StatusNotFound, api.Error("Billing plan not found or doesn't belong to this project"))
		return
	}

	// 3. Look up the authorization_code stored against customerEmail for that project
	var tx models.Transaction
	err = h.db.WithContext(c.Request.Context()).
		Where("project_id = ? AND email = ? AND status = ? AND authorization_code <> ''", project.Base.ID, req.CustomerEmail, "success").
		Order("created_at DESC").
		First(&tx).Error
	if err != nil {
		c.JSON(http.StatusBadRequest, api.Error("No authorization code found on file for this customer email. The customer must complete a successful one-time payment before subscribing."))
		return
	}

	// 4. Call the Paye local subscription service's CreateSubscription
	sub, err := h.subscriptionService.CreateSubscription(
		c.Request.Context(),
		project.Base.ID,
		req.CustomerEmail,
		plan.ID.String(),
		tx.AuthorizationCode,
		tx.Provider, // We use the provider from the successful initial transaction
	)

	if err != nil {
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error("An internal error occurred. Please try again later."))
		return
	}

	response := map[string]interface{}{
		"subscription_code": sub.SubscriptionCode,
		"customer":          sub.CustomerEmail,
		"plan":              sub.PlanCode,
		"status":            sub.Status,
		"next_billing_date": sub.NextBillingDate,
	}

	c.JSON(http.StatusOK, api.Success("Subscription successfully created", response))
}

// VerifySDKTransaction verifies the transaction status publicly (used by JS SDK)
func (h *SDKHandler) VerifySDKTransaction(c *gin.Context) {
	reference := c.Param("reference")
	if reference == "" {
		c.JSON(http.StatusBadRequest, api.Error("Reference parameter is required"))
		return
	}

	// Query transaction by reference across all projects
	var tx models.Transaction
	err := h.db.WithContext(c.Request.Context()).Where("reference = ?", reference).First(&tx).Error
	if err != nil {
		c.JSON(http.StatusNotFound, api.Error("Transaction not found"))
		return
	}

	// Call the transaction service to verify the transaction
	resp, err := h.transactionService.VerifyTransaction(c.Request.Context(), tx.ProjectID.String(), reference)
	if err != nil {
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error("An internal error occurred. Please try again later."))
		return
	}

	c.JSON(http.StatusOK, api.Success("Transaction verified successfully", resp))
}
