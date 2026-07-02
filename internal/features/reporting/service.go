package reporting

import (
	"context"
	"fmt"
	"strings"

	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/col"
	"github.com/johnfercher/maroto/v2/pkg/components/image"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/config"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/props"

	"github.com/ttomsin/paye/internal/dto"
	"github.com/ttomsin/paye/internal/models"
	"github.com/ttomsin/paye/internal/features/transactions"
	"github.com/ttomsin/paye/internal/features/virtual_accounts"
	"github.com/ttomsin/paye/internal/middleware"
)

type ReportingService struct {
	txRepo *transactions.TransactionRepo
	vaRepo *virtual_accounts.VARepository
}

func NewReportingService(txRepo *transactions.TransactionRepo, vaRepo *virtual_accounts.VARepository) *ReportingService {
	return &ReportingService{
		txRepo: txRepo,
		vaRepo: vaRepo,
	}
}

// GenerateAggregatorStatement aggregates volume by provider
func (s *ReportingService) GenerateAggregatorStatement(ctx context.Context, projectID string, req dto.StatementRequest) (*dto.AggregatorStatementResponse, error) {
	isLive := middleware.GetIsLiveFromContext(ctx)

	var statuses []string
	if req.Statuses != "" {
		statuses = strings.Split(req.Statuses, ",")
	}

	txs, err := s.txRepo.GetTransactionsForStatement(ctx, projectID, isLive, req.StartDate, req.EndDate, statuses)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch transactions: %w", err)
	}

	vaTxs, err := s.vaRepo.GetAggregatorVATransactionsForStatement(ctx, projectID, isLive, req.StartDate, req.EndDate, statuses)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch virtual account transactions: %w", err)
	}

	providerStats := make(map[string]dto.ProviderSummary)

	for _, tx := range txs {
		p := tx.Provider
		stat := providerStats[p]
		stat.TotalVolume += tx.Amount
		stat.TransactionCount++
		providerStats[p] = stat
	}

	for _, tx := range vaTxs {
		p := tx.Provider
		stat := providerStats[p]
		stat.TotalVolume += tx.Amount
		stat.TransactionCount++
		providerStats[p] = stat
	}

	return &dto.AggregatorStatementResponse{
		StartDate: req.StartDate,
		EndDate:   req.EndDate,
		Providers: providerStats,
	}, nil
}

// GeneratePDFStatement outputs the aggregated JSON to a styled PDF
func (s *ReportingService) GeneratePDFStatement(data *dto.AggregatorStatementResponse, projectName string) ([]byte, error) {
	cfg := config.NewBuilder().
		WithPageNumber().
		WithLeftMargin(15).
		WithTopMargin(10).
		WithRightMargin(10).
		Build()

	m := maroto.New(cfg)

	// Add Header with Logo
	m.AddRow(20,
		image.NewFromFileCol(2, "favicon_io/apple-touch-icon.png", props.Rect{
			Center:  true,
			Percent: 100,
		}),
		text.NewCol(10, "Statement of Account", props.Text{
			Top:   5,
			Style: fontstyle.Bold,
			Align: align.Center,
			Size:  16,
		}),
	)

	m.AddRow(10, text.NewCol(12, fmt.Sprintf("Project: %s", projectName), props.Text{Style: fontstyle.Bold, Size: 12}))
	m.AddRow(10, text.NewCol(12, fmt.Sprintf("Period: %s to %s", data.StartDate.Format("Jan 02, 2006"), data.EndDate.Format("Jan 02, 2006")), props.Text{Size: 10}))

	m.AddRow(10) // Spacer

	// Add Table Headers
	m.AddRow(10,
		text.NewCol(4, "Provider", props.Text{Style: fontstyle.Bold, Size: 11}),
		text.NewCol(4, "Transaction Count", props.Text{Style: fontstyle.Bold, Size: 11}),
		text.NewCol(4, "Total Volume (NGN)", props.Text{Style: fontstyle.Bold, Size: 11}),
	)

	// Add Table Rows
	for provider, stat := range data.Providers {
		m.AddRow(10,
			text.NewCol(4, strings.ToUpper(provider), props.Text{Size: 10}),
			text.NewCol(4, fmt.Sprintf("%d", stat.TransactionCount), props.Text{Size: 10}),
			text.NewCol(4, fmt.Sprintf("%.2f", stat.TotalVolume), props.Text{Size: 10}),
		)
	}

	m.AddRow(20) // Spacer

	// Add Stamp
	m.AddRow(30,
		col.New(8), // empty space left
		text.NewCol(4, "VERIFIED BY PAYE", props.Text{
			Style: fontstyle.BoldItalic,
			Size:  14,
			Align: align.Right,
		}),
	)

	doc, err := m.Generate()
	if err != nil {
		return nil, err
	}

	return doc.GetBytes(), nil
}

// GenerateVAStatement generates a statement for a specific virtual account
func (s *ReportingService) GenerateVAStatement(ctx context.Context, projectID, pvcID string, req dto.StatementRequest) ([]*models.VirtualAccountTransaction, float64, error) {
	isLive := middleware.GetIsLiveFromContext(ctx)

	var statuses []string
	if req.Statuses != "" {
		statuses = strings.Split(req.Statuses, ",")
	}

	txs, err := s.vaRepo.GetVATransactionsForStatement(ctx, projectID, pvcID, isLive, req.StartDate, req.EndDate, statuses)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to fetch va transactions: %w", err)
	}

	var total float64
	for _, tx := range txs {
		if tx.Status == "success" {
			total += tx.Amount
		}
	}

	return txs, total, nil
}

// GenerateVAPDFStatement outputs the virtual account statement to PDF
func (s *ReportingService) GenerateVAPDFStatement(va *models.VirtualAccount, txs []*models.VirtualAccountTransaction, total float64, req dto.StatementRequest) ([]byte, error) {
	cfg := config.NewBuilder().
		WithPageNumber().
		WithLeftMargin(15).
		WithTopMargin(10).
		WithRightMargin(10).
		Build()

	m := maroto.New(cfg)

	// Add Header with Logo
	m.AddRow(20,
		image.NewFromFileCol(2, "favicon_io/apple-touch-icon.png", props.Rect{
			Center:  true,
			Percent: 100,
		}),
		text.NewCol(10, "Virtual Account Statement", props.Text{
			Top:   5,
			Style: fontstyle.Bold,
			Align: align.Center,
			Size:  16,
		}),
	)

	m.AddRow(10, text.NewCol(12, fmt.Sprintf("Account Name: %s", va.AccountName), props.Text{Style: fontstyle.Bold, Size: 12}))
	m.AddRow(10, text.NewCol(12, fmt.Sprintf("Account Number: %s", va.BankAccountNumber), props.Text{Size: 10}))
	m.AddRow(10, text.NewCol(12, fmt.Sprintf("Bank: %s", va.BankName), props.Text{Size: 10}))
	m.AddRow(10, text.NewCol(12, fmt.Sprintf("Total Received in Period: ₦%.2f", total), props.Text{Style: fontstyle.Bold, Size: 10}))
	m.AddRow(10, text.NewCol(12, fmt.Sprintf("Period: %s to %s", req.StartDate.Format("Jan 02, 2006"), req.EndDate.Format("Jan 02, 2006")), props.Text{Size: 10}))

	m.AddRow(10) // Spacer

	// Add Table Headers
	m.AddRow(10,
		text.NewCol(3, "Date", props.Text{Style: fontstyle.Bold, Size: 10}),
		text.NewCol(3, "Reference", props.Text{Style: fontstyle.Bold, Size: 10}),
		text.NewCol(2, "Status", props.Text{Style: fontstyle.Bold, Size: 10}),
		text.NewCol(2, "Sender", props.Text{Style: fontstyle.Bold, Size: 10}),
		text.NewCol(2, "Amount", props.Text{Style: fontstyle.Bold, Size: 10}),
	)

	// Add Table Rows
	for _, tx := range txs {
		m.AddRow(10,
			text.NewCol(3, tx.CreatedAt.Format("Jan 02, 2006"), props.Text{Size: 9}),
			text.NewCol(3, tx.Reference, props.Text{Size: 8}),
			text.NewCol(2, strings.ToUpper(tx.Status), props.Text{Size: 9}),
			text.NewCol(2, tx.SenderName, props.Text{Size: 9}),
			text.NewCol(2, fmt.Sprintf("%.2f", tx.Amount), props.Text{Size: 9}),
		)
	}

	m.AddRow(20) // Spacer

	// Add Stamp
	m.AddRow(30,
		col.New(8), // empty space left
		text.NewCol(4, "VERIFIED BY PAYE", props.Text{
			Style: fontstyle.BoldItalic,
			Size:  14,
			Align: align.Right,
		}),
	)

	doc, err := m.Generate()
	if err != nil {
		return nil, err
	}

	return doc.GetBytes(), nil
}
