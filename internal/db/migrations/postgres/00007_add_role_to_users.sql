-- +goose Up
-- SQL in this section is executed when the migration is applied.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(255) DEFAULT 'merchant';

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
ALTER TABLE users DROP COLUMN IF EXISTS role;
