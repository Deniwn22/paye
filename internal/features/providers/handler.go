package providers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/api"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/middleware"
)

type ProviderHandler struct {
	service *ProviderService
}

func NewProviderHandler(service *ProviderService) *ProviderHandler {
	return &ProviderHandler{service: service}
}

// AddProviderHandler godoc
// @Summary Register provider configuration
// @Description Create a provider configuration for the authenticated user
// @Tags Providers
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body dto.ProviderConfigRequest true "Provider Configuration Payload"
// @Success 200 {object} api.SwaggerProviderConfigResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /providers [post]
func (h *ProviderHandler) AddProviderHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	var req dto.ProviderConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	resp, err := h.service.AddProvider(c.Request.Context(), &req, projectID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Provider configuration registered successfully", resp))
}

// ListProvidersHandler godoc
// @Summary List provider configurations
// @Description Retrieve list of all provider configs for the authenticated user
// @Tags Providers
// @Security BearerAuth
// @Produce json
// @Success 200 {object} api.SwaggerProviderConfigListResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /providers [get]
func (h *ProviderHandler) ListProvidersHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	resp, err := h.service.ListProviders(c.Request.Context(), projectID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Providers retrieved successfully", resp))
}

// UpdateProviderHandler godoc
// @Summary Update provider configuration
// @Description Update fields of a specific provider config
// @Tags Providers
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Provider Config ID"
// @Param request body dto.ProviderConfigRequest true "Provider Config Update Payload"
// @Success 200 {object} api.SwaggerProviderConfigResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 404 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /providers/{id} [put]
func (h *ProviderHandler) UpdateProviderHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	providerID := c.Param("id")
	if providerID == "" {
		c.JSON(http.StatusBadRequest, api.Error("Provider ID is required"))
		return
	}

	var req dto.ProviderConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	resp, err := h.service.UpdateProvider(c.Request.Context(), &req, projectID.(string), providerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Provider configuration updated successfully", resp))
}

// DeleteProviderHandler godoc
// @Summary Delete provider configuration
// @Description Remove a specific provider config
// @Tags Providers
// @Security BearerAuth
// @Produce json
// @Param id path string true "Provider Config ID"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 404 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /providers/{id} [delete]
func (h *ProviderHandler) DeleteProviderHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	providerID := c.Param("id")
	if providerID == "" {
		c.JSON(http.StatusBadRequest, api.Error("Provider ID is required"))
		return
	}

	// Verify ownership before deleting
	_, err := h.service.repo.FindProviderById(c.Request.Context(), providerID, projectID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, api.Error("Provider configuration not found"))
		return
	}

	err = h.service.DeleteProvider(c.Request.Context(), providerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success[any]("Provider configuration deleted successfully", nil))
}

// ToggleProviderHandler godoc
// @Summary Toggle provider active status
// @Description Enable or disable a specific provider configuration
// @Tags Providers
// @Security BearerAuth
// @Produce json
// @Param id path string true "Provider Config ID"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 404 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /providers/{id}/toggle [patch]
func (h *ProviderHandler) ToggleProviderHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	providerID := c.Param("id")
	if providerID == "" {
		c.JSON(http.StatusBadRequest, api.Error("Provider ID is required"))
		return
	}

	// Verify ownership
	_, err := h.service.repo.FindProviderById(c.Request.Context(), providerID, projectID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, api.Error("Provider configuration not found"))
		return
	}

	err = h.service.ToggleProviderStatus(c.Request.Context(), providerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success[any]("Provider configuration status toggled successfully", nil))
}

func RegisterRoutes(rg *gin.RouterGroup, h *ProviderHandler) {
	providers := rg.Group("/providers")
	{
		providers.POST("", h.AddProviderHandler)
		providers.GET("", h.ListProvidersHandler)
		providers.PUT("/:id", h.UpdateProviderHandler)
		providers.DELETE("/:id", h.DeleteProviderHandler)
		providers.PATCH("/:id/toggle", h.ToggleProviderHandler)
	}

	// Root-level Paystack feature routes
	rg.POST("/refund", h.RefundHandler)
	rg.GET("/refunds", h.ListRefundsHandler)

	rg.POST("/plans", h.CreatePlanHandler)
	rg.GET("/plans", h.ListPlansHandler)

	rg.POST("/subscriptions", h.CreateSubscriptionHandler)
	rg.GET("/subscriptions", h.ListSubscriptionsHandler)
	rg.POST("/subscriptions/:code/cancel", h.CancelSubscriptionHandler)
	rg.DELETE("/subscriptions/:code", h.CancelSubscriptionHandler)

	rg.POST("/recipients", h.CreateRecipientHandler)
	rg.GET("/recipients", h.ListRecipientsHandler)

	rg.POST("/transfers", h.CreateTransferHandler)
	rg.GET("/transfers", h.ListTransfersHandler)
}

func (h *ProviderHandler) RefundHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	var req RefundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	resp, err := h.service.RefundTransaction(c.Request.Context(), projectID.(string), "paystack", req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Refund processed successfully", resp))
}

func (h *ProviderHandler) ListRefundsHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	resp, err := h.service.ListRefunds(c.Request.Context(), projectID.(string), "paystack")
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Refunds retrieved successfully", resp))
}

func (h *ProviderHandler) CreatePlanHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	var req PlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	resp, err := h.service.CreatePlan(c.Request.Context(), projectID.(string), "paystack", req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Plan created successfully", resp))
}

func (h *ProviderHandler) ListPlansHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	resp, err := h.service.ListPlans(c.Request.Context(), projectID.(string), "paystack")
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Plans retrieved successfully", resp))
}

func (h *ProviderHandler) CreateSubscriptionHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	var req SubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	resp, err := h.service.CreateSubscription(c.Request.Context(), projectID.(string), "paystack", req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Subscription created successfully", resp))
}

func (h *ProviderHandler) ListSubscriptionsHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	resp, err := h.service.ListSubscriptions(c.Request.Context(), projectID.(string), "paystack")
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Subscriptions retrieved successfully", resp))
}

func (h *ProviderHandler) CancelSubscriptionHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	code := c.Param("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, api.Error("Subscription code is required"))
		return
	}

	token := c.DefaultQuery("token", "")
	if token == "" {
		type cancelPayload struct {
			Token string `json:"token"`
		}
		var p cancelPayload
		if err := c.ShouldBindJSON(&p); err == nil {
			token = p.Token
		}
	}

	err := h.service.CancelSubscription(c.Request.Context(), projectID.(string), "paystack", code, token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success[any]("Subscription cancelled successfully", nil))
}

func (h *ProviderHandler) CreateRecipientHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	var req TransferRecipientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	resp, err := h.service.CreateTransferRecipient(c.Request.Context(), projectID.(string), "paystack", req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Transfer recipient created successfully", resp))
}

func (h *ProviderHandler) ListRecipientsHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	resp, err := h.service.ListTransferRecipients(c.Request.Context(), projectID.(string), "paystack")
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Transfer recipients retrieved successfully", resp))
}

func (h *ProviderHandler) CreateTransferHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	var req TransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	resp, err := h.service.InitiateTransfer(c.Request.Context(), projectID.(string), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Transfer initiated successfully", resp))
}

func (h *ProviderHandler) ListTransfersHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	resp, err := h.service.ListTransfers(c.Request.Context(), projectID.(string), "paystack")
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Transfers retrieved successfully", resp))
}

// ListPaymentProvidersHandler godoc
// @Summary List supported payment providers
// @Description Retrieve a list of all payment providers from the system database
// @Tags Providers
// @Produce json
// @Success 200 {object} api.SwaggerPaymentProviderListResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /payment-providers [get]
func (h *ProviderHandler) ListPaymentProvidersHandler(c *gin.Context) {
	resp, err := h.service.ListPaymentProviders(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Payment providers retrieved successfully", dto.ToPaymentProviderResponseList(resp)))
}