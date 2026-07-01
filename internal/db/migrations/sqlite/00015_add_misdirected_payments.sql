-- +goose Up
-- +goose StatementBegin
CREATE TABLE misdirected_payments (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    
    project_id TEXT,
    bank_account_number TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT,
    sender_name TEXT,
    sender_account TEXT,
    sender_bank TEXT,
    reference TEXT NOT NULL UNIQUE,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'unresolved',
    provider TEXT,
    is_live BOOLEAN DEFAULT 0
);

CREATE INDEX idx_misdirected_payments_project_id ON misdirected_payments(project_id);
CREATE INDEX idx_misdirected_payments_bank_account_number ON misdirected_payments(bank_account_number);
CREATE INDEX idx_misdirected_payments_deleted_at ON misdirected_payments(deleted_at);
CREATE INDEX idx_misdirected_payments_is_live ON misdirected_payments(is_live);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE misdirected_payments;
-- +goose StatementEnd
