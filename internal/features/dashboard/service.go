package dashboard

import (
	"context"

	"github.com/ttomsin/paye/internal/dto"
)

type DashboardService struct {
	repo *DashboardRepo
}

func NewDashboardService(repo *DashboardRepo) *DashboardService {
	return &DashboardService{repo: repo}
}

func (s *DashboardService) GetStats(ctx context.Context, projectID string) (*dto.DashboardStatsResponse, error) {
	return s.repo.GetStats(ctx, projectID)
}

func (s *DashboardService) GetLogs(ctx context.Context, projectID string, limit int, offset int) ([]*dto.WebhookLogResponse, error) {
	logs, err := s.repo.GetLogs(ctx, projectID, limit, offset)
	if err != nil {
		return nil, err
	}

	res := make([]*dto.WebhookLogResponse, 0, len(logs))
	for _, l := range logs {
		var configID string
		if l.WebhookConfigID != nil {
			configID = l.WebhookConfigID.String()
		}
		res = append(res, &dto.WebhookLogResponse{
			ID:              l.Base.ID.String(),
			WebhookConfigID: configID,
			Event:           l.Event,
			Reference:       l.Reference,
			Amount:          l.Amount,
			Status:          l.Status,
			ForwardedStatus: l.ForwardedStatus,
			ErrorMessage:    l.ErrorMessage,
			Payload:         l.Payload,
			CreatedAt:       l.Base.CreatedAt,
		})
	}
	return res, nil
}
