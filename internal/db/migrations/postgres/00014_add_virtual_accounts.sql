-- +goose Up
-- SQL in this section is executed when the migration is applied.

ALTER TABLE webhook_configs ADD COLUMN type VARCHAR(20) DEFAULT 'payment' NOT NULL;

CREATE TABLE virtual_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    pvc_id VARCHAR(255) NOT NULL UNIQUE,
    project_id UUID NOT NULL,
    customer_reference VARCHAR(255) NOT NULL,
    account_ref VARCHAR(255) NOT NULL UNIQUE,
    account_name VARCHAR(255) NOT NULL,
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(255) NOT NULL,
    bank_account_name VARCHAR(255),
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    provider VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'static',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    expected_amount NUMERIC(15,2),
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_live BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_virtual_accounts_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_virtual_accounts_deleted_at ON virtual_accounts(deleted_at);
CREATE INDEX idx_virtual_accounts_pvc_id ON virtual_accounts(pvc_id);
CREATE INDEX idx_virtual_accounts_project_id ON virtual_accounts(project_id);
CREATE INDEX idx_virtual_accounts_customer_reference ON virtual_accounts(customer_reference);
CREATE INDEX idx_virtual_accounts_is_live ON virtual_accounts(is_live);

CREATE TABLE virtual_account_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    virtual_account_id UUID NOT NULL,
    project_id UUID NOT NULL,
    pvc_id VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    sender_name VARCHAR(255),
    sender_account VARCHAR(255),
    sender_bank VARCHAR(255),
    reference VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'success',
    provider VARCHAR(255) NOT NULL,
    is_live BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_vat_virtual_account FOREIGN KEY (virtual_account_id) REFERENCES virtual_accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_vat_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_vat_deleted_at ON virtual_account_transactions(deleted_at);
CREATE INDEX idx_vat_virtual_account_id ON virtual_account_transactions(virtual_account_id);
CREATE INDEX idx_vat_project_id ON virtual_account_transactions(project_id);
CREATE INDEX idx_vat_pvc_id ON virtual_account_transactions(pvc_id);
CREATE INDEX idx_vat_is_live ON virtual_account_transactions(is_live);


-- +goose Down
-- SQL in this section is executed when the migration is rolled back.

DROP TABLE IF EXISTS virtual_account_transactions;
DROP TABLE IF EXISTS virtual_accounts;
ALTER TABLE webhook_configs DROP COLUMN type;
