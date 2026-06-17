-- +goose Up
-- SQL in this section is executed when the migration is applied.

CREATE TABLE IF NOT EXISTS payment_providers (
    id TEXT PRIMARY KEY,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    name TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    is_supported INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_payment_providers_deleted_at ON payment_providers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_payment_providers_is_supported ON payment_providers(is_supported);

-- Seed initial data (Nigerian payment providers only)
INSERT OR IGNORE INTO payment_providers (id, created_at, updated_at, name, label, description, is_supported) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'paystack', 'Paystack', 'Popular African payment gateway supporting cards, bank transfers, USSD, and mobile money.', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'flutterwave', 'Flutterwave', 'Seamless payment routing across multiple African countries and payment methods.', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'nomba', 'Nomba', 'Simplified payments and business tools for African businesses.', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'monnify', 'Monnify', 'Specialized bank transfer, virtual account, and card payments provider (Coming Soon).', 0),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'opay', 'OPay', 'Leading mobile wallet and payment services provider in Nigeria (Coming Soon).', 0),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'palmpay', 'PalmPay', 'High-growth fintech wallet and checkout service in Nigeria (Coming Soon).', 0),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'remita', 'Remita', 'Gateway supporting government and public sector electronic payments (Coming Soon).', 0);

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
DROP TABLE IF EXISTS payment_providers;
