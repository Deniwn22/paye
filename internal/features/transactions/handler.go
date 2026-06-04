package transactions

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/api"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/middleware"
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
	userID, exists := c.Get(middleware.UserIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	var req dto.InitializeTransactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	resp, err := h.service.InitializeTransaction(c.Request.Context(), userID.(string), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
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
func (h *TransactionHandler) VerifyTransactionHandler(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	reference := c.Param("reference")
	if reference == "" {
		c.JSON(http.StatusBadRequest, api.Error("Reference parameter is required"))
		return
	}

	resp, err := h.service.VerifyTransaction(c.Request.Context(), userID.(string), reference)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Transaction verified successfully", resp))
}

// RegisterRoutes registers endpoints in the provided router group
func RegisterRoutes(router *gin.RouterGroup, handler *TransactionHandler) {
	router.POST("/transactions/initialize", handler.InitializeTransactionHandler)
	router.GET("/transactions/verify/:reference", handler.VerifyTransactionHandler)
}
