package customers

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(rg *gin.RouterGroup, h *CustomerHandler) {
	customers := rg.Group("/customers")
	{
		customers.GET("", h.ListCustomersHandler)
		customers.GET("/:code", h.GetCustomerHandler)
	}
}
