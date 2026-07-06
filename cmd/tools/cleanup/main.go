package main

import (
	"context"
	"crypto/sha256"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"github.com/ttomsin/paye/internal/crypto"
	"github.com/ttomsin/paye/internal/db"
	"github.com/ttomsin/paye/internal/features/providers"
	"github.com/ttomsin/paye/internal/features/providers/flutterwave"
	"github.com/ttomsin/paye/internal/features/providers/nomba"
	"github.com/ttomsin/paye/internal/models"
)

func getProviderInstance(va *models.VirtualAccount, pc *models.ProviderConfig, encKey string) (providers.VirtualAccountProvider, error) {
	clientSecret, err := crypto.Decrypt(pc.SecretKey, encKey)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt client secret: %w", err)
	}

	if pc.ProviderName == "flutterwave" {
		client := flutterwave.New(clientSecret)
		return client, nil
	}

	clientID, err := crypto.Decrypt(pc.PublicKey, encKey)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt client id: %w", err)
	}

	webhookSecret, _ := crypto.Decrypt(pc.WebhookSecret, encKey)
	client := nomba.New(clientID, clientSecret, webhookSecret, pc.Metadata.NombaAccountID, pc.Metadata.NombaSubAccountID, va.IsLive)
	return client, nil
}

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

	providers.RegisterProviderFactory("nomba", nomba.NewNombaProvider)
	providers.RegisterProviderFactory("flutterwave", flutterwave.NewFlutterwaveProvider)

	ctx := context.Background()

	// 1. Find all TEST MODE paye_va_ids that have at least one 'expired' VA
	var expiredVAs []*models.VirtualAccount
	if err := database.DB.Where("status = ? AND is_live = ?", "expired", false).Find(&expiredVAs).Error; err != nil {
		log.Fatalf("Failed to query expired VAs: %v", err)
	}

	expiredPayeIDs := make(map[string]bool)
	for _, va := range expiredVAs {
		if va.PayeVaID != "" {
			expiredPayeIDs[va.PayeVaID] = true
		}
	}

	var payeIDsList []string
	for id := range expiredPayeIDs {
		payeIDsList = append(payeIDsList, id)
	}

	if len(payeIDsList) == 0 {
		log.Println("No expired VA chains found in test mode.")
		return
	}

	// 2. Find all TEST MODE 'active' VAs that belong to those expired paye_va_ids (orphans)
	var orphanedVAs []*models.VirtualAccount
	if err := database.DB.Where("status = ? AND is_live = ? AND paye_va_id IN ?", "active", false, payeIDsList).Find(&orphanedVAs).Error; err != nil {
		log.Fatalf("Failed to query orphaned VAs: %v", err)
	}

	if len(orphanedVAs) == 0 {
		log.Println("No orphaned active VAs found in test mode.")
		return
	}

	log.Printf("Found %d orphaned 'active' Virtual Accounts belonging to an expired chain in TEST MODE. Attempting expiration...", len(orphanedVAs))

	successCount := 0
	for _, va := range orphanedVAs {
		env := "test"
		var providerCfg models.ProviderConfig
		if err := database.DB.Where("project_id = ? AND provider_name = ? AND environment = ?", va.ProjectID, va.Provider, env).First(&providerCfg).Error; err != nil {
			log.Printf("Skip VA %s (Provider %s): config not found: %v", va.PvcID, va.Provider, err)
			continue
		}

		provider, err := getProviderInstance(va, &providerCfg, derivedEncryptionKey)
		if err != nil {
			log.Printf("Skip VA %s (Provider %s): failed to init provider: %v", va.PvcID, va.Provider, err)
			continue
		}

		log.Printf("Expiring orphaned VA %s physically on %s...", va.AccountRef, va.Provider)
		if err := provider.ExpireVirtualAccount(ctx, va.AccountRef); err != nil {
			if !strings.Contains(err.Error(), "expire VA not supported") {
				log.Printf("Failed to expire VA %s on %s: %v", va.AccountRef, va.Provider, err)
			} else {
				log.Printf("VA %s on %s ignored (unsupported expire operation)", va.AccountRef, va.Provider)
				successCount++
			}
		} else {
			log.Printf("Successfully expired VA %s on %s", va.AccountRef, va.Provider)
			successCount++
		}

		// Mark it expired locally
		va.Status = "expired"
		database.DB.Save(va)
	}

	fmt.Printf("\nCleanup complete! Processed %d orphaned VAs. %d physical expiration successful.\n", len(orphanedVAs), successCount)
}
