package webhooks

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/api"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/middleware"
)

type WebhookHandler struct {
	service *WebhookService
}

func NewWebhookHandler(service *WebhookService) *WebhookHandler {
	return &WebhookHandler{service: service}
}

// CreateWebhookHandler godoc
// @Summary Create webhook configuration
// @Description Register a webhook callback target for a specific provider
// @Tags Webhooks
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body dto.WebhookConfigRequest true "Webhook Configuration Payload"
// @Success 200 {object} api.SwaggerWebhookConfigResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /webhooks/configs [post]
func (h *WebhookHandler) CreateWebhookHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Project context missing"))
		return
	}

	var req dto.WebhookConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	resp, err := h.service.CreateWebhook(c.Request.Context(), &req, projectID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Webhook configuration created successfully", resp))
}

// ListWebhooksHandler godoc
// @Summary List webhook configurations
// @Description Retrieve all webhook configs for the authenticated user
// @Tags Webhooks
// @Security BearerAuth
// @Produce json
// @Success 200 {object} api.SwaggerWebhookConfigListResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /webhooks/configs [get]
func (h *WebhookHandler) ListWebhooksHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Project context missing"))
		return
	}

	resp, err := h.service.ListWebhooks(c.Request.Context(), projectID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Webhook configurations retrieved successfully", resp))
}

// UpdateWebhookHandler godoc
// @Summary Update webhook configuration
// @Description Modify a specific webhook config
// @Tags Webhooks
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Webhook Config ID"
// @Param request body dto.WebhookConfigRequest true "Webhook Config Update Payload"
// @Success 200 {object} api.SwaggerWebhookConfigResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 404 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /webhooks/configs/{id} [put]
func (h *WebhookHandler) UpdateWebhookHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Project context missing"))
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, api.Error("Webhook ID is required"))
		return
	}

	var req dto.WebhookConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	resp, err := h.service.UpdateWebhook(c.Request.Context(), &req, projectID.(string), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Webhook configuration updated successfully", resp))
}

// DeleteWebhookHandler godoc
// @Summary Delete webhook configuration
// @Description Remove a specific webhook config
// @Tags Webhooks
// @Security BearerAuth
// @Produce json
// @Param id path string true "Webhook Config ID"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 404 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /webhooks/configs/{id} [delete]
func (h *WebhookHandler) DeleteWebhookHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Project context missing"))
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, api.Error("Webhook ID is required"))
		return
	}

	err := h.service.DeleteWebhook(c.Request.Context(), id, projectID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success[any]("Webhook configuration deleted successfully", nil))
}

// ReceiveWebhookHandler godoc
// @Summary Receive payment provider webhook
// @Description Public proxy endpoint that receives webhooks from providers (e.g. Paystack) and forwards them to target URL
// @Tags Webhooks Public
// @Accept json
// @Produce json
// @Param slug path string true "Webhook unique slug"
// @Param X-Paystack-Signature header string false "Paystack signature for verification"
// @Param request body any true "Provider Webhook payload"
// @Success 200 {object} any
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 404 {object} api.SwaggerSimpleResponse
// @Router /webhooks/receive/{slug} [post]
func (h *WebhookHandler) ReceiveWebhookHandler(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusNotFound, api.Error("Webhook slug is required"))
		return
	}

	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, api.Error("Invalid request body"))
		return
	}

	// Retrieve webhook config by slug to resolve the provider name
	wc, err := h.service.repo.FindBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusNotFound, api.Error("Webhook configuration not found"))
		return
	}

	// Extract the signature based on provider
	var signature string
	switch wc.ProviderName {
	case "paystack":
		signature = c.GetHeader("X-Paystack-Signature")
	case "flutterwave":
		signature = c.GetHeader("verif-hash")
	default:
		signature = c.GetHeader("X-Webhook-Signature")
	}

	if signature == "" {
		c.JSON(http.StatusBadRequest, api.Error("Webhook signature header is missing"))
		return
	}

	// Process the webhook: verifies signature and forwards asynchronously
	err = h.service.ProcessWebhook(c.Request.Context(), slug, signature, bodyBytes)
	if err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// ListWebhookLogsHandler godoc
// @Summary List webhook logs
// @Description Retrieve webhooks logs for the authenticated project scoped by active mode
// @Tags Webhooks
// @Security BearerAuth
// @Produce json
// @Param limit query int false "Pagination limit"
// @Param offset query int false "Pagination offset"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /webhooks/logs [get]
func (h *WebhookHandler) ListWebhookLogsHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Project context missing"))
		return
	}

	var query struct {
		Limit  int `form:"limit,default=50"`
		Offset int `form:"offset,default=0"`
	}
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	isLive := middleware.GetIsLiveFromContext(c.Request.Context())

	logs, err := h.service.ListLogs(c.Request.Context(), projectID.(string), isLive, query.Limit, query.Offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Webhook logs retrieved successfully", logs))
}

func RegisterRoutes(rg *gin.RouterGroup, publicRg *gin.RouterGroup, h *WebhookHandler) {
	// Private CRUD endpoints (authenticated)
	webhooks := rg.Group("/webhooks/configs")
	{
		webhooks.POST("", h.CreateWebhookHandler)
		webhooks.GET("", h.ListWebhooksHandler)
		webhooks.PUT("/:id", h.UpdateWebhookHandler)
		webhooks.DELETE("/:id", h.DeleteWebhookHandler)
	}
	rg.GET("/webhooks/logs", h.ListWebhookLogsHandler)

	// Public Webhook proxy receiver endpoint (non-authenticated)
	publicRg.POST("/webhooks/receive/:slug", h.ReceiveWebhookHandler)
}