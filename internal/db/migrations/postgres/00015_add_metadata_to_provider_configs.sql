-- +goose Up
ALTER TABLE provider_configs ADD COLUMN metadata JSONB;

-- +goose Down
ALTER TABLE provider_configs DROP COLUMN metadata;
