package projects

import (
	"context"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
)

type IProjectRepo interface {
	CreateProject(ctx context.Context, project *models.Project) error
	FindByID(ctx context.Context, id string) (*models.Project, error)
	FindByApiKey(ctx context.Context, apiKey string) (*models.Project, error)
	FindByPublicID(ctx context.Context, publicID string) (*models.Project, error)
	ListProjects(ctx context.Context, userID string) ([]*models.Project, error)
	DeleteProject(ctx context.Context, id string, userID string) error
}

type ProjectRepo struct {
	db *gorm.DB
}

func NewProjectRepo(db *gorm.DB) *ProjectRepo {
	return &ProjectRepo{db: db}
}

func (r *ProjectRepo) CreateProject(ctx context.Context, project *models.Project) error {
	return r.db.WithContext(ctx).Create(project).Error
}

func (r *ProjectRepo) FindByID(ctx context.Context, id string) (*models.Project, error) {
	var project models.Project
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&project).Error
	if err != nil {
		return nil, err
	}
	return &project, nil
}

func (r *ProjectRepo) FindByApiKey(ctx context.Context, apiKey string) (*models.Project, error) {
	var project models.Project
	err := r.db.WithContext(ctx).Where("api_key = ? OR test_api_key = ?", apiKey, apiKey).First(&project).Error
	if err != nil {
		return nil, err
	}
	return &project, nil
}

func (r *ProjectRepo) FindByPublicID(ctx context.Context, publicID string) (*models.Project, error) {
	var project models.Project
	err := r.db.WithContext(ctx).Where("public_id = ? OR test_public_id = ?", publicID, publicID).First(&project).Error
	if err != nil {
		return nil, err
	}
	return &project, nil
}

func (r *ProjectRepo) ListProjects(ctx context.Context, userID string) ([]*models.Project, error) {
	var projects []*models.Project
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&projects).Error
	if err != nil {
		return nil, err
	}
	return projects, nil
}

func (r *ProjectRepo) DeleteProject(ctx context.Context, id string, userID string) error {
	return r.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).Delete(&models.Project{}).Error
}
