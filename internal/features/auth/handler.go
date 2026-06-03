package auth

import (
	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/api"
)

type AuthHandler struct {
	authService AuthService
}

func NewAuthHandler(authService AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// SignupHandler handles the signup request
func (h *AuthHandler) SignupHandler(c *gin.Context) {
	var req SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, api.Error(err.Error()))
		return
	}

	resp, err := h.authService.RegisterUser(&req)
	if err != nil {
		c.JSON(500, api.Error(err.Error()))
		return
	}

	c.JSON(200, api.Success("signup successful", resp))
}

// LoginHandler handles the login request
func (h *AuthHandler) LoginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, api.Error(err.Error()))
		return
	}

	resp, err := h.authService.LoginUser(&req)
	if err != nil {
		c.JSON(500, api.Error(err.Error()))
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
