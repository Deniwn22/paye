package db

import (
	"embed"
	"fmt"
	"log/slog"

	"github.com/pressly/goose/v3"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

//go:embed migrations/**/*.sql
var embedMigrations embed.FS

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
	return RunMigrations(db.DB)
}

func RunMigrations(gormDB *gorm.DB) error {
	sqlDB, err := gormDB.DB()
	if err != nil {
		return fmt.Errorf("failed to get sql.DB from gorm: %w", err)
	}

	goose.SetBaseFS(embedMigrations)

	dialect := "postgres"
	migrationDir := "migrations/postgres"

	driverName := gormDB.Dialector.Name()
	if driverName == "sqlite" || driverName == "sqlite3" {
		dialect = "sqlite3"
		migrationDir = "migrations/sqlite"
	}

	goose.SetLogger(goose.NopLogger())

	if err := goose.SetDialect(dialect); err != nil {
		return fmt.Errorf("failed to set goose dialect: %w", err)
	}

	slog.Info("Running database migrations using goose", "dialect", dialect, "dir", migrationDir)
	if err := goose.Up(sqlDB, migrationDir); err != nil {
		return fmt.Errorf("goose up failed: %w", err)
	}

	return nil
}
