package projects

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/models"
)

type ProjectService struct {
	repo IProjectRepo
}

type CreateProjectRequest struct {
	Name string `json:"name" binding:"required"`
}

type ProjectResponse struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	ApiKey       string `json:"api_key"`
	PublicID     string `json:"public_id"`
	TestApiKey   string `json:"test_api_key"`
	TestPublicID string `json:"test_public_id"`
}

func NewProjectService(repo IProjectRepo) *ProjectService {
	return &ProjectService{repo: repo}
}

func (s *ProjectService) CreateProject(ctx context.Context, userID string, name string) (*models.Project, error) {
	if name == "" {
		return nil, errors.New("project name is required")
	}

	uID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	liveApiKey, err := crypto.GenerateAPIKey(true)
	if err != nil {
		return nil, fmt.Errorf("failed to generate live api key: %w", err)
	}
	testApiKey, err := crypto.GenerateAPIKey(false)
	if err != nil {
		return nil, fmt.Errorf("failed to generate test api key: %w", err)
	}

	livePublicID, err := crypto.GeneratePublicID(true)
	if err != nil {
		return nil, fmt.Errorf("failed to generate live public id: %w", err)
	}
	testPublicID, err := crypto.GeneratePublicID(false)
	if err != nil {
		return nil, fmt.Errorf("failed to generate test public id: %w", err)
	}

	project := &models.Project{
		Name:         name,
		ApiKey:       liveApiKey,
		PublicID:     livePublicID,
		TestApiKey:   testApiKey,
		TestPublicID: testPublicID,
		UserID:       uID,
	}

	if err := s.repo.CreateProject(ctx, project); err != nil {
		return nil, err
	}

	return project, nil
}

func (s *ProjectService) ListProjects(ctx context.Context, userID string) ([]*models.Project, error) {
	return s.repo.ListProjects(ctx, userID)
}

func (s *ProjectService) GetProjectByID(ctx context.Context, id string) (*models.Project, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *ProjectService) DeleteProject(ctx context.Context, id string, userID string) error {
	return s.repo.DeleteProject(ctx, id, userID)
}
