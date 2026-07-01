-- +goose Up
ALTER TABLE provider_configs
ADD COLUMN IF NOT EXISTS environment VARCHAR(10) NOT NULL DEFAULT 'test',
ADD COLUMN IF NOT EXISTS webhook_secret VARCHAR(255),
DROP COLUMN IF EXISTS test_secret_key,
DROP COLUMN IF EXISTS test_public_key,
DROP COLUMN IF EXISTS live_secret_key,
DROP COLUMN IF EXISTS live_public_key,
DROP COLUMN IF EXISTS test_webhook_secret,
DROP COLUMN IF EXISTS live_webhook_secret;

-- +goose Down
ALTER TABLE provider_configs
DROP COLUMN IF EXISTS environment,
DROP COLUMN IF EXISTS webhook_secret,
ADD COLUMN IF NOT EXISTS test_secret_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS test_public_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS live_secret_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS live_public_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS test_webhook_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS live_webhook_secret VARCHAR(255);
