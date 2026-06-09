package middleware

import (
	"context"
	"strings"

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

	isLive := strings.HasPrefix(apiKey, "paye_live_")
	c.Set(IsLiveContextKey, isLive)

	// Propagate to Go context.Context
	reqCtx := context.WithValue(c.Request.Context(), IsLiveCtxKey, isLive)
	c.Request = c.Request.WithContext(reqCtx)

	user, project, err := m.authService.VerifyAPIKey(apiKey)
	if err != nil {
		c.JSON(401, gin.H{"error": "Invalid API key"})
		c.Abort()
		return
	}

	// Enforce that live requests use the live API key and test requests use the test API key
	if isLive {
		if project.ApiKey != apiKey {
			c.JSON(401, gin.H{"error": "Invalid API key for Live Mode"})
			c.Abort()
			return
		}
	} else {
		// Allow project.TestApiKey, or project.ApiKey if project.ApiKey doesn't have the live prefix (legacy fallback)
		if project.TestApiKey != apiKey && (project.ApiKey != apiKey || strings.HasPrefix(project.ApiKey, "paye_live_")) {
			c.JSON(401, gin.H{"error": "Invalid API key for Test Mode"})
			c.Abort()
			return
		}
	}

	c.Set(UserIDContextKey, user.ID.String())
	c.Set(UserEmailContextKey, user.Email)
	c.Set(ProjectIDContextKey, project.ID.String())
	c.Next()
}

