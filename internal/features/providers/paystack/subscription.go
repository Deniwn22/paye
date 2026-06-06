package paystack

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ttomsin/paye/internal/features/providers"
)

// Plan Types

type paystackCreatePlanRequest struct {
	Name        string `json:"name"`
	Interval    string `json:"interval"`
	Amount      int    `json:"amount"`
	Currency    string `json:"currency,omitempty"`
	Description string `json:"description,omitempty"`
}

type paystackPlanData struct {
	PlanCode string `json:"plan_code"`
	Name     string `json:"name"`
	Amount   int    `json:"amount"`
	Interval string `json:"interval"`
}

type paystackCreatePlanResponse struct {
	Status  bool             `json:"status"`
	Message string           `json:"message"`
	Data    paystackPlanData `json:"data"`
}

func (p *Paystack) CreatePlan(req providers.PlanRequest) (*providers.PlanResponse, error) {
	pReq := paystackCreatePlanRequest{
		Name:        req.Name,
		Interval:    req.Interval,
		Amount:      p.calculateAmount(req.Amount),
		Currency:    req.Currency,
		Description: req.Description,
	}

	body, err := json.Marshal(pReq)
	if err != nil {
		return nil, err
	}

	resp, err := p.makeRequest("POST", p.getBaseURL()+"/plan", body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return nil, fmt.Errorf("paystack plan error: %s", errResult["message"])
	}

	var result paystackCreatePlanResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &providers.PlanResponse{
		Status:   result.Status,
		Message:  result.Message,
		PlanCode: result.Data.PlanCode,
		Name:     result.Data.Name,
		Amount:   float64(result.Data.Amount) / 100,
		Interval: result.Data.Interval,
		Provider: p.Name(),
	}, nil
}

// Subscription Types

type paystackCreateSubscriptionRequest struct {
	Customer      string `json:"customer"`
	Plan          string `json:"plan"`
	Authorization string `json:"authorization,omitempty"`
	StartDate     string `json:"start_date,omitempty"`
}

type paystackSubscriptionData struct {
	SubscriptionCode string `json:"subscription_code"`
	CustomerEmail    string `json:"customer"`
	PlanCode         string `json:"plan"`
}

type paystackCreateSubscriptionResponse struct {
	Status  bool                     `json:"status"`
	Message string                   `json:"message"`
	Data    paystackSubscriptionData `json:"data"`
}

func (p *Paystack) CreateSubscription(req providers.SubscriptionRequest) (*providers.SubscriptionResponse, error) {
	pReq := paystackCreateSubscriptionRequest{
		Customer:      req.CustomerEmail,
		Plan:          req.PlanCode,
		Authorization: req.Authorization,
		StartDate:     req.StartDate,
	}

	body, err := json.Marshal(pReq)
	if err != nil {
		return nil, err
	}

	resp, err := p.makeRequest("POST", p.getBaseURL()+"/subscription", body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return nil, fmt.Errorf("paystack subscription error: %s", errResult["message"])
	}

	var result paystackCreateSubscriptionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &providers.SubscriptionResponse{
		Status:           result.Status,
		Message:          result.Message,
		SubscriptionCode: result.Data.SubscriptionCode,
		CustomerEmail:    result.Data.CustomerEmail,
		PlanCode:         result.Data.PlanCode,
		Provider:         p.Name(),
	}, nil
}

func (p *Paystack) CancelSubscription(subscriptionCode string, emailToken string) error {
	type cancelRequest struct {
		Code  string `json:"code"`
		Token string `json:"token"`
	}

	body, err := json.Marshal(cancelRequest{
		Code:  subscriptionCode,
		Token: emailToken,
	})
	if err != nil {
		return err
	}

	resp, err := p.makeRequest("POST", p.getBaseURL()+"/subscription/disable", body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResult map[string]any
		json.NewDecoder(resp.Body).Decode(&errResult)
		return fmt.Errorf("paystack cancel subscription error: %s", errResult["message"])
	}

	return nil
}
