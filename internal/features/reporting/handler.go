package reporting

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	_ "github.com/ttomsin/paye/internal/api"
	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/features/projects"
	"github.com/ttomsin/paye/internal/features/virtual_accounts"
)

type ReportingHandler struct {
	service     *ReportingService
	projectRepo *projects.ProjectRepo
	vaRepo      *virtual_accounts.VARepository
	repRepo     *ReportingRepo
}

func NewReportingHandler(service *ReportingService, projectRepo *projects.ProjectRepo, vaRepo *virtual_accounts.VARepository, repRepo *ReportingRepo) *ReportingHandler {
	return &ReportingHandler{
		service:     service,
		projectRepo: projectRepo,
		vaRepo:      vaRepo,
		repRepo:     repRepo,
	}
}

// GenerateAggregatorStatementHandler generates a statement of aggregated volumes across providers
// @Summary Generate aggregator statement
// @Description Generate a statement aggregating volumes across providers, optionally downloading as PDF.
// @Tags Reports
// @Produce json
// @Produce application/pdf
// @Security BearerAuth
// @Param start_date query string true "Start Date (2026-06-01T00:00:00Z)"
// @Param end_date query string true "End Date (2026-06-30T23:59:59Z)"
// @Param statuses query string false "Comma separated statuses (e.g. success,failed)"
// @Param format query string false "Format: json or pdf"
// @Success 200 {object} dto.AggregatorStatementResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /reports/statement [get]
func (h *ReportingHandler) GenerateAggregatorStatementHandler(c *gin.Context) {
	projectID, exists := c.Get("project_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"status": false, "message": "unauthorized"})
		return
	}

	var req dto.StatementRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "invalid query parameters: " + err.Error()})
		return
	}

	res, err := h.service.GenerateAggregatorStatement(c.Request.Context(), projectID.(string), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	if req.Format == "pdf" {
		proj, _ := h.projectRepo.FindByID(c.Request.Context(), projectID.(string))
		projName := "Paye Merchant"
		if proj != nil {
			projName = proj.Name
		}

		pdfBytes, err := h.service.GeneratePDFStatement(c.Request.Context(), projectID.(string), res, projName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": "failed to generate pdf: " + err.Error()})
			return
		}
		
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=statement_%s.pdf", req.StartDate.Format("20060102")))
		c.Data(http.StatusOK, "application/pdf", pdfBytes)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": true,
		"data":   res,
	})
}

// GenerateVAStatementHandler generates a statement for a specific virtual account
// @Summary Generate Virtual Account statement
// @Description Generate a statement of transactions for a specific virtual account, optionally downloading as PDF.
// @Tags Reports
// @Produce json
// @Produce application/pdf
// @Security ApiKeyAuth
// @Param pvc_id path string true "PVC ID"
// @Param start_date query string true "Start Date (2026-06-01T00:00:00Z)"
// @Param end_date query string true "End Date (2026-06-30T23:59:59Z)"
// @Param statuses query string false "Comma separated statuses (e.g. success,failed)"
// @Param format query string false "Format: json or pdf"
// @Success 200 {object} api.SwaggerVirtualAccountTransactionListResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 500 {object} api.SwaggerSimpleResponse
// @Router /virtual-accounts/{pvc_id}/statement [get]
// @Router /reports/virtual-accounts/{pvc_id}/statement [get]
func (h *ReportingHandler) GenerateVAStatementHandler(c *gin.Context) {
	projectID, exists := c.Get("project_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"status": false, "message": "unauthorized"})
		return
	}

	pvcID := c.Param("pvc_id")
	if pvcID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "pvc_id is required"})
		return
	}

	var req dto.StatementRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "invalid query parameters: " + err.Error()})
		return
	}

	txs, total, err := h.service.GenerateVAStatement(c.Request.Context(), projectID.(string), pvcID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": err.Error()})
		return
	}

	if req.Format == "pdf" {
		va, err := h.vaRepo.FindByPvcID(c.Request.Context(), pvcID, projectID.(string))
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"status": false, "message": "virtual account not found"})
			return
		}

		pdfBytes, err := h.service.GenerateVAPDFStatement(c.Request.Context(), projectID.(string), va, txs, total, req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": false, "message": "failed to generate pdf: " + err.Error()})
			return
		}
		
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=va_statement_%s.pdf", pvcID))
		c.Data(http.StatusOK, "application/pdf", pdfBytes)
		return
	}

	// For JSON response, convert models to DTOs (simplified here)
	c.JSON(http.StatusOK, gin.H{
		"status": true,
		"data": gin.H{
			"transactions": txs,
			"total_received": total,
		},
	})
}

// VerifyStatementHandler verifies a statement record by UUID
// @Summary Verify Statement Authenticity
// @Description Verify the authenticity of a generated statement PDF using its unique Verification Ref
// @Tags Reports
// @Produce json
// @Param id path string true "Verification Ref (UUID)"
// @Success 200 {object} api.SwaggerStatementVerifyResponse
// @Failure 400 {object} api.SwaggerSimpleResponse
// @Failure 404 {object} api.SwaggerSimpleResponse
// @Router /reports/statements/verify/{id} [get]
func (h *ReportingHandler) VerifyStatementHandler(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"status": false, "message": "verification id is required"})
		return
	}

	record, err := h.repRepo.FindStatementRecordByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": false, "message": "statement not found or invalid"})
		return
	}

	projectName := "Paye Merchant"
	if record.Project != nil {
		projectName = record.Project.Name
	}

	c.JSON(http.StatusOK, gin.H{
		"status": true,
		"message": "statement verified successfully",
		"data": gin.H{
			"id":                record.ID,
			"project_name":      projectName,
			"type":              record.Type,
			"total_volume":      record.TotalVolume,
			"transaction_count": record.TransactionCount,
			"start_date":        record.StartDate,
			"end_date":          record.EndDate,
			"created_at":        record.CreatedAt,
			"is_live":           record.IsLive,
		},
	})
}
