package paystack

import (
	"github.com/ttomsin/paye/internal/features/providers"
)

func (p *Paystack) GetBalance() (*providers.BalanceResponse, error) {
	// Mocked for hackathon: return a high balance
	return &providers.BalanceResponse{
		AvailableBalance: 1000000.0,
		Currency:         "NGN",
		Provider:         "paystack",
	}, nil
}
