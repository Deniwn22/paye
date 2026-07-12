package subscriptions

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/api"
	"github.com/ttomsin/paye/internal/middleware"
)

type SubscriptionHandler struct {
	service *SubscriptionService
}

func NewSubscriptionHandler(service *SubscriptionService) *SubscriptionHandler {
	return &SubscriptionHandler{service: service}
}

// CreatePlanHandler godoc
// @Summary Create a billing plan
// @Description Create a new provider-agnostic billing plan
// @Tags Subscriptions
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body CreatePlanRequest true "Plan details"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /plans [post]
func (h *SubscriptionHandler) CreatePlanHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	isLive, exists := c.Get(middleware.IsLiveContextKey)
	if !exists {
		isLive = false
	}

	var req CreatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	resp, err := h.service.CreatePlan(c.Request.Context(), projectID.(string), &req, isLive.(bool))
	if err != nil {
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error("An internal error occurred. Please try again later."))
		return
	}

	c.JSON(http.StatusOK, api.Success("Plan created successfully", resp))
}

// ListPlansHandler godoc
// @Summary List billing plans
// @Description Retrieve a paginated list of billing plans
// @Tags Subscriptions
// @Security BearerAuth
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /plans [get]
func (h *SubscriptionHandler) ListPlansHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	isLive, exists := c.Get(middleware.IsLiveContextKey)
	if !exists {
		isLive = false
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	resp, err := h.service.ListPlans(c.Request.Context(), projectID.(string), isLive.(bool), page, limit)
	if err != nil {
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error("An internal error occurred. Please try again later."))
		return
	}

	c.JSON(http.StatusOK, api.Success("Plans retrieved successfully", resp))
}

// GetPlanHandler godoc
// @Summary Get a billing plan
// @Description Retrieve details of a specific billing plan
// @Tags Subscriptions
// @Security BearerAuth
// @Produce json
// @Param planCode path string true "Plan Code"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 404 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /plans/{planCode} [get]
func (h *SubscriptionHandler) GetPlanHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	planCode := c.Param("planCode")

	resp, err := h.service.GetPlan(c.Request.Context(), projectID.(string), planCode)
	if err != nil {
		c.JSON(http.StatusNotFound, api.Error("Plan not found"))
		return
	}

	c.JSON(http.StatusOK, api.Success("Plan retrieved successfully", resp))
}

// ListSubscriptionsHandler godoc
// @Summary List active subscriptions
// @Description Retrieve a paginated list of active subscriptions for the project
// @Tags Subscriptions
// @Security BearerAuth
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /subscriptions [get]
func (h *SubscriptionHandler) ListSubscriptionsHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	isLive, exists := c.Get(middleware.IsLiveContextKey)
	if !exists {
		isLive = false
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	resp, err := h.service.ListSubscriptions(c.Request.Context(), projectID.(string), isLive.(bool), page, limit)
	if err != nil {
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error("An internal error occurred. Please try again later."))
		return
	}

	c.JSON(http.StatusOK, api.Success("Subscriptions retrieved successfully", resp))
}

// CancelSubscriptionHandler godoc
// @Summary Cancel a subscription
// @Description Immediately cancels an active subscription
// @Tags Subscriptions
// @Security BearerAuth
// @Produce json
// @Param subCode path string true "Subscription Code"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /subscriptions/{subCode}/cancel [post]
func (h *SubscriptionHandler) CancelSubscriptionHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	subCode := c.Param("subCode")

	err := h.service.CancelSubscription(c.Request.Context(), projectID.(string), subCode)
	if err != nil {
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error("Failed to cancel subscription"))
		return
	}

	c.JSON(http.StatusOK, api.Success[any]("Subscription cancelled successfully", nil))
}
