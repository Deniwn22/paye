package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha512"
	"encoding/hex"
	"errors"

	"golang.org/x/crypto/sha3"
)

// Encrypt encrypts the plain text using the given key and returns the cipher text and nonce as a hex string.
// Note: AES-256 requires exactly 32 bytes for the key.
// if not aes.NewCipher(byteKey) == nil, return an error.
func Encrypt(plainText string, key string) (string, error) {
	byteKey := []byte(key)
	bytePlainText := []byte(plainText)

	block, err := aes.NewCipher(byteKey)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, 12)
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	cipherText := aesgcm.Seal(nil, nonce, bytePlainText, nil)
	cipherTextAndNonce := append(nonce, cipherText...)
	return hex.EncodeToString(cipherTextAndNonce), nil
}

func Decrypt(cipherText string, key string) (string, error) {
	byteKey := []byte(key)
	byteCipherText, err := hex.DecodeString(cipherText)
	if err != nil {
		return "", err
	}

	if len(byteCipherText) < 12 {
		return "", errors.New("ciphertext too short")
	}

	nonce := byteCipherText[:12]
	cipherTextBytes := byteCipherText[12:]

	block, err := aes.NewCipher(byteKey)
	if err != nil {
		return "", err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	plainText, err := aesgcm.Open(nil, nonce, cipherTextBytes, nil)
	if err != nil {
		return "", err
	}

	return string(plainText), nil
}

// GenerateAPIKey generates a random API key as a hex-encoded string
// and appends paye_live_ or paye_test_ to the beginning of the key.
func GenerateAPIKey(isLive bool) (string, error) {
	apiKey := make([]byte, 32)
	_, err := rand.Read(apiKey)
	if err != nil {
		return "", err
	}
	prefix := "paye_test_"
	if isLive {
		prefix = "paye_live_"
	}
	return prefix + hex.EncodeToString(apiKey), nil
}

// GeneratePublicID generates a random Public ID as a hex-encoded string
// and appends paye_live_pub_ or paye_test_pub_ to the beginning.
func GeneratePublicID(isLive bool) (string, error) {
	pubBytes := make([]byte, 16)
	_, err := rand.Read(pubBytes)
	if err != nil {
		return "", err
	}
	prefix := "paye_test_pub_"
	if isLive {
		prefix = "paye_live_pub_"
	}
	return prefix + hex.EncodeToString(pubBytes), nil
}

// HmacSHA512Hex returns the HMAC-SHA512 signature of data using the secret key, as a lowercase hex string.
func HmacSHA512Hex(data, key string) string {
	mac := hmac.New(sha512.New, []byte(key))
	mac.Write([]byte(data))
	return hex.EncodeToString(mac.Sum(nil))
}

// HmacSHA3_512Hex returns the HMAC-SHA3-512 signature of data using the secret key, as a lowercase hex string.
func HmacSHA3_512Hex(data, key string) string {
	mac := hmac.New(sha3.New512, []byte(key))
	mac.Write([]byte(data))
	return hex.EncodeToString(mac.Sum(nil))
}

