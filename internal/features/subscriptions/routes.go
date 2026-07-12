package subscriptions

import (
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(rg *gin.RouterGroup, h *SubscriptionHandler) {
	plans := rg.Group("/plans")
	{
		plans.POST("", h.CreatePlanHandler)
		plans.GET("", h.ListPlansHandler)
		plans.GET("/:planCode", h.GetPlanHandler)
	}

	subs := rg.Group("/subscriptions")
	{
		subs.GET("", h.ListSubscriptionsHandler)
		subs.POST("/:subCode/cancel", h.CancelSubscriptionHandler)
	}
}
