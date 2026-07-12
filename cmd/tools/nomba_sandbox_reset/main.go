package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/db"
	"github.com/ttomsin/paye/internal/features/providers/nomba"
	"github.com/ttomsin/paye/internal/models"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	encKey := os.Getenv("ENCRYPTION_KEY")
	if encKey == "" {
		encKey = os.Getenv("JWT_SECRET")
	}
	hash := sha256.Sum256([]byte(encKey))
	derivedEncryptionKey := string(hash[:])

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatalf("DATABASE_URL is not set")
	}

	database, err := db.Connect(dbURL)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer func() {
		sqlDB, _ := database.DB.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
	}()

	// Find the Nomba Test Provider Config
	var pc models.ProviderConfig
	if err := database.DB.Where("provider_name = ? AND environment = ?", "nomba", "test").First(&pc).Error; err != nil {
		log.Fatalf("Failed to find Nomba test provider config: %v", err)
	}

	// Decrypt credentials
	clientSecret, err := crypto.Decrypt(pc.SecretKey, derivedEncryptionKey)
	if err != nil {
		log.Fatalf("Failed to decrypt client secret: %v", err)
	}

	clientID, err := crypto.Decrypt(pc.PublicKey, derivedEncryptionKey)
	if err != nil {
		log.Fatalf("Failed to decrypt client id: %v", err)
	}

	webhookSecret, _ := crypto.Decrypt(pc.WebhookSecret, derivedEncryptionKey)
	isLive := false // Sandbox
	accountID := pc.Metadata.NombaAccountID
	subAccountID := pc.Metadata.NombaSubAccountID

	client := nomba.New(clientID, clientSecret, webhookSecret, accountID, subAccountID, isLive)

	log.Println("Fetching all Nomba Sandbox Virtual Accounts from Nomba API...")

	// 1. Fetch token manually from Nomba provider (we can just use the internal method if exported, but it's not. We'll do it manually)
	// Actually, client.ExpireVirtualAccount handles token generation. We need to do the same for List.
	tokenReqBody := map[string]string{
		"grant_type":    "client_credentials",
		"client_id":     clientID,
		"client_secret": clientSecret,
	}
	tokenBody, _ := json.Marshal(tokenReqBody)

	baseURL := "https://sandbox.nomba.com/v1"
	reqToken, err := http.NewRequest("POST", baseURL+"/auth/token/issue", bytes.NewBuffer(tokenBody))
	if err != nil {
		log.Fatalf("Failed to create token req: %v", err)
	}
	reqToken.Header.Set("Content-Type", "application/json")
	if accountID != "" {
		reqToken.Header.Set("accountId", accountID)
	}

	resp, err := http.DefaultClient.Do(reqToken)
	if err != nil {
		log.Fatalf("Failed to get token: %v", err)
	}
	defer resp.Body.Close()

	respBodyBytes, _ := io.ReadAll(resp.Body)
	log.Printf("Token response: %s", string(respBodyBytes))

	var tokenRes struct {
		Data struct {
			AccessToken string `json:"access_token"`
		} `json:"data"`
	}
	if err := json.Unmarshal(respBodyBytes, &tokenRes); err != nil {
		log.Fatalf("Failed to parse token response: %v", err)
	}

	accessToken := tokenRes.Data.AccessToken
	if accessToken == "" {
		log.Fatalf("Empty access token received")
	}

	// 2. Fetch list of VAs
	listReqBody := map[string]interface{}{
		"expired": false,
	}
	listBody, _ := json.Marshal(listReqBody)
	req, err := http.NewRequest("POST", baseURL+"/accounts/virtual/list", bytes.NewBuffer(listBody))
	if err != nil {
		log.Fatalf("Failed to create request: %v", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	if accountID != "" {
		req.Header.Set("accountId", accountID)
	}

	listResp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Fatalf("Failed to fetch VAs: %v", err)
	}
	defer listResp.Body.Close()

	var listRes struct {
		Data struct {
			Accounts []struct {
				AccountRef string `json:"accountRef"`
				Status     string `json:"status"`
			} `json:"accounts"`
		} `json:"data"`
	}
	if err := json.NewDecoder(listResp.Body).Decode(&listRes); err != nil {
		log.Fatalf("Failed to parse list response: %v", err)
	}

	vas := listRes.Data.Accounts
	log.Printf("Found %d active Sandbox Virtual Accounts directly on Nomba.", len(vas))

	// 3. Delete them all
	successCount := 0
	ctx := context.Background()
	for _, va := range vas {
		log.Printf("Expiring VA %s on Nomba Sandbox...", va.AccountRef)
		if err := client.ExpireVirtualAccount(ctx, va.AccountRef); err != nil {
			log.Printf("Failed to expire %s: %v", va.AccountRef, err)
		} else {
			log.Printf("Successfully expired %s", va.AccountRef)
			successCount++
		}
	}

	log.Printf("Nomba Sandbox Reset Complete. %d VAs physically deleted.", successCount)
}
