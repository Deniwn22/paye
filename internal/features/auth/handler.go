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
		c.JSON(400, api.Error(err.Error()))
		return
	}

	resp, err := h.authService.RegisterUser(&req)
	if err != nil {
		errStr := err.Error()
		if errStr == "email already exists" || errStr == "password must be at least 8 characters" {
			c.JSON(400, api.Error(errStr))
		} else {
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
		c.JSON(400, api.Error(err.Error()))
		return
	}

	resp, err := h.authService.LoginUser(&req)
	if err != nil {
		errStr := err.Error()
		if errStr == "user not found" || errStr == "invalid password" || errStr == "password must be at least 8 characters" {
			c.JSON(401, api.Error("Invalid email or password"))
		} else {
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
