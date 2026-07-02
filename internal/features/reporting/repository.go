package reporting

import (
	"context"

	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
)

type ReportingRepo struct {
	db *gorm.DB
}

func NewReportingRepo(db *gorm.DB) *ReportingRepo {
	return &ReportingRepo{db: db}
}

// CreateStatementRecord saves a new statement record in the database
func (r *ReportingRepo) CreateStatementRecord(ctx context.Context, record *models.StatementRecord) error {
	return r.db.WithContext(ctx).Create(record).Error
}

// FindStatementRecordByID fetches a statement record by its UUID
func (r *ReportingRepo) FindStatementRecordByID(ctx context.Context, id string) (*models.StatementRecord, error) {
	var record models.StatementRecord
	err := r.db.WithContext(ctx).Preload("Project").Where("id = ?", id).First(&record).Error
	if err != nil {
		return nil, err
	}
	return &record, nil
}
