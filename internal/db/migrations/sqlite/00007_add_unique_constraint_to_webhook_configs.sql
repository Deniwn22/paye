-- +goose Up
-- SQL in this section is executed when the migration is applied.
CREATE UNIQUE INDEX IF NOT EXISTS uq_webhook_config_project_provider ON webhook_configs (project_id, provider_name);

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
DROP INDEX IF EXISTS uq_webhook_config_project_provider;
