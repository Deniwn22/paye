-- +goose Up
-- SQL in this section is executed when the migration is applied.

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    public_id TEXT UNIQUE NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    name TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    public_id TEXT UNIQUE NOT NULL,
    test_api_key TEXT UNIQUE,
    test_public_id TEXT UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_api_key ON projects(api_key);
CREATE INDEX IF NOT EXISTS idx_projects_public_id ON projects(public_id);
CREATE INDEX IF NOT EXISTS idx_projects_test_api_key ON projects(test_api_key);
CREATE INDEX IF NOT EXISTS idx_projects_test_public_id ON projects(test_public_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

CREATE TABLE IF NOT EXISTS provider_configs (
    id TEXT PRIMARY KEY,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    label TEXT NOT NULL,
    provider_name TEXT,
    secret_key TEXT,
    public_key TEXT,
    test_secret_key TEXT,
    test_public_key TEXT,
    live_secret_key TEXT,
    live_public_key TEXT,
    is_active INTEGER,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_provider_configs_deleted_at ON provider_configs(deleted_at);

CREATE TABLE IF NOT EXISTS webhook_configs (
    id TEXT PRIMARY KEY,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    provider_name TEXT,
    target_url TEXT,
    paye_webhook_slug TEXT UNIQUE NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_deleted_at ON webhook_configs(deleted_at);

CREATE TABLE IF NOT EXISTS webhook_logs (
    id TEXT PRIMARY KEY,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    webhook_config_id TEXT REFERENCES webhook_configs(id) ON DELETE SET NULL,
    event TEXT NOT NULL,
    reference TEXT,
    amount REAL,
    status TEXT,
    forwarded_status INTEGER,
    error_message TEXT,
    payload TEXT,
    is_live INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_deleted_at ON webhook_logs(deleted_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_project_id ON webhook_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_is_live ON webhook_logs(is_live);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    reference TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    auth_url TEXT,
    authorization_code TEXT,
    metadata TEXT,
    raw_response TEXT,
    is_live INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON transactions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_is_live ON transactions(is_live);

CREATE TABLE IF NOT EXISTS refunds (
    id TEXT PRIMARY KEY,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    transaction_reference TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    customer_note TEXT,
    merchant_note TEXT,
    status TEXT DEFAULT 'pending',
    raw_response TEXT,
    is_live INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_refunds_deleted_at ON refunds(deleted_at);
CREATE INDEX IF NOT EXISTS idx_refunds_project_id ON refunds(project_id);
CREATE INDEX IF NOT EXISTS idx_refunds_transaction_reference ON refunds(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_refunds_is_live ON refunds(is_live);

CREATE TABLE IF NOT EXISTS transfer_recipients (
    id TEXT PRIMARY KEY,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    bank_code TEXT NOT NULL,
    currency TEXT NOT NULL,
    recipient_code TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL,
    is_live INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_transfer_recipients_deleted_at ON transfer_recipients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_transfer_recipients_project_id ON transfer_recipients(project_id);
CREATE INDEX IF NOT EXISTS idx_transfer_recipients_recipient_code ON transfer_recipients(recipient_code);
CREATE INDEX IF NOT EXISTS idx_transfer_recipients_is_live ON transfer_recipients(is_live);

CREATE TABLE IF NOT EXISTS transfers (
    id TEXT PRIMARY KEY,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    recipient_code TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    reason TEXT,
    reference TEXT UNIQUE NOT NULL,
    transfer_code TEXT,
    status TEXT DEFAULT 'pending',
    provider TEXT NOT NULL,
    is_live INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_transfers_deleted_at ON transfers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_transfers_project_id ON transfers(project_id);
CREATE INDEX IF NOT EXISTS idx_transfers_recipient_code ON transfers(recipient_code);
CREATE INDEX IF NOT EXISTS idx_transfers_reference ON transfers(reference);
CREATE INDEX IF NOT EXISTS idx_transfers_transfer_code ON transfers(transfer_code);
CREATE INDEX IF NOT EXISTS idx_transfers_is_live ON transfers(is_live);

CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    plan_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    interval TEXT NOT NULL,
    currency TEXT NOT NULL,
    description TEXT,
    provider TEXT NOT NULL,
    is_live INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_plans_deleted_at ON plans(deleted_at);
CREATE INDEX IF NOT EXISTS idx_plans_project_id ON plans(project_id);
CREATE INDEX IF NOT EXISTS idx_plans_plan_code ON plans(plan_code);
CREATE INDEX IF NOT EXISTS idx_plans_is_live ON plans(is_live);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    subscription_code TEXT UNIQUE NOT NULL,
    customer_email TEXT NOT NULL,
    plan_code TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    authorization TEXT,
    start_date DATETIME,
    next_billing_date DATETIME,
    provider TEXT NOT NULL,
    is_live INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_deleted_at ON subscriptions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_project_id ON subscriptions(project_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_code ON subscriptions(subscription_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_email ON subscriptions(customer_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_code ON subscriptions(plan_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_live ON subscriptions(is_live);

-- +goose Down
-- SQL in this section is executed when the migration is rolled back.

DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS plans;
DROP TABLE IF EXISTS transfers;
DROP TABLE IF EXISTS transfer_recipients;
DROP TABLE IF EXISTS refunds;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS webhook_logs;
DROP TABLE IF EXISTS webhook_configs;
DROP TABLE IF EXISTS provider_configs;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
