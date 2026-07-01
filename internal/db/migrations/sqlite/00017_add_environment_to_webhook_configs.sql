-- +goose Up
-- SQL in this section is executed when the migration is applied.
ALTER TABLE webhook_configs ADD COLUMN environment TEXT NOT NULL DEFAULT 'test';
DROP INDEX IF EXISTS uq_webhook_config_project_provider;
CREATE UNIQUE INDEX IF NOT EXISTS uq_webhook_config_project_provider_env ON webhook_configs (project_id, provider_name, environment);

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
DROP INDEX IF EXISTS uq_webhook_config_project_provider_env;
CREATE UNIQUE INDEX IF NOT EXISTS uq_webhook_config_project_provider ON webhook_configs (project_id, provider_name);
ALTER TABLE webhook_configs DROP COLUMN environment;
