-- +goose Up
ALTER TABLE provider_configs ADD COLUMN metadata TEXT;

-- +goose Down
ALTER TABLE provider_configs DROP COLUMN metadata;
