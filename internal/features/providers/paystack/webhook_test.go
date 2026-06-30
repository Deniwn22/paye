package paystack

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"testing"
)

func TestVerifySignature(t *testing.T) {
	paystack := Paystack{
		apiKey:  "psk_my_secret_key",
		ApiType: Test,
	}
	payload := []byte(`{"event":"charge.success","data":{"id":123456789}}`)

	hash := hmac.New(sha512.New, []byte(paystack.apiKey))
	hash.Write(payload)
	expectedSignature := hex.EncodeToString(hash.Sum(nil))

	correct := paystack.verifySignature(expectedSignature, payload)
	if !correct {
		t.Errorf("verifySignature returned false, expected true")
	}
}

func TestVerifySignature_Invalid(t *testing.T) {
	paystack := Paystack{
		apiKey:  "psk_my_secret_key",
		ApiType: Test,
	}
	payload := []byte(`{"event":"charge.success","data":{"id":123456789}}`)

	hash := hmac.New(sha512.New, []byte(paystack.apiKey))
	hash.Write(payload)

	correct := paystack.verifySignature("invalid_signature", payload)
	if correct {
		t.Errorf("verifySignature returned true, expected false")
	}
}
