package db

import (
	"github.com/ttomsin/paye/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type DB struct {
	*gorm.DB
}

func newDB(db *gorm.DB) *DB {
	return &DB{db}
}

// Connect establishes a connection to the database using the provided DSN and returns a DB instance.
// we use postgres as the database and provider
func Connect(dsn string) (*DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	return newDB(db), nil
}

func Migrate(db *DB) error {
	// Clean up legacy columns on users table if they exist to prevent not-null constraint violations
	migrator := db.DB.Migrator()
	if migrator.HasColumn(&models.User{}, "api_key") {
		_ = migrator.DropColumn(&models.User{}, "api_key")
	}
	if migrator.HasColumn(&models.User{}, "test_api_key") {
		_ = migrator.DropColumn(&models.User{}, "test_api_key")
	}
	if migrator.HasColumn(&models.User{}, "test_public_id") {
		_ = migrator.DropColumn(&models.User{}, "test_public_id")
	}

	return db.DB.AutoMigrate(
		&models.User{},
		&models.Project{},
		&models.ProviderConfig{},
		&models.WebhookConfig{},
		&models.WebhookLog{},
		&models.Transaction{},
		&models.Refund{},
		&models.TransferRecipient{},
		&models.Transfer{},
		&models.Plan{},
		&models.Subscription{},
	)
}
