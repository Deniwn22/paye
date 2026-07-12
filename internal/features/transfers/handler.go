package transfers

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/api"
	"github.com/ttomsin/paye/internal/middleware"
)

type TransferHandler struct {
	service *TransferService
}

func NewTransferHandler(service *TransferService) *TransferHandler {
	return &TransferHandler{service: service}
}

// InitiateTransferHandler godoc
// @Summary Initiate a transfer
// @Description Initiate a transfer to a bank account. If Smart Payouts is enabled, Paye will automatically route this through the active provider with the highest balance.
// @Tags Transfers
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body TransferRequest true "Transfer details"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /transfers [post]
func (h *TransferHandler) InitiateTransferHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	envStr := "test"
	if isLive, ok := c.Get(middleware.IsLiveContextKey); ok && isLive.(bool) {
		envStr = "live"
	}

	var req TransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	resp, err := h.service.InitiateTransfer(c.Request.Context(), projectID.(string), envStr, &req)
	if err != nil {
		slog.Error("failed to initiate transfer", "error", err)
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Transfer initiated successfully", resp))
}
