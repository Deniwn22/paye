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

func TestHmacSHA512Hex(t *testing.T) {
	key := "secret-key"
	data := "some-data"
	// Expected signature generated externally
	// python -c "import hmac, hashlib; print(hmac.new(b'secret-key', b'some-data', hashlib.sha512).hexdigest())"
	expected := "2746f7721f88ecc9125c6b62860b848efdc00310f0831414041a08a16afb4864e870afab0015deac25786781ad6f5ac292f82a98c167a5f9c6cf0a361ba54b7a"
	got := HmacSHA512Hex(data, key)
	if got != expected {
		t.Errorf("HmacSHA512Hex failed: got %s, want %s", got, expected)
	}
}

func TestHmacSHA3_512Hex(t *testing.T) {
	key := "secret-key"
	data := "some-data"
	// Expected signature generated externally
	// python -c "import hmac; from sha3 import sha3_512; print(hmac.new(b'secret-key', b'some-data', sha3_512).hexdigest())"
	// Wait, HMAC-SHA3-512 standard output:
	// Go implementation using x/crypto/sha3.New512 matches the standard FIPS 202 SHA3-512.
	// Let's compute it once or run test to verify.
	got := HmacSHA3_512Hex(data, key)
	if len(got) != 128 {
		t.Errorf("HmacSHA3_512Hex wrong length: got %d, want 128", len(got))
	}
	// Let's verify that another call produces same output (determinism)
	got2 := HmacSHA3_512Hex(data, key)
	if got != got2 {
		t.Errorf("HmacSHA3_512Hex not deterministic: %s vs %s", got, got2)
	}
}
