-- +goose Up
ALTER TABLE provider_configs ADD COLUMN environment VARCHAR(10) NOT NULL DEFAULT 'test';
ALTER TABLE provider_configs ADD COLUMN webhook_secret VARCHAR(255);
ALTER TABLE provider_configs DROP COLUMN test_secret_key;
ALTER TABLE provider_configs DROP COLUMN test_public_key;
ALTER TABLE provider_configs DROP COLUMN live_secret_key;
ALTER TABLE provider_configs DROP COLUMN live_public_key;
ALTER TABLE provider_configs DROP COLUMN test_webhook_secret;
ALTER TABLE provider_configs DROP COLUMN live_webhook_secret;

-- +goose Down
ALTER TABLE provider_configs DROP COLUMN environment;
ALTER TABLE provider_configs DROP COLUMN webhook_secret;
ALTER TABLE provider_configs ADD COLUMN test_secret_key VARCHAR(255);
ALTER TABLE provider_configs ADD COLUMN test_public_key VARCHAR(255);
ALTER TABLE provider_configs ADD COLUMN live_secret_key VARCHAR(255);
ALTER TABLE provider_configs ADD COLUMN live_public_key VARCHAR(255);
ALTER TABLE provider_configs ADD COLUMN test_webhook_secret VARCHAR(255);
ALTER TABLE provider_configs ADD COLUMN live_webhook_secret VARCHAR(255);
