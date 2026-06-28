package projects

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/api"
)

const userIDContextKey = "user_id"

type ProjectHandler struct {
	service *ProjectService
}

func NewProjectHandler(service *ProjectService) *ProjectHandler {
	return &ProjectHandler{service: service}
}

// @Summary Create a new project
// @Description Create a new project for the authenticated user
// @Tags Projects
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param request body CreateProjectRequest true "Project details"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /projects [post]
func (h *ProjectHandler) CreateProjectHandler(c *gin.Context) {
	userID, exists := c.Get(userIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, api.Error(err.Error()))
		return
	}

	project, err := h.service.CreateProject(c.Request.Context(), userID.(string), req.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	resp := &ProjectResponse{
		ID:           project.ID.String(),
		Name:         project.Name,
		ApiKey:       project.ApiKey,
		PublicID:     project.PublicID,
		TestApiKey:   project.TestApiKey,
		TestPublicID: project.TestPublicID,
	}

	c.JSON(http.StatusOK, api.Success("Project created successfully", resp))
}

// @Summary List user projects
// @Description List all projects belonging to the authenticated user
// @Tags Projects
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /projects [get]
func (h *ProjectHandler) ListProjectsHandler(c *gin.Context) {
	userID, exists := c.Get(userIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	projects, err := h.service.ListProjects(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	var resp []*ProjectResponse
	for _, p := range projects {
		resp = append(resp, &ProjectResponse{
			ID:           p.ID.String(),
			Name:         p.Name,
			ApiKey:       p.ApiKey,
			PublicID:     p.PublicID,
			TestApiKey:   p.TestApiKey,
			TestPublicID: p.TestPublicID,
		})
	}

	c.JSON(http.StatusOK, api.Success("Projects retrieved successfully", resp))
}

// @Summary Get project details
// @Description Get details of a specific project by its ID
// @Tags Projects
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Project ID"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 403 {object} api.SwaggerSimpleResponse
// @Failure 404 {object} api.SwaggerSimpleResponse
// @Router /projects/{id} [get]
func (h *ProjectHandler) GetProjectHandler(c *gin.Context) {
	userID, exists := c.Get(userIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, api.Error("Project ID is required"))
		return
	}

	project, err := h.service.GetProjectByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, api.Error("Project not found"))
		return
	}

	if project.UserID.String() != userID.(string) {
		c.JSON(http.StatusForbidden, api.Error("Forbidden"))
		return
	}

	resp := &ProjectResponse{
		ID:       project.ID.String(),
		Name:     project.Name,
		ApiKey:   project.ApiKey,
		PublicID: project.PublicID,
	}

	c.JSON(http.StatusOK, api.Success("Project retrieved successfully", resp))
}

// @Summary Delete a project
// @Description Delete a specific project by its ID
// @Tags Projects
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "Project ID"
// @Success 200 {object} api.SwaggerSimpleResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /projects/{id} [delete]
func (h *ProjectHandler) DeleteProjectHandler(c *gin.Context) {
	userID, exists := c.Get(userIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, api.Error("Project ID is required"))
		return
	}

	err := h.service.DeleteProject(c.Request.Context(), id, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success[any]("Project deleted successfully", nil))
}

func RegisterRoutes(rg *gin.RouterGroup, h *ProjectHandler) {
	projects := rg.Group("/projects")
	{
		projects.POST("", h.CreateProjectHandler)
		projects.GET("", h.ListProjectsHandler)
		projects.GET("/:id", h.GetProjectHandler)
		projects.DELETE("/:id", h.DeleteProjectHandler)
	}
}
