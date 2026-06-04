package dashboard

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/api"
	"github.com/ttomsin/paye/internal/middleware"
)

type DashboardHandler struct {
	service *DashboardService
}

func NewDashboardHandler(service *DashboardService) *DashboardHandler {
	return &DashboardHandler{service: service}
}

// GetStatsHandler godoc
// @Summary Get dashboard statistics
// @Description Retrieve aggregated payment stats, including volumes, counts, and active providers
// @Tags Dashboard
// @Security BearerAuth
// @Produce json
// @Success 200 {object} api.SwaggerDashboardStatsResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /dashboard/stats [get]
func (h *DashboardHandler) GetStatsHandler(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	resp, err := h.service.GetStats(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Dashboard statistics retrieved successfully", resp))
}

// GetLogsHandler godoc
// @Summary List dashboard proxy webhook logs
// @Description Retrieve recent webhook proxy delivery log history (paginated)
// @Tags Dashboard
// @Security BearerAuth
// @Produce json
// @Param limit query int false "Pagination limit (default: 10)"
// @Param offset query int false "Pagination offset (default: 0)"
// @Success 200 {object} api.SwaggerWebhookLogListResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /dashboard/logs [get]
func (h *DashboardHandler) GetLogsHandler(c *gin.Context) {
	userID, exists := c.Get(middleware.UserIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	resp, err := h.service.GetLogs(c.Request.Context(), userID.(string), limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Webhook logs retrieved successfully", resp))
}

func RegisterRoutes(rg *gin.RouterGroup, h *DashboardHandler) {
	dashboard := rg.Group("/dashboard")
	{
		dashboard.GET("/stats", h.GetStatsHandler)
		dashboard.GET("/logs", h.GetLogsHandler)
	}
}
