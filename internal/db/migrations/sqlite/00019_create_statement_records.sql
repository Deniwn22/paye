-- +goose Up
-- +goose StatementBegin
CREATE TABLE statement_records (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    entity_id TEXT,
    total_volume REAL NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_live BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE INDEX idx_statement_records_project_id ON statement_records(project_id);
CREATE INDEX idx_statement_records_entity_id ON statement_records(entity_id);
CREATE INDEX idx_statement_records_deleted_at ON statement_records(deleted_at);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE statement_records;
-- +goose StatementEnd
