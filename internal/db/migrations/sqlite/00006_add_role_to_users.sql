-- +goose Up
-- SQL in this section is executed when the migration is applied.
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'merchant';

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
