package opay

import (
	"github.com/ttomsin/paye/internal/features/providers"
)

func (p *Provider) GetBalance() (*providers.BalanceResponse, error) {
	// Mocked for hackathon: return a high balance
	return &providers.BalanceResponse{
		AvailableBalance: 800000.0,
		Currency:         "NGN",
		Provider:         "opay",
	}, nil
}
