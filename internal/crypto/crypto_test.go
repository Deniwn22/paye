package crypto

import "testing"

// encrypt then decrypt, verify you get back original
func TestEncryptDecrypt(t *testing.T) {
	key := "12345678901234567890123456789012" // exactly 32 chars
	plainText := "Hello, World!"
	cipherText, err := Encrypt(plainText, key)
	if err != nil {
		t.Errorf("Encrypt error: %v", err)
	}

	decryptedText, err := Decrypt(cipherText, key)
	if err != nil {
		t.Errorf("Decrypt error: %v", err)
	}
	if decryptedText != plainText {
		t.Errorf("Decrypt result mismatch: got %s, want %s", decryptedText, plainText)
	}
}

func TestEncryptProducesDifferentCiphertext(t *testing.T) {
	// encrypt same string twice, verify results are different
	key := "12345678901234567890123456789012" // exactly 32 chars
	plainText := "Hello, World!"
	cipherText1, err := Encrypt(plainText, key)
	if err != nil {
		t.Errorf("Encrypt error: %v", err)
	}
	cipherText2, err := Encrypt(plainText, key)
	if err != nil {
		t.Errorf("Encrypt error: %v", err)
	}
	if cipherText1 == cipherText2 {
		t.Errorf("Encrypt produces same ciphertext: got %s, want different", cipherText1)
	}
}

func TestDecryptWithWrongKey(t *testing.T) {
	// encrypt with one key, decrypt with different key, verify error
	key1 := "12345678901234567890123456789012" // exactly 32 chars
	key2 := "09876543210987654321098765432109" // exactly 32 chars
	plainText := "Hello, World!"
	cipherText, err := Encrypt(plainText, key1)
	if err != nil {
		t.Errorf("Encrypt error: %v", err)
	}
	_, err = Decrypt(cipherText, key2)
	if err == nil {
		t.Errorf("Decrypt with wrong key: expected error, got none")
	}
}
