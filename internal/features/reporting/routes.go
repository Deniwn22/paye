package reporting

import "github.com/gin-gonic/gin"

func RegisterRoutes(rg *gin.RouterGroup, handler *ReportingHandler) {
	// Merchant Aggregator Statement
	rg.GET("/reports/statement", handler.GenerateAggregatorStatementHandler)

	// Virtual Account Statement (Dashboard Access)
	rg.GET("/reports/virtual-accounts/:pvc_id/statement", handler.GenerateVAStatementHandler)
}

func RegisterVARoutes(rg *gin.RouterGroup, handler *ReportingHandler) {
	// Virtual Account Statement
	rg.GET("/virtual-accounts/:pvc_id/statement", handler.GenerateVAStatementHandler)
}
