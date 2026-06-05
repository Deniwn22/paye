package middleware

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/gorm"
)

type ProjectScopeMiddleware struct {
	db *gorm.DB
}

func NewProjectScopeMiddleware(db *gorm.DB) *ProjectScopeMiddleware {
	return &ProjectScopeMiddleware{db: db}
}

func (m *ProjectScopeMiddleware) Handle(c *gin.Context) {
	userIDStr, exists := c.Get(UserIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		c.Abort()
		return
	}

	projectIDHeader := c.GetHeader("X-Project-ID")
	if projectIDHeader == "" {
		projectIDHeader = c.Query("project_id")
	}

	var project models.Project

	if projectIDHeader != "" {
		// Verify project belongs to user
		err := m.db.Where("id = ? AND user_id = ?", projectIDHeader, userIDStr).First(&project).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "Project not found or access denied"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			}
			c.Abort()
			return
		}
	} else {
		// Find first project or create default project if user has none
		err := m.db.Where("user_id = ?", userIDStr).Order("created_at ASC").First(&project).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// No projects found - create default one
				var user models.User
				if err := m.db.Where("id = ?", userIDStr).First(&user).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load user info"})
					c.Abort()
					return
				}

				apiKey, err := crypto.GenerateAPIKey()
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate project api key"})
					c.Abort()
					return
				}

				project = models.Project{
					Name:     "Default Project",
					ApiKey:   apiKey,
					PublicID: user.PublicID, // Align with legacy public ID
					UserID:   user.ID,
				}

				if err := m.db.Create(&project).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create default project"})
					c.Abort()
					return
				}
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				c.Abort()
				return
			}
		}
	}

	c.Set(ProjectIDContextKey, project.ID.String())
	c.Next()
}
