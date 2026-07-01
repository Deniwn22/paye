-- +goose Up
-- +goose StatementBegin
CREATE TABLE misdirected_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    project_id UUID,
    bank_account_number VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10),
    sender_name VARCHAR(255),
    sender_account VARCHAR(255),
    sender_bank VARCHAR(255),
    reference VARCHAR(255) NOT NULL UNIQUE,
    reason VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'unresolved',
    provider VARCHAR(100),
    is_live BOOLEAN DEFAULT false
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
