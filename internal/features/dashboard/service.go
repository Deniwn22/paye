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

func (s *DashboardService) GetStats(ctx context.Context, userID string) (*dto.DashboardStatsResponse, error) {
	return s.repo.GetStats(ctx, userID)
}

func (s *DashboardService) GetLogs(ctx context.Context, userID string, limit int, offset int) ([]*dto.WebhookLogResponse, error) {
	logs, err := s.repo.GetLogs(ctx, userID, limit, offset)
	if err != nil {
		return nil, err
	}

	res := make([]*dto.WebhookLogResponse, 0, len(logs))
	for _, l := range logs {
		res = append(res, &dto.WebhookLogResponse{
			ID:              l.Base.ID.String(),
			WebhookConfigID: l.WebhookConfigID.String(),
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
