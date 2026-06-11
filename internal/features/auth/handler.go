package auth

import (
	"log/slog"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/ttomsin/paye/internal/api"
)

type AuthHandler struct {
	authService AuthService
}

func NewAuthHandler(authService AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func formatValidationError(err error) string {
	errs, ok := err.(validator.ValidationErrors)
	if !ok {
		return err.Error()
	}

	var msgs []string
	for _, e := range errs {
		field := e.Field()
		switch field {
		case "Name":
			if e.Tag() == "required" {
				msgs = append(msgs, "Name is required")
			} else {
				msgs = append(msgs, "Name is invalid")
			}
		case "Email":
			if e.Tag() == "required" {
				msgs = append(msgs, "Email is required")
			} else if e.Tag() == "email" {
				msgs = append(msgs, "Invalid email address format")
			} else {
				msgs = append(msgs, "Email is invalid")
			}
		case "Password":
			if e.Tag() == "required" {
				msgs = append(msgs, "Password is required")
			} else if e.Tag() == "min" {
				msgs = append(msgs, "Password must be at least 8 characters")
			} else {
				msgs = append(msgs, "Password is invalid")
			}
		default:
			msgs = append(msgs, field+" is invalid")
		}
	}
	if len(msgs) > 0 {
		return strings.Join(msgs, ", ")
	}
	return err.Error()
}

// SignupHandler godoc
// @Summary Register a new user
// @Description Create a user account and return JWT credentials
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body SignupRequest true "Signup payload"
// @Success 200 {object} SwaggerAuthResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /auth/signup [post]
func (h *AuthHandler) SignupHandler(c *gin.Context) {
	var req SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, api.Error(formatValidationError(err)))
		return
	}

	resp, err := h.authService.RegisterUser(&req)
	if err != nil {
		errStr := err.Error()
		errStrLower := strings.ToLower(errStr)
		if errStr == "email already exists" || errStr == "password must be at least 8 characters" ||
			strings.Contains(errStrLower, "duplicate key") ||
			strings.Contains(errStr, "23505") ||
			strings.Contains(errStrLower, "unique constraint") ||
			strings.Contains(errStrLower, "already exists") ||
			strings.Contains(errStrLower, "duplicate") {
			c.JSON(400, api.Error("email already exists"))
		} else {
			slog.Error("Signup internal error", "error", err)
			c.JSON(500, api.Error("An internal error occurred. Please try again later."))
		}
		return
	}

	c.JSON(200, api.Success("signup successful", resp))
}

// LoginHandler godoc
// @Summary Authenticate user
// @Description Sign in using email and password
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "Login payload"
// @Success 200 {object} SwaggerAuthResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /auth/signin [post]
func (h *AuthHandler) LoginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, api.Error(formatValidationError(err)))
		return
	}

	resp, err := h.authService.LoginUser(&req)
	if err != nil {
		errStr := err.Error()
		if errStr == "user not found" || errStr == "invalid password" || errStr == "password must be at least 8 characters" || errStr == "record not found" {
			c.JSON(401, api.Error("Invalid email or password"))
		} else {
			slog.Error("Login internal error", "error", err)
			c.JSON(500, api.Error("An internal error occurred. Please try again later."))
		}
		return
	}

	c.JSON(200, api.Success("login successful", resp))
}

// RegisterRoutes registers the auth routes
func RegisterRoutes(rg *gin.RouterGroup, h *AuthHandler) {
	auth := rg.Group("/auth")
	{
		auth.POST("/signup", h.SignupHandler)
		auth.POST("/signin", h.LoginHandler)
	}
}
