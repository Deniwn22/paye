-- +goose Up
-- SQL in this section is executed when the migration is applied.
ALTER TABLE webhook_configs ADD CONSTRAINT uq_webhook_config_project_provider UNIQUE (project_id, provider_name);

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
ALTER TABLE webhook_configs DROP CONSTRAINT IF EXISTS uq_webhook_config_project_provider;
