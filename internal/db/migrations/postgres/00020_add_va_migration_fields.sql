-- +goose Up
-- +goose StatementBegin
ALTER TABLE projects ADD COLUMN auto_migrate_vas BOOLEAN DEFAULT false;

ALTER TABLE virtual_accounts ADD COLUMN paye_va_id VARCHAR(255) DEFAULT '';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE virtual_accounts DROP COLUMN paye_va_id;

ALTER TABLE projects DROP COLUMN auto_migrate_vas;
-- +goose StatementEnd
