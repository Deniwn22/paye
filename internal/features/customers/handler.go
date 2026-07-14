package customers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ttomsin/paye/internal/api"
	"github.com/ttomsin/paye/internal/middleware"
)

type CustomerHandler struct {
	service *CustomerService
}

func NewCustomerHandler(service *CustomerService) *CustomerHandler {
	return &CustomerHandler{service: service}
}

// ListCustomersHandler godoc
// @Summary List customers
// @Description Get a paginated list of unified customers for the current project.
// @Tags Customers
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param page query int false "Page number"
// @Param per_page query int false "Items per page"
// @Success 200 {object} api.SwaggerCustomerListResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /customers [get]
func (h *CustomerHandler) ListCustomersHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	isLive := false
	if live, ok := c.Get(middleware.IsLiveContextKey); ok {
		isLive = live.(bool)
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	resp, err := h.service.ListCustomers(c.Request.Context(), projectID.(string), isLive, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Customers retrieved successfully", resp))
}

// GetCustomerHandler godoc
// @Summary Get customer details
// @Description Get details of a specific unified customer by their code.
// @Tags Customers
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param code path string true "Customer Code"
// @Success 200 {object} api.SwaggerCustomerResponse
// @Failure 401 {object} api.SwaggerSimpleResponse
// @Failure 404 {object} api.SwaggerSimpleResponse
// @Router /customers/{code} [get]
func (h *CustomerHandler) GetCustomerHandler(c *gin.Context) {
	projectID, exists := c.Get(middleware.ProjectIDContextKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, api.Error("Unauthorized"))
		return
	}

	isLive := false
	if live, ok := c.Get(middleware.IsLiveContextKey); ok {
		isLive = live.(bool)
	}

	code := c.Param("code")

	resp, err := h.service.GetCustomer(c.Request.Context(), projectID.(string), code, isLive)
	if err != nil {
		c.JSON(http.StatusNotFound, api.Error(err.Error()))
		return
	}

	c.JSON(http.StatusOK, api.Success("Customer retrieved successfully", resp))
}
