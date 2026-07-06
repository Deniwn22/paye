package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/ttomsin/paye/internal/features/virtual_accounts"
	"github.com/ttomsin/paye/internal/features/webhooks"
	"github.com/ttomsin/paye/internal/models"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	gormLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	db, err := gorm.Open(postgres.Open(dbURL), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	webhookRepo := webhooks.NewWebhookRepo(db)
	vaRepo := virtual_accounts.NewVARepository(db)

	// We pass nil for notifier to avoid spamming websockets during bulk replay.
	// If you want live notifications during replay, you can instantiate the Pusher notifier here.
	webhookService := webhooks.NewWebhookService(webhookRepo, vaRepo, nil, nil, "", nil)

	ctx := context.Background()

	// 1. Fetch all WebhookLogs
	// Since there could be many, we fetch them in batches or just load them all if not huge.
	var logs []models.WebhookLog
	if err := db.Find(&logs).Error; err != nil {
		log.Fatalf("Failed to fetch webhook logs: %v", err)
	}

	log.Printf("Found %d total webhook logs. Scanning for missed VA webhooks...", len(logs))

	processedCount := 0
	skippedCount := 0

	for _, wl := range logs {
		// Filter 1: Check if payload is a VA webhook
		isVA := false

		// Check Nomba payload
		var nombaPayload struct {
			Data struct {
				Transaction struct {
					Type string `json:"type"`
				} `json:"transaction"`
			} `json:"data"`
		}
		if err := json.Unmarshal([]byte(wl.Payload), &nombaPayload); err == nil && nombaPayload.Data.Transaction.Type == "vact_transfer" {
			isVA = true
		}

		// Check Flutterwave payload
		var fwPayload struct {
			EventTypeFW string `json:"event.type"`
		}
		if err := json.Unmarshal([]byte(wl.Payload), &fwPayload); err == nil && fwPayload.EventTypeFW == "BANK_TRANSFER_TRANSACTION" {
			isVA = true
		}

		// If it's a VA webhook, replay it
		if isVA {
			if wl.WebhookConfigID == nil {
				log.Printf("Skipping log %s: WebhookConfigID is nil", wl.ID)
				continue
			}

			// Get the webhook config
			wc, err := webhookRepo.FindByID(ctx, wl.WebhookConfigID.String(), wl.ProjectID.String())
			if err != nil {
				log.Printf("Skipping log %s: failed to load config: %v", wl.ID, err)
				continue
			}

			log.Printf("Replaying VA Webhook Log ID: %s (Ref: %s)", wl.ID, wl.Reference)

			// Process it
			err = webhookService.ProcessVAWebhook(ctx, wc, []byte(wl.Payload), wl.IsLive)
			if err != nil {
				log.Printf("  -> Result: %v (Usually means already processed or VA not found)", err)
				skippedCount++
			} else {
				log.Printf("  -> Successfully recovered and processed VA transaction!")
				processedCount++
			}
		}
	}

	log.Printf("Replay Complete! Successfully recovered %d missing transactions. Skipped %d.", processedCount, skippedCount)
}
