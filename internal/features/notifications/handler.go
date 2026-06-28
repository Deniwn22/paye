package notifications

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/api"
	"github.com/ttomsin/paye/internal/middleware"
)

type NotificationHandler struct {
	service *NotificationService
}

func NewNotificationHandler(service *NotificationService) *NotificationHandler {
	return &NotificationHandler{service: service}
}

// @Summary Stream notifications (SSE)
// @Description Connect to the Server-Sent Events stream for real-time notifications
// @Tags Notifications
// @Produce text/event-stream
// @Security ApiKeyAuth
// @Success 200 {string} string "SSE Stream"
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Router /notifications/stream [get]
func (h *NotificationHandler) StreamNotifications(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Project context missing"))
		return
	}

	ch := h.service.broker.Subscribe(projectID.(string))
	defer h.service.broker.Unsubscribe(projectID.(string), ch)

	// Set SSE headers
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Transfer-Encoding", "chunked")

	// Disable Gzip buffering if any proxy middleware is active
	c.Writer.Header().Set("X-Accel-Buffering", "no")

	c.Stream(func(w io.Writer) bool {
		select {
		case msg, ok := <-ch:
			if !ok {
				return false
			}
			c.SSEvent("message", msg)
			return true
		case <-c.Request.Context().Done():
			return false
		}
	})
}

// @Summary List notifications
// @Description List all notifications for the authenticated project
// @Tags Notifications
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /notifications [get]
func (h *NotificationHandler) ListNotificationsHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Project context missing"))
		return
	}

	list, err := h.service.ListNotifications(c.Request.Context(), projectID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Notifications retrieved successfully", list))
}

// @Summary Mark notification as read
// @Description Mark a specific notification as read by its ID
// @Tags Notifications
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Notification ID"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /notifications/{id}/read [post]
func (h *NotificationHandler) MarkAsReadHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Project context missing"))
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, api.Error("Notification ID is required"))
		return
	}

	err := h.service.MarkAsRead(c.Request.Context(), projectID.(string), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success[any]("Notification marked as read", nil))
}

// @Summary Mark all notifications as read
// @Description Mark all unread notifications as read for the authenticated project
// @Tags Notifications
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /notifications/read-all [post]
func (h *NotificationHandler) MarkAllAsReadHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Project context missing"))
		return
	}

	err := h.service.MarkAllAsRead(c.Request.Context(), projectID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success[any]("All notifications marked as read", nil))
}

// @Summary Delete a notification
// @Description Delete a specific notification by its ID
// @Tags Notifications
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Notification ID"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /notifications/{id} [delete]
func (h *NotificationHandler) DeleteNotificationHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Project context missing"))
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, api.Error("Notification ID is required"))
		return
	}

	err := h.service.DeleteNotification(c.Request.Context(), projectID.(string), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success[any]("Notification deleted successfully", nil))
}

func RegisterRoutes(rg *gin.RouterGroup, h *NotificationHandler) {
	notifications := rg.Group("/notifications")
	{
		notifications.GET("/stream", h.StreamNotifications)
		notifications.GET("", h.ListNotificationsHandler)
		notifications.POST("/:id/read", h.MarkAsReadHandler)
		notifications.POST("/read-all", h.MarkAllAsReadHandler)
		notifications.DELETE("/:id", h.DeleteNotificationHandler)
	}
}
