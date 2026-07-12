package flutterwave

import (
	"github.com/ttomsin/paye/internal/features/providers"
)

func (f *Flutterwave) GetBalance() (*providers.BalanceResponse, error) {
	// Mocked for hackathon: return a high balance
	return &providers.BalanceResponse{
		AvailableBalance: 1200000.0,
		Currency:         "NGN",
		Provider:         "flutterwave",
	}, nil
}
