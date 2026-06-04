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
	userID, exists := c.Get(middleware.UserIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	var req dto.ProviderConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	resp, err := h.service.AddProvider(c.Request.Context(), &req, userID.(string))
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
	userID, exists := c.Get(middleware.UserIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	resp, err := h.service.ListProviders(c.Request.Context(), userID.(string))
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
	userID, exists := c.Get(middleware.UserIDContextKey)
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

	resp, err := h.service.UpdateProvider(c.Request.Context(), &req, userID.(string), providerID)
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
	userID, exists := c.Get(middleware.UserIDContextKey)
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
	_, err := h.service.repo.FindProviderById(c.Request.Context(), providerID, userID.(string))
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
	userID, exists := c.Get(middleware.UserIDContextKey)
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
	_, err := h.service.repo.FindProviderById(c.Request.Context(), providerID, userID.(string))
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
}