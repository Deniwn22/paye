-- +goose Up
-- SQL in this section is executed when the migration is applied.
ALTER TABLE webhook_configs ADD COLUMN environment TEXT NOT NULL DEFAULT 'test';
ALTER TABLE webhook_configs DROP CONSTRAINT IF EXISTS uq_webhook_config_project_provider;
ALTER TABLE webhook_configs ADD CONSTRAINT uq_webhook_config_project_provider_env UNIQUE (project_id, provider_name, environment);

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
ALTER TABLE webhook_configs DROP CONSTRAINT IF EXISTS uq_webhook_config_project_provider_env;
ALTER TABLE webhook_configs ADD CONSTRAINT uq_webhook_config_project_provider UNIQUE (project_id, provider_name);
ALTER TABLE webhook_configs DROP COLUMN IF EXISTS environment;
