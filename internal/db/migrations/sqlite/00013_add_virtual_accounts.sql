-- +goose Up
-- SQL in this section is executed when the migration is applied.

ALTER TABLE webhook_configs ADD COLUMN type TEXT NOT NULL DEFAULT 'payment';

CREATE TABLE IF NOT EXISTS virtual_accounts (
    id TEXT PRIMARY KEY,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    deleted_at DATETIME,
    pvc_id TEXT NOT NULL UNIQUE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    customer_reference TEXT NOT NULL,
    account_ref TEXT NOT NULL UNIQUE,
    account_name TEXT NOT NULL,
    bank_name TEXT,
    bank_account_number TEXT NOT NULL,
    bank_account_name TEXT,
    currency TEXT NOT NULL DEFAULT 'NGN',
    provider TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'static',
    status TEXT NOT NULL DEFAULT 'active',
    expected_amount REAL,
    expiry_date DATETIME,
    is_live INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_virtual_accounts_deleted_at ON virtual_accounts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_pvc_id ON virtual_accounts(pvc_id);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_project_id ON virtual_accounts(project_id);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_customer_reference ON virtual_accounts(customer_reference);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_is_live ON virtual_accounts(is_live);

CREATE TABLE IF NOT EXISTS virtual_account_transactions (
    id TEXT PRIMARY KEY,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    deleted_at DATETIME,
    virtual_account_id TEXT NOT NULL REFERENCES virtual_accounts(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    pvc_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    sender_name TEXT,
    sender_account TEXT,
    sender_bank TEXT,
    reference TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'success',
    provider TEXT NOT NULL,
    is_live INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_vat_deleted_at ON virtual_account_transactions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_vat_virtual_account_id ON virtual_account_transactions(virtual_account_id);
CREATE INDEX IF NOT EXISTS idx_vat_project_id ON virtual_account_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_vat_pvc_id ON virtual_account_transactions(pvc_id);
CREATE INDEX IF NOT EXISTS idx_vat_is_live ON virtual_account_transactions(is_live);


-- +goose Down
-- SQL in this section is executed when the migration is rolled back.

DROP TABLE IF EXISTS virtual_account_transactions;
DROP TABLE IF EXISTS virtual_accounts;
ALTER TABLE webhook_configs DROP COLUMN type;
