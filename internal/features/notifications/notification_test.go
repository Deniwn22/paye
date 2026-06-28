package notifications_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/features/notifications"
	"github.com/ttomsin/paye/internal/middleware"
)

func TestNotificationBroker(t *testing.T) {
	broker := notifications.NewNotificationBroker()
	projectID := uuid.New().String()

	// 1. Subscribe to the broker
	ch := broker.Subscribe(projectID)
	defer broker.Unsubscribe(projectID, ch)

	// 2. Broadcast a notification
	payload := map[string]any{
		"reference": "test_ref_123",
		"status":    "success",
	}

	go func() {
		time.Sleep(50 * time.Millisecond)
		broker.Notify(projectID, "transaction_updated", payload)
	}()

	// 3. Receive the notification
	select {
	case msg := <-ch:
		var event map[string]any
		err := json.Unmarshal([]byte(msg), &event)
		if err != nil {
			t.Fatalf("Failed to parse event JSON: %v", err)
		}
		if event["type"] != "transaction_updated" {
			t.Errorf("Expected event type 'transaction_updated', got '%v'", event["type"])
		}
		evtPayload := event["payload"].(map[string]any)
		if evtPayload["reference"] != "test_ref_123" {
			t.Errorf("Expected reference 'test_ref_123', got '%v'", evtPayload["reference"])
		}
		if evtPayload["status"] != "success" {
			t.Errorf("Expected status 'success', got '%v'", evtPayload["status"])
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("Timeout waiting for notification message")
	}
}

type closeNotifyingRecorder struct {
	*httptest.ResponseRecorder
	closed chan bool
}

func (c *closeNotifyingRecorder) CloseNotify() <-chan bool {
	return c.closed
}

func newCloseNotifyingRecorder() *closeNotifyingRecorder {
	return &closeNotifyingRecorder{
		ResponseRecorder: httptest.NewRecorder(),
		closed:           make(chan bool, 1),
	}
}

func TestStreamNotificationsEndpoint(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	broker := notifications.NewNotificationBroker()
	service := notifications.NewNotificationService(nil, broker)
	handler := notifications.NewNotificationHandler(service)

	projectID := uuid.New().String()

	// Mock middleware to set project_id in context
	r.Use(func(c *gin.Context) {
		c.Set(middleware.ProjectIDContextKey, projectID)
		c.Next()
	})

	notifications.RegisterRoutes(r.Group(""), handler)

	// Create request and recorder
	req := httptest.NewRequest("GET", "/notifications/stream", nil)
	w := newCloseNotifyingRecorder()

	ctx, cancel := context.WithCancel(context.Background())
	req = req.WithContext(ctx)

	go func() {
		// Wait for subscription to register
		time.Sleep(100 * time.Millisecond)
		broker.Notify(projectID, "transaction_updated", "hello")
		// Cancel the request context to terminate the handler loop
		time.Sleep(100 * time.Millisecond)
		cancel()
		w.closed <- true
	}()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status code 200, got %d", w.Code)
	}

	body := w.Body.String()
	if !containsString(body, "event:message") || !containsString(body, "data:") {
		t.Errorf("Expected event-stream format in response, got: %s", body)
	}
}

func containsString(s, substr string) bool {
	lenSub := len(substr)
	if lenSub == 0 {
		return true
	}
	for i := 0; i <= len(s)-lenSub; i++ {
		if s[i:i+lenSub] == substr {
			return true
		}
	}
	return false
}

