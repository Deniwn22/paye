-- +goose Up
-- SQL in this section is executed when the migration is applied.

CREATE TABLE IF NOT EXISTS payment_providers (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    name VARCHAR(255) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    is_supported BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_payment_providers_deleted_at ON payment_providers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_payment_providers_is_supported ON payment_providers(is_supported);

-- Seed initial data (Nigerian payment providers only)
INSERT INTO payment_providers (id, created_at, updated_at, name, label, description, is_supported) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', NOW(), NOW(), 'paystack', 'Paystack', 'Popular African payment gateway supporting cards, bank transfers, USSD, and mobile money.', TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), NOW(), 'flutterwave', 'Flutterwave', 'Seamless payment routing across multiple African countries and payment methods.', TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', NOW(), NOW(), 'nomba', 'Nomba', 'Simplified payments and business tools for African businesses.', TRUE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', NOW(), NOW(), 'monnify', 'Monnify', 'Specialized bank transfer, virtual account, and card payments provider (Coming Soon).', FALSE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', NOW(), NOW(), 'opay', 'OPay', 'Leading mobile wallet and payment services provider in Nigeria (Coming Soon).', FALSE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', NOW(), NOW(), 'palmpay', 'PalmPay', 'High-growth fintech wallet and checkout service in Nigeria (Coming Soon).', FALSE),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', NOW(), NOW(), 'remita', 'Remita', 'Gateway supporting government and public sector electronic payments (Coming Soon).', FALSE)
ON CONFLICT (name) DO UPDATE SET
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    is_supported = EXCLUDED.is_supported;

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.
DROP TABLE IF EXISTS payment_providers CASCADE;
