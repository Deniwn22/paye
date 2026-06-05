package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/features/auth"
)

const ApiKeyHeader = "X-Paye-API-Key"

type ApiKeyMiddleware struct {
	authService auth.IAuthService
}

func NewApiKeyMiddleware(authService auth.IAuthService) *ApiKeyMiddleware {
	return &ApiKeyMiddleware{authService: authService}
}

func (m *ApiKeyMiddleware) Handle(c *gin.Context) {
	apiKey := c.GetHeader(ApiKeyHeader)
	if apiKey == "" {
		c.JSON(401, gin.H{"error": "API key is required"})
		c.Abort()
		return
	}
	user, project, err := m.authService.VerifyAPIKey(apiKey)
	if err != nil {
		c.JSON(401, gin.H{"error": "Invalid API key"})
		c.Abort()
		return
	}
	c.Set(UserIDContextKey, user.ID.String())
	c.Set(UserEmailContextKey, user.Email)
	c.Set(ProjectIDContextKey, project.ID.String())
	c.Next()
}

