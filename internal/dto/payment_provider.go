package dto

import "github.com/ttomsin/paye/internal/models"

type PaymentProviderResponse struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Label           string `json:"label"`
	Description     string `json:"description"`
	IsSupported     bool   `json:"is_supported"`
	TestCredentials string `json:"test_credentials"`
	Notes           string `json:"notes"`
}

type UpdatePaymentProviderRequest struct {
	Description     string `json:"description"`
	IsSupported     *bool  `json:"is_supported"`
	TestCredentials string `json:"test_credentials"`
	Notes           string `json:"notes"`
}

func ToPaymentProviderResponse(m *models.PaymentProvider) *PaymentProviderResponse {
	return &PaymentProviderResponse{
		ID:              m.ID.String(),
		Name:            m.Name,
		Label:           m.Label,
		Description:     m.Description,
		IsSupported:     m.IsSupported,
		TestCredentials: m.TestCredentials,
		Notes:           m.Notes,
	}
}

func ToPaymentProviderResponseList(list []*models.PaymentProvider) []*PaymentProviderResponse {
	res := make([]*PaymentProviderResponse, len(list))
	for i, m := range list {
		res[i] = ToPaymentProviderResponse(m)
	}
	return res
}
