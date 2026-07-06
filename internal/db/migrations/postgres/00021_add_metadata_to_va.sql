-- +goose Up
-- +goose StatementBegin
ALTER TABLE virtual_accounts ADD COLUMN metadata JSONB;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE virtual_accounts DROP COLUMN metadata;
-- +goose StatementEnd
