package auth

import (
	"errors"

	"github.com/ttomsin/paye/internal/features/user"
	"github.com/ttomsin/paye/internal/models"
)

type IAuthService interface {
	VerifyAPIKey(apiKey string) (*models.User, error)
}

type AuthService struct {
	userRepo  user.IUserRepo
	jwtSecret string
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

func NewAuthService(userRepo user.IUserRepo, jwtSecret string) *AuthService {
	return &AuthService{userRepo: userRepo, jwtSecret: jwtSecret}
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
	apiKey, err := GenerateAPIKey()
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: hashedPassword,
		ApiKey:   apiKey,
	}
	if err := s.userRepo.CreateUser(user); err != nil {
		return nil, err
	}
	token, err := GenerateJWT(user.Base.ID.String(), user.Email, user.ApiKey, s.jwtSecret)
	if err != nil {
		return nil, err
	}
	return &AuthResponse{
		ID:     user.Base.ID.String(),
		Name:   user.Name,
		Email:  user.Email,
		ApiKey: user.ApiKey,
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
	token, err := GenerateJWT(user.Base.ID.String(), user.Email, user.ApiKey, s.jwtSecret)
	if err != nil {
		return nil, err
	}
	return &AuthResponse{
		ID:     user.Base.ID.String(),
		Name:   user.Name,
		Email:  user.Email,
		ApiKey: user.ApiKey,
		Token:  token,
	}, nil
}

// verify API key
func (s *AuthService) VerifyAPIKey(apiKey string) (*models.User, error) {
	user, err := s.userRepo.FindByApiKey(apiKey)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("invalid API key")
	}
	return user, nil
}
