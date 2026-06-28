package notifications

import (
	"context"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
)

type INotificationRepo interface {
	Create(ctx context.Context, n *models.Notification) error
	List(ctx context.Context, projectID string) ([]*models.Notification, error)
	MarkAsRead(ctx context.Context, projectID string, id string) error
	MarkAllAsRead(ctx context.Context, projectID string) error
	Delete(ctx context.Context, projectID string, id string) error
}

type NotificationRepo struct {
	db *gorm.DB
}

func NewNotificationRepo(db *gorm.DB) *NotificationRepo {
	return &NotificationRepo{db: db}
}

func (r *NotificationRepo) Create(ctx context.Context, n *models.Notification) error {
	return r.db.WithContext(ctx).Create(n).Error
}

func (r *NotificationRepo) List(ctx context.Context, projectID string) ([]*models.Notification, error) {
	var list []*models.Notification
	err := r.db.WithContext(ctx).
		Where("project_id = ?", projectID).
		Order("created_at DESC").
		Find(&list).Error
	return list, err
}

func (r *NotificationRepo) MarkAsRead(ctx context.Context, projectID string, id string) error {
	return r.db.WithContext(ctx).
		Model(&models.Notification{}).
		Where("id = ? AND project_id = ?", id, projectID).
		Update("is_read", true).Error
}

func (r *NotificationRepo) MarkAllAsRead(ctx context.Context, projectID string) error {
	return r.db.WithContext(ctx).
		Model(&models.Notification{}).
		Where("project_id = ? AND is_read = ?", projectID, false).
		Update("is_read", true).Error
}

func (r *NotificationRepo) Delete(ctx context.Context, projectID string, id string) error {
	return r.db.WithContext(ctx).
		Where("id = ? AND project_id = ?", id, projectID).
		Delete(&models.Notification{}).Error
}
