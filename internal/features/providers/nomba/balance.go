package nomba

import (
	"github.com/ttomsin/paye/internal/features/providers"
)

func (n *Nomba) GetBalance() (*providers.BalanceResponse, error) {
	// Mocked for hackathon: return a high balance
	return &providers.BalanceResponse{
		AvailableBalance: 1500000.0,
		Currency:         "NGN",
		Provider:         "nomba",
	}, nil
}
