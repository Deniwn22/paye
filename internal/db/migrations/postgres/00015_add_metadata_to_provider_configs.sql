-- +goose Up
ALTER TABLE provider_configs ADD COLUMN IF NOT EXISTS metadata JSONB;

-- +goose Down
ALTER TABLE provider_configs DROP COLUMN IF EXISTS metadata;
