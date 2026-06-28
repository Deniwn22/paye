-- +goose Up
-- SQL in this section is executed when the migration is applied.
ALTER TABLE provider_configs ADD COLUMN test_webhook_secret TEXT;
ALTER TABLE provider_configs ADD COLUMN live_webhook_secret TEXT;

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
ALTER TABLE provider_configs DROP COLUMN test_webhook_secret;
ALTER TABLE provider_configs DROP COLUMN live_webhook_secret;
