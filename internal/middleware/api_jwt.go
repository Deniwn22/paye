package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/features/auth"
)

const UserIDContextKey = "user_id"
const UserEmailContextKey = "user_email"
const UserApiKeyContextKey = "user_api_key"
const ProjectIDContextKey = "project_id"
const IsLiveContextKey = "is_live"

type ContextKey string
const IsLiveCtxKey ContextKey = "is_live"

func GetIsLiveFromContext(ctx context.Context) bool {
	if ctx == nil {
		return false
	}
	if val, ok := ctx.Value(IsLiveCtxKey).(bool); ok {
		return val
	}
	return false
}

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

	// Determine active environment mode (live vs test)
	liveHeader := c.GetHeader("X-Live-Mode")
	isLive := liveHeader == "true"
	c.Set(IsLiveContextKey, isLive)
	
	// Propagate to Go context.Context
	reqCtx := context.WithValue(c.Request.Context(), IsLiveCtxKey, isLive)
	c.Request = c.Request.WithContext(reqCtx)

	c.Next()
}
