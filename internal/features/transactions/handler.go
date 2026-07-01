package transactions

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/api"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/middleware"

	"log/slog"
)

type TransactionHandler struct {
	service *TransactionService
}

func NewTransactionHandler(service *TransactionService) *TransactionHandler {
	return &TransactionHandler{service: service}
}

// InitializeTransactionHandler handles initializing a transaction
// @Summary Initialize payment transaction
// @Description Initialize a payment transaction with a selected provider (e.g., Paystack).
// @Tags transactions
// @Accept json
// @Produce json
// @Param X-Paye-API-Key header string true "API Key"
// @Param request body dto.InitializeTransactionRequest true "Initialize Request"
// @Success 200 {object} api.SwaggerTransactionInitializeResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /transactions/initialize [post]
func (h *TransactionHandler) InitializeTransactionHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Project context missing"))
		return
	}

	var req dto.InitializeTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	resp, err := h.service.InitializeTransaction(c.Request.Context(), projectID.(string), &req)
	if err != nil {
		if strings.Contains(err.Error(), "active provider config not found") {
			envStr := "test"
			if isLive, exists := c.Get(middleware.IsLiveContextKey); exists && isLive.(bool) {
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

// VerifyTransactionHandler handles verifying a transaction status
// @Summary Verify transaction status
// @Description Query and verify a transaction status from the payment provider.
// @Tags transactions
// @Produce json
// @Param X-Paye-API-Key header string true "API Key"
// @Param reference path string true "Transaction Reference"
// @Success 200 {object} api.SwaggerTransactionVerifyResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 404 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /transactions/verify/{reference} [get]
// @Router /transactions/verify/{reference} [get]
func (h *TransactionHandler) VerifyTransactionHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Project context missing"))
		return
	}

	reference := c.Param("reference")
	if reference == "" {
		c.JSON(http.StatusBadRequest, api.Error("Reference parameter is required"))
		return
	}

	resp, err := h.service.VerifyTransaction(c.Request.Context(), projectID.(string), reference)
	if err != nil {
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error("An internal error occurred. Please try again later."))
		return
	}

	c.JSON(http.StatusOK, api.Success("Transaction verified successfully", resp))
}

// ListTransactionsHandler handles listing transactions for the merchant
// @Summary List payment transactions
// @Description Retrieve a list of payment transactions for the authenticated merchant.
// @Tags transactions
// @Produce json
// @Param Authorization header string true "Bearer token"
// @Success 200 {object} api.SwaggerTransactionListResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /transactions [get]
func (h *TransactionHandler) ListTransactionsHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Project context missing"))
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")
	var limit, offset int
	fmt.Sscanf(limitStr, "%d", &limit)
	fmt.Sscanf(offsetStr, "%d", &offset)

	resp, err := h.service.ListTransactions(c.Request.Context(), projectID.(string), limit, offset)
	if err != nil {
		slog.Error("internal server error", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error("An internal error occurred. Please try again later."))
		return
	}

	c.JSON(http.StatusOK, api.Success("Transactions retrieved successfully", resp))
}

// RegisterRoutes registers endpoints in the provided router group
func RegisterRoutes(router *gin.RouterGroup, handler *TransactionHandler) {
	router.POST("/transactions/initialize", handler.InitializeTransactionHandler)
	router.GET("/transactions/verify/:reference", handler.VerifyTransactionHandler)
}
