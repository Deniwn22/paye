-- +goose Up
DELETE FROM webhook_configs WHERE deleted_at IS NOT NULL;

-- +goose Down
