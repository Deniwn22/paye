-- +goose Up
-- SQL in this section is executed when the migration is applied.

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    public_id VARCHAR(255) UNIQUE NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    public_id VARCHAR(255) UNIQUE NOT NULL,
    test_api_key VARCHAR(255) UNIQUE,
    test_public_id VARCHAR(255) UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_api_key ON projects(api_key);
CREATE INDEX IF NOT EXISTS idx_projects_public_id ON projects(public_id);
CREATE INDEX IF NOT EXISTS idx_projects_test_api_key ON projects(test_api_key);
CREATE INDEX IF NOT EXISTS idx_projects_test_public_id ON projects(test_public_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

CREATE TABLE IF NOT EXISTS provider_configs (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    label VARCHAR(255) NOT NULL,
    provider_name VARCHAR(255),
    secret_key VARCHAR(255),
    public_key VARCHAR(255),
    test_secret_key VARCHAR(255),
    test_public_key VARCHAR(255),
    live_secret_key VARCHAR(255),
    live_public_key VARCHAR(255),
    is_active BOOLEAN,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_provider_configs_deleted_at ON provider_configs(deleted_at);

CREATE TABLE IF NOT EXISTS webhook_configs (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    provider_name VARCHAR(255),
    target_url VARCHAR(255),
    paye_webhook_slug VARCHAR(255) UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_deleted_at ON webhook_configs(deleted_at);

CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    webhook_config_id UUID REFERENCES webhook_configs(id) ON DELETE SET NULL,
    event VARCHAR(255) NOT NULL,
    reference VARCHAR(255),
    amount NUMERIC,
    status VARCHAR(255),
    forwarded_status INTEGER,
    error_message TEXT,
    payload TEXT,
    is_live BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_deleted_at ON webhook_logs(deleted_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_project_id ON webhook_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_is_live ON webhook_logs(is_live);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    provider VARCHAR(255) NOT NULL,
    reference VARCHAR(255) UNIQUE NOT NULL,
    amount NUMERIC NOT NULL,
    currency VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(255) DEFAULT 'pending',
    auth_url VARCHAR(255),
    authorization_code VARCHAR(255),
    metadata JSONB,
    raw_response TEXT,
    is_live BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON transactions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_is_live ON transactions(is_live);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    transaction_reference VARCHAR(255) NOT NULL,
    amount NUMERIC NOT NULL,
    currency VARCHAR(255) NOT NULL,
    customer_note VARCHAR(255),
    merchant_note VARCHAR(255),
    status VARCHAR(255) DEFAULT 'pending',
    raw_response TEXT,
    is_live BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_refunds_deleted_at ON refunds(deleted_at);
CREATE INDEX IF NOT EXISTS idx_refunds_project_id ON refunds(project_id);
CREATE INDEX IF NOT EXISTS idx_refunds_transaction_reference ON refunds(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_refunds_is_live ON refunds(is_live);

CREATE TABLE IF NOT EXISTS transfer_recipients (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    account_number VARCHAR(255) NOT NULL,
    bank_code VARCHAR(255) NOT NULL,
    currency VARCHAR(255) NOT NULL,
    recipient_code VARCHAR(255) UNIQUE NOT NULL,
    provider VARCHAR(255) NOT NULL,
    is_live BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_transfer_recipients_deleted_at ON transfer_recipients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_transfer_recipients_project_id ON transfer_recipients(project_id);
CREATE INDEX IF NOT EXISTS idx_transfer_recipients_recipient_code ON transfer_recipients(recipient_code);
CREATE INDEX IF NOT EXISTS idx_transfer_recipients_is_live ON transfer_recipients(is_live);

CREATE TABLE IF NOT EXISTS transfers (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    recipient_code VARCHAR(255) NOT NULL,
    amount NUMERIC NOT NULL,
    currency VARCHAR(255) NOT NULL,
    reason VARCHAR(255),
    reference VARCHAR(255) UNIQUE NOT NULL,
    transfer_code VARCHAR(255),
    status VARCHAR(255) DEFAULT 'pending',
    provider VARCHAR(255) NOT NULL,
    is_live BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_transfers_deleted_at ON transfers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_transfers_project_id ON transfers(project_id);
CREATE INDEX IF NOT EXISTS idx_transfers_recipient_code ON transfers(recipient_code);
CREATE INDEX IF NOT EXISTS idx_transfers_reference ON transfers(reference);
CREATE INDEX IF NOT EXISTS idx_transfers_transfer_code ON transfers(transfer_code);
CREATE INDEX IF NOT EXISTS idx_transfers_is_live ON transfers(is_live);

CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    plan_code VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    amount NUMERIC NOT NULL,
    "interval" VARCHAR(255) NOT NULL,
    currency VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    provider VARCHAR(255) NOT NULL,
    is_live BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_plans_deleted_at ON plans(deleted_at);
CREATE INDEX IF NOT EXISTS idx_plans_project_id ON plans(project_id);
CREATE INDEX IF NOT EXISTS idx_plans_plan_code ON plans(plan_code);
CREATE INDEX IF NOT EXISTS idx_plans_is_live ON plans(is_live);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    subscription_code VARCHAR(255) UNIQUE NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    plan_code VARCHAR(255) NOT NULL,
    status VARCHAR(255) DEFAULT 'active',
    "authorization" VARCHAR(255),
    start_date TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    provider VARCHAR(255) NOT NULL,
    is_live BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_deleted_at ON subscriptions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_project_id ON subscriptions(project_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_code ON subscriptions(subscription_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_email ON subscriptions(customer_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_code ON subscriptions(plan_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_live ON subscriptions(is_live);

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.

DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS transfer_recipients CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS webhook_configs CASCADE;
DROP TABLE IF EXISTS provider_configs CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;
