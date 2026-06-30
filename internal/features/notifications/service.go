package notifications

import (
	"context"
	"encoding/json"
	"sync"

	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/models"
)

type NotificationBroker struct {
	mu      sync.RWMutex
	clients map[string][]chan string
}

func NewNotificationBroker() *NotificationBroker {
	return &NotificationBroker{
		clients: make(map[string][]chan string),
	}
}

// Subscribe registers a new connection channel for a given projectID
func (b *NotificationBroker) Subscribe(projectID string) chan string {
	b.mu.Lock()
	defer b.mu.Unlock()
	ch := make(chan string, 10)
	b.clients[projectID] = append(b.clients[projectID], ch)
	return ch
}

// Unsubscribe removes a connection channel for a given projectID
func (b *NotificationBroker) Unsubscribe(projectID string, ch chan string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	channels := b.clients[projectID]
	for i, c := range channels {
		if c == ch {
			close(c)
			b.clients[projectID] = append(channels[:i], channels[i+1:]...)
			break
		}
	}
	if len(b.clients[projectID]) == 0 {
		delete(b.clients, projectID)
	}
}

// Notify broadcasts a structured event to all active subscribers of a projectID
func (b *NotificationBroker) Notify(projectID string, eventType string, payload any) {
	b.mu.RLock()
	defer b.mu.RUnlock()
	channels, ok := b.clients[projectID]
	if !ok {
		return
	}

	dataMap := map[string]any{
		"type":    eventType,
		"payload": payload,
	}
	dataBytes, err := json.Marshal(dataMap)
	if err != nil {
		return
	}

	msg := string(dataBytes)
	for _, ch := range channels {
		select {
		case ch <- msg:
		default: // Non-blocking write to avoid lagging clients
		}
	}
}

type NotificationService struct {
	repo   *NotificationRepo
	broker *NotificationBroker
}

func NewNotificationService(repo *NotificationRepo, broker *NotificationBroker) *NotificationService {
	return &NotificationService{
		repo:   repo,
		broker: broker,
	}
}

// GetBroker returns the underlying notification broker (useful for streaming connection registrations)
func (s *NotificationService) GetBroker() *NotificationBroker {
	return s.broker
}

func (s *NotificationService) CreateAndNotify(ctx context.Context, projectID string, title string, message string, nType string, ssePayload any) error {
	projectUUID, err := uuid.Parse(projectID)
	if err != nil {
		return err
	}

	// 1. Create and save notification in database
	n := &models.Notification{
		ProjectID: projectUUID,
		Title:     title,
		Message:   message,
		Type:      nType,
		IsRead:    false,
	}

	if err := s.repo.Create(ctx, n); err != nil {
		return err
	}

	// 2. Broadcast transaction updated event so active toast/refresh triggers
	s.broker.Notify(projectID, "transaction_updated", ssePayload)

	// 3. Broadcast notification created event with database record for lists
	s.broker.Notify(projectID, "notification_created", n)

	return nil
}

func (s *NotificationService) ListNotifications(ctx context.Context, projectID string) ([]*models.Notification, error) {
	return s.repo.List(ctx, projectID)
}

func (s *NotificationService) MarkAsRead(ctx context.Context, projectID string, id string) error {
	return s.repo.MarkAsRead(ctx, projectID, id)
}

func (s *NotificationService) MarkAllAsRead(ctx context.Context, projectID string) error {
	return s.repo.MarkAllAsRead(ctx, projectID)
}

func (s *NotificationService) DeleteNotification(ctx context.Context, projectID string, id string) error {
	return s.repo.Delete(ctx, projectID, id)
}
