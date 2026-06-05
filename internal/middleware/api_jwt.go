package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/features/auth"
)

const UserIDContextKey = "user_id"
const UserEmailContextKey = "user_email"
const UserApiKeyContextKey = "user_api_key"
const ProjectIDContextKey = "project_id"

type ApiJwtMiddleware struct {
	jwtSecretKey string
}

func NewApiJwtMiddleware(jwtSecretKey string) *ApiJwtMiddleware {
	return &ApiJwtMiddleware{jwtSecretKey: jwtSecretKey}
}

func (m *ApiJwtMiddleware) Handle(c *gin.Context) {
	// Extract JWT token from the request
	token := c.GetHeader("Authorization")
	if token == "" {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}
	if !strings.HasPrefix(token, "Bearer ") {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}
	token = token[7:]
	// verify the token
	claims, err := auth.VerifyJWT(token, m.jwtSecretKey)
	if err != nil {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}
	// set the claims in the context
	c.Set(UserIDContextKey, claims.UserID)
	c.Set(UserEmailContextKey, claims.Email)
	c.Set(UserApiKeyContextKey, claims.APIKey)
	c.Next()
}
