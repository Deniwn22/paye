package auth

import (
	"crypto/rand"
	"encoding/hex"

	"golang.org/x/crypto/bcrypt"
)

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
func GenerateAPIKey() (string, error) {
	apiKey := make([]byte, 64)
	_, err := rand.Read(apiKey)
	if err != nil {
		return "", err
	}
	return "paye_" + hex.EncodeToString(apiKey), nil
}
