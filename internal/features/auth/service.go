package auth

import (
	"context"
	"errors"

	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/features/projects"
	"github.com/ttomsin/paye/internal/features/user"
	"github.com/ttomsin/paye/internal/models"
)

type IAuthService interface {
	VerifyAPIKey(apiKey string) (*models.User, *models.Project, error)
}

type AuthService struct {
	userRepo    user.IUserRepo
	projectRepo projects.IProjectRepo
	jwtSecret   string
}

type SignupRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type AuthResponse struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	ApiKey string `json:"api_key"`
	Token  string `json:"token"`
}

func NewAuthService(userRepo user.IUserRepo, projectRepo projects.IProjectRepo, jwtSecret string) *AuthService {
	return &AuthService{userRepo: userRepo, projectRepo: projectRepo, jwtSecret: jwtSecret}
}

func (s *AuthService) RegisterUser(req *SignupRequest) (*AuthResponse, error) {
	// verify password meets requirements
	if len(req.Password) < 8 {
		return nil, errors.New("password must be at least 8 characters")
	}
	// check if user already exists
	_, err := s.userRepo.FindByEmail(req.Email)
	if err == nil {
		return nil, errors.New("email already exists")
	}
	// hash password
	hashedPassword, err := HashPassword(req.Password)
	if err != nil {
		return nil, err
	}
	liveApiKey, err := crypto.GenerateAPIKey(true)
	if err != nil {
		return nil, err
	}
	testApiKey, err := crypto.GenerateAPIKey(false)
	if err != nil {
		return nil, err
	}

	livePublicID, err := crypto.GeneratePublicID(true)
	if err != nil {
		return nil, err
	}
	testPublicID, err := crypto.GeneratePublicID(false)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: hashedPassword,
		PublicID: livePublicID,
	}
	if err := s.userRepo.CreateUser(user); err != nil {
		return nil, err
	}
	defaultProject := &models.Project{
		Name:         "Default Project",
		ApiKey:       liveApiKey,
		PublicID:     livePublicID,
		TestApiKey:   testApiKey,
		TestPublicID: testPublicID,
		UserID:       user.Base.ID,
	}
	if err := s.projectRepo.CreateProject(context.Background(), defaultProject); err != nil {
		return nil, err
	}
	token, err := GenerateJWT(user.Base.ID.String(), user.Email, liveApiKey, livePublicID, s.jwtSecret)
	if err != nil {
		return nil, err
	}
	return &AuthResponse{
		ID:     user.Base.ID.String(),
		Name:   user.Name,
		Email:  user.Email,
		ApiKey: liveApiKey,
		Token:  token,
	}, nil
}

func (s *AuthService) LoginUser(req *LoginRequest) (*AuthResponse, error) {
	// check password length
	if len(req.Password) < 8 {
		return nil, errors.New("password must be at least 8 characters")
	}

	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}
	if err := CheckPasswordHash(req.Password, user.Password); err != nil {
		return nil, errors.New("invalid password")
	}

	// Retrieve user's projects to get active ApiKey and PublicID
	projs, err := s.projectRepo.ListProjects(context.Background(), user.Base.ID.String())
	var apiKey, publicID string
	if err == nil && len(projs) > 0 {
		apiKey = projs[0].ApiKey
		publicID = projs[0].PublicID
	} else {
		// Fallback/Auto-migrate if no project found
		liveApiKey, err := crypto.GenerateAPIKey(true)
		if err != nil {
			return nil, err
		}
		testApiKey, err := crypto.GenerateAPIKey(false)
		if err != nil {
			return nil, err
		}
		testPublicID, err := crypto.GeneratePublicID(false)
		if err != nil {
			return nil, err
		}

		defaultProject := &models.Project{
			Name:         "Default Project",
			ApiKey:       liveApiKey,
			PublicID:     user.PublicID,
			TestApiKey:   testApiKey,
			TestPublicID: testPublicID,
			UserID:       user.Base.ID,
		}
		if err := s.projectRepo.CreateProject(context.Background(), defaultProject); err != nil {
			return nil, err
		}
		apiKey = liveApiKey
		publicID = user.PublicID
	}

	token, err := GenerateJWT(user.Base.ID.String(), user.Email, apiKey, publicID, s.jwtSecret)
	if err != nil {
		return nil, err
	}
	return &AuthResponse{
		ID:     user.Base.ID.String(),
		Name:   user.Name,
		Email:  user.Email,
		ApiKey: apiKey,
		Token:  token,
	}, nil
}

// verify API key
func (s *AuthService) VerifyAPIKey(apiKey string) (*models.User, *models.Project, error) {
	// Try to find project by API key
	project, err := s.projectRepo.FindByApiKey(context.Background(), apiKey)
	if err != nil {
		return nil, nil, errors.New("invalid API key")
	}

	user, err := s.userRepo.FindByID(project.UserID.String())
	if err != nil {
		return nil, nil, err
	}

	return user, project, nil
}
