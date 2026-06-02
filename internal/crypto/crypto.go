package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
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
