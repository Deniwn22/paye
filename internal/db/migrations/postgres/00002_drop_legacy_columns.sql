-- +goose Up
-- SQL in this section is executed when the migration is applied.

ALTER TABLE users DROP COLUMN IF EXISTS api_key;
ALTER TABLE users DROP COLUMN IF EXISTS test_api_key;
ALTER TABLE users DROP COLUMN IF EXISTS test_public_id;

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
