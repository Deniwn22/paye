package auth

import (
	"github.com/golang-jwt/jwt/v5"
	"github.com/ttomsin/paye/internal/crypto"
	"golang.org/x/crypto/bcrypt"
)

// Claims represents the JWT claims for a user.
type Claims struct {
	UserID   string `json:"user_id"`
	Email    string `json:"email"`
	APIKey   string `json:"api_key"`
	PublicID string `json:"public_id"`
	jwt.RegisteredClaims
}

func HashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

func CheckPasswordHash(password, hashedPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// GenerateAPIKey generates a random API key as a hex-encoded string.
// and appends paye to the beginning of the key.
func GenerateAPIKey(isLive bool) (string, error) {
	return crypto.GenerateAPIKey(isLive)
}

// GenerateJWT generates a JWT token for the given user ID, API key, and Public ID.
func GenerateJWT(userID, email, apiKey, publicID string, secretKey string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &Claims{
		UserID:   userID,
		Email:    email,
		APIKey:   apiKey,
		PublicID: publicID,
	})
	return token.SignedString([]byte(secretKey))
}

// VerifyJWT verifies the given JWT token and returns the claims if valid.
func VerifyJWT(tokenString, secretKey string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		return []byte(secretKey), nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, jwt.ErrSignatureInvalid
}
