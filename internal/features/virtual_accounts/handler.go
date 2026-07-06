package virtual_accounts

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/api"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/middleware"

	"log/slog"
)

type VAHandler struct {
	service *VAService
}

func NewVAHandler(service *VAService) *VAHandler {
	return &VAHandler{service: service}
}

// @Summary Create a virtual account
// @Description Create a new virtual account for a customer
// @Tags Virtual Accounts
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body dto.CreateVirtualAccountDTO true "Virtual Account details"
// @Success 200 {object} api.SwaggerVirtualAccountResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /virtual-accounts [post]
func (h *VAHandler) CreateVirtualAccountHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	var req dto.CreateVirtualAccountDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	va, err := h.service.CreateVirtualAccount(c.Request.Context(), projectID.(string), req)
	if err != nil {
		if strings.Contains(err.Error(), "no active VA provider found") {
			c.JSON(http.StatusBadRequest, api.Error("No active provider found for your project that supports virtual accounts. Please configure one first."))
			return
		}
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error("An internal error occurred. Please try again later."))
		return
	}

	c.JSON(http.StatusOK, api.Success("Virtual account created successfully", va))
}

// @Summary Get a virtual account
// @Description Retrieve details of a specific virtual account by its PVC ID
// @Tags Virtual Accounts
// @Produce json
// @Security ApiKeyAuth
// @Param pvc_id path string true "PVC ID"
// @Success 200 {object} api.SwaggerVirtualAccountResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 404 {object} api.SwaggerSimpleResponse
// @Router /virtual-accounts/{pvc_id} [get]
func (h *VAHandler) GetVirtualAccountHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	pvcID := c.Param("pvc_id")
	if pvcID == "" {
		c.JSON(http.StatusBadRequest, api.Error("pvc_id is required"))
		return
	}

	va, err := h.service.GetVirtualAccount(c.Request.Context(), projectID.(string), pvcID)
	if err != nil {
		c.JSON(http.StatusNotFound, api.Error("Virtual account not found"))
		return
	}

	c.JSON(http.StatusOK, api.Success("Virtual account retrieved successfully", va))
}

// @Summary List virtual accounts
// @Description List all virtual accounts associated with the project
// @Tags Virtual Accounts
// @Produce json
// @Security ApiKeyAuth
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Number of items per page" default(20)
// @Param provider query string false "Filter by provider"
// @Success 200 {object} api.SwaggerVirtualAccountListResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /virtual-accounts [get]
func (h *VAHandler) ListVirtualAccountsHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	page := 1
	limit := 20
	provider := c.Query("provider")
	if va := c.Query("va"); va != "" {
		provider = va
	}

	if p, err := strconv.Atoi(c.Query("page")); err == nil && p > 0 {
		page = p
	}
	if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 {
		limit = l
	}
	offset := (page - 1) * limit

	vas, total, err := h.service.ListVirtualAccounts(c.Request.Context(), projectID.(string), provider, limit, offset)
	if err != nil {
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error("An internal error occurred. Please try again later."))
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  true,
		"message": "Virtual accounts retrieved successfully",
		"data":    vas,
		"meta": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

// @Summary Suspend a virtual account
// @Description Suspend an active virtual account
// @Tags Virtual Accounts
// @Produce json
// @Security ApiKeyAuth
// @Param pvc_id path string true "PVC ID"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /virtual-accounts/{pvc_id}/suspend [patch]
func (h *VAHandler) SuspendVirtualAccountHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	pvcID := c.Param("pvc_id")
	if pvcID == "" {
		c.JSON(http.StatusBadRequest, api.Error("pvc_id is required"))
		return
	}

	if err := h.service.SuspendVirtualAccount(c.Request.Context(), projectID.(string), pvcID); err != nil {
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error("An internal error occurred. Please try again later."))
		return
	}

	c.JSON(http.StatusOK, api.Success[any]("Virtual account suspended successfully", nil))
}

// @Summary List transactions for a virtual account
// @Description List all transactions made to a specific virtual account
// @Tags Virtual Accounts
// @Produce json
// @Security ApiKeyAuth
// @Param pvc_id path string true "PVC ID"
// @Success 200 {object} api.SwaggerVirtualAccountTransactionListResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /virtual-accounts/{pvc_id}/transactions [get]
func (h *VAHandler) ListTransactionsHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	pvcID := c.Param("pvc_id")
	if pvcID == "" {
		c.JSON(http.StatusBadRequest, api.Error("pvc_id is required"))
		return
	}

	txs, err := h.service.ListTransactions(c.Request.Context(), projectID.(string), pvcID)
	if err != nil {
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error("An internal error occurred. Please try again later."))
		return
	}

	c.JSON(http.StatusOK, api.Success("Transactions retrieved successfully", txs))
}

// UpdateVirtualAccountHandler godoc
// @Summary Update a virtual account
// @Description Update virtual account details (e.g. Account Name)
// @Tags Virtual Accounts
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param pvc_id path string true "Virtual Account ID (PVC ID)"
// @Param request body dto.UpdateVADTO true "Update payload"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /virtual-accounts/{pvc_id} [put]
func (h *VAHandler) UpdateVirtualAccountHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	pvcID := c.Param("pvc_id")
	if pvcID == "" {
		c.JSON(http.StatusBadRequest, api.Error("pvc_id is required"))
		return
	}

	var dto dto.UpdateVADTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	if err := h.service.UpdateVirtualAccount(c.Request.Context(), projectID.(string), pvcID, dto); err != nil {
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error("An internal error occurred. Please try again later."))
		return
	}

	c.JSON(http.StatusOK, api.Success[any]("Virtual account updated successfully", nil))
}

// MigrateVirtualAccountHandler godoc
// @Summary Manually migrate a virtual account
// @Description Migrates an active virtual account to the current active provider
// @Tags Virtual Accounts
// @Produce json
// @Security ApiKeyAuth
// @Param pvc_id path string true "Virtual Account ID (PVC ID)"
// @Success 200 {object} api.SwaggerVirtualAccountResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /virtual-accounts/{pvc_id}/migrate [post]
func (h *VAHandler) MigrateVirtualAccountHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	pvcID := c.Param("pvc_id")
	if pvcID == "" {
		c.JSON(http.StatusBadRequest, api.Error("pvc_id is required"))
		return
	}

	va, err := h.service.MigrateVirtualAccount(c.Request.Context(), projectID.(string), pvcID)
	if err != nil {
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Virtual account migrated successfully", va))
}

// ExpireVirtualAccountHandler godoc
// @Summary Expire a virtual account
// @Description Expire (delete/deactivate) a virtual account on the provider
// @Tags Virtual Accounts
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param pvc_id path string true "Virtual Account ID (PVC ID)"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /virtual-accounts/{pvc_id} [delete]
func (h *VAHandler) ExpireVirtualAccountHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	pvcID := c.Param("pvc_id")
	if pvcID == "" {
		c.JSON(http.StatusBadRequest, api.Error("pvc_id is required"))
		return
	}

	if err := h.service.ExpireVirtualAccount(c.Request.Context(), projectID.(string), pvcID); err != nil {
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error("An internal error occurred. Please try again later."))
		return
	}

	c.JSON(http.StatusOK, api.Success[any]("Virtual account expired successfully", nil))
}

// ListMisdirectedPaymentsHandler godoc
// @Summary List misdirected payments
// @Description Retrieve a list of misdirected payments (e.g. transfers to expired or non-existent virtual accounts)
// @Tags Virtual Accounts
// @Produce json
// @Security BearerAuth
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /virtual-accounts/misdirected [get]
func (h *VAHandler) ListMisdirectedPaymentsHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	mps, err := h.service.ListMisdirectedPayments(c.Request.Context(), projectID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Misdirected payments retrieved successfully", mps))
}

// ResolveMisdirectedPaymentHandler godoc
// @Summary Resolve a misdirected payment
// @Description Mark a misdirected payment as resolved
// @Tags Virtual Accounts
// @Produce json
// @Security BearerAuth
// @Param id path string true "Misdirected Payment ID"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /virtual-accounts/misdirected/{id}/resolve [patch]
func (h *VAHandler) ResolveMisdirectedPaymentHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, api.Error("id is required"))
		return
	}

	if err := h.service.ResolveMisdirectedPayment(c.Request.Context(), projectID.(string), id); err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success[any]("Misdirected payment resolved successfully", nil))
}

func RegisterRoutes(rg *gin.RouterGroup, h *VAHandler) {
	va := rg.Group("/virtual-accounts")
	{
		va.POST("", h.CreateVirtualAccountHandler)
		va.GET("", h.ListVirtualAccountsHandler)
		va.GET("/:pvc_id", h.GetVirtualAccountHandler)
		va.PUT("/:pvc_id", h.UpdateVirtualAccountHandler)
		va.PATCH("/:pvc_id/suspend", h.SuspendVirtualAccountHandler)
		va.DELETE("/:pvc_id", h.ExpireVirtualAccountHandler)
		va.POST("/:pvc_id/migrate", h.MigrateVirtualAccountHandler)
		va.GET("/:pvc_id/transactions", h.ListTransactionsHandler)
		va.GET("/misdirected", h.ListMisdirectedPaymentsHandler)
		va.PATCH("/misdirected/:id/resolve", h.ResolveMisdirectedPaymentHandler)
	}
}
