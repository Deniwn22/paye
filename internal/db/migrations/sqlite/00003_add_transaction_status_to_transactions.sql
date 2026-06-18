-- +goose Up
-- SQL in this section is executed when the migration is applied.
ALTER TABLE transactions ADD COLUMN transaction_status TEXT;

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
