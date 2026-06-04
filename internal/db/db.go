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
	return db.DB.AutoMigrate(&models.User{}, &models.ProviderConfig{}, &models.WebhookConfig{}, &models.WebhookLog{}, &models.Transaction{})
}
