-- +goose Up
ALTER TABLE transactions ALTER COLUMN auth_url TYPE TEXT;

-- +goose Down
ALTER TABLE transactions ALTER COLUMN auth_url TYPE VARCHAR(255);
