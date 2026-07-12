package transfers

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(rg *gin.RouterGroup, h *TransferHandler) {
	transfers := rg.Group("/transfers")
	{
		transfers.POST("", h.InitiateTransferHandler)
	}
}
