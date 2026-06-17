package dto

import "github.com/ttomsin/paye/internal/models"

type PaymentProviderResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Label       string `json:"label"`
	Description string `json:"description"`
	IsSupported bool   `json:"is_supported"`
}

func ToPaymentProviderResponse(m *models.PaymentProvider) *PaymentProviderResponse {
	return &PaymentProviderResponse{
		ID:          m.ID.String(),
		Name:        m.Name,
		Label:       m.Label,
		Description: m.Description,
		IsSupported: m.IsSupported,
	}
}

func ToPaymentProviderResponseList(list []*models.PaymentProvider) []*PaymentProviderResponse {
	res := make([]*PaymentProviderResponse, len(list))
	for i, m := range list {
		res[i] = ToPaymentProviderResponse(m)
	}
	return res
}
