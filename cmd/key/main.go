package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
)

func main() {
	eventType := "payment_success"
	requestID := "test-request-123"
	userID := "user-123"
	walletID := "wallet-123"
	transactionID := "txn-123"
	txType := "credit"
	txTime := "2026-06-26T06:00:00Z"
	responseCode := "00"
	timestamp := "2026-06-26T06:00:00Z"
	secret := "NombaHackathon2026"

	payload := fmt.Sprintf("%s:%s:%s:%s:%s:%s:%s:%s:%s",
		eventType, requestID, userID, walletID,
		transactionID, txType, txTime, responseCode, timestamp,
	)

	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(payload))
	sig := base64.StdEncoding.EncodeToString(h.Sum(nil))

	fmt.Println(sig)
}
