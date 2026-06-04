package auth

// SwaggerAuthResponse represents the auth success response
type SwaggerAuthResponse struct {
	Status  bool         `json:"status"`
	Message string       `json:"message"`
	Data    AuthResponse `json:"data"`
}
