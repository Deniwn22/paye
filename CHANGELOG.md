# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2026-07-12

### Added
- **Smart Payouts:** A unified `/transfers` endpoint that abstracts liquidity routing. Merchants request a payout, and Paye automatically queries virtual account balances across configured gateways to determine where the funds reside before routing the transfer to the correct provider.
- **Unified Customer Identity:** The `Customer` model now persists across all payment gateways. If a customer pays via Paystack today and Nomba tomorrow, Paye reconciles them into a single identity based on their email.
- **Customer Lifetime Value (LTV):** Automatically tracks and increments `TotalSpent` and `TransactionsCount` for a unified customer every time a transaction settles across any gateway.
- **Unified Subscriptions:** Paye now officially owns the Plan and Subscription resources natively.
- **Automatic Subscription Enrollment:** When initializing a checkout transaction, merchants can now pass a `PlanCode`. Upon successful payment and receipt of a tokenized card (`AuthorizationCode`), the backend automatically creates an active subscription.
- **JS SDK Optimization:** Completely eliminated the need for the frontend to manually call the `/sdk/subscriptions/create` endpoint. The SDK simply passes the `planId` during initialization, and the Paye backend handles the rest.



## [0.2.0] - 2026-07-06

### Added
- **Auto VA Migration:** Seamlessly transition Virtual Accounts between providers when switching the active gateway. Existing customers keep paying, but Paye quietly provisions them new accounts on the new provider.
- **Unified Paye VA Balances:** Introduces `paye_va_id` tracking, allowing businesses to view a combined `paye_total_received` balance across all migrated VAs for a single customer.
- **Dual Environments:** Full support for `test` and `live` environments separated by API keys (`paye_test_...` vs `paye_live_...`).
- **Webhook Environments:** Webhook configurations are now environment-aware. You can specify a separate Target URL for test webhooks and live webhooks.
- **Provider Parity:** Added support for Nomba and OPay alongside Paystack and Flutterwave.
- **Virtual Accounts (VA):** Introduced API and webhook integrations for provisioning and processing Virtual Accounts.
- **Flutterwave Virtual Accounts:** Added full support for provisioning Virtual Accounts and parsing `BANK_TRANSFER_TRANSACTION` webhooks natively using Flutterwave.
- **Dynamic Virtual Accounts:** Native support across both Nomba and Flutterwave to seamlessly provision dynamic, expiring, and expected-amount virtual accounts from a unified payload.
- **VA Pagination & Filtering:** `GET /virtual-accounts` now supports `page`, `limit`, and `provider` filtering, returning a standardized pagination `meta` object.
- **Dashboard VA Analytics:** Dashboard statistics now automatically count and report active virtual accounts for a project.
- **Misdirected Payments:** Safe handling and idempotent processing for webhooks regarding misdirected transfers.
- **Structured Logging:** Switched logging engine to `slog` for structured JSON logs.
- **Enterprise Background Workers:** Re-architected all background tasks into modular, configurable cron workers. You can dynamically set cron schedules or stop/start workers (`WORKER_SUBSCRIPTIONS`, `WORKER_PENDING_TX`, `WORKER_POLL_VA`) directly via the `.env` file without redeploying code.
- **Zero Data-Loss Reconciliation Worker:** Deployed a highly robust `ReconcileMissedVAWebhooks` automated worker. It continuously scans the raw `webhook_logs` to detect and safely replay any Virtual Account transactions that were skipped or dropped due to network issues or signature failures.
- **Real-Time Recovery Notifications:** When the reconciliation worker successfully auto-recovers missing funds from a dropped webhook, it instantly broadcasts a WebSocket alert to the merchant dashboard ("We noticed an unprocessed money...").
- **Dashboard Stats Refactoring:** Decoupled dashboard analytics from webhook logs, deriving total volume directly from `transactions` and `virtual_account_transactions` tables to ensure perfect accuracy.
- **Swagger Documentation Sandbox:** Overhauled docs UI to include an interactive Swagger Sandbox playground.
- **JS SDK & Inline Checkout:** Introduced dropping a `<script>` tag for instant checkouts with dynamic layout scaling.
- **Dynamic Account Balances:** API automatically calculates and returns a `total_received` field on Virtual Account payload models so frontend doesn't need to parse raw transactions manually.
- **Reporting & Statements:** Implemented a new internal reporting engine with endpoints for Level 2 Merchant Aggregator statements and Customer-Level Virtual Account statements.
- **PDF Generation:** Integrated `maroto/v2` to dynamically generate beautifully styled, branded PDF statements complete with the Paye logo and a verification stamp.
- **Swagger Branding:** Custom Paye logo is now statically served and embedded directly into the Swagger documentation headers.
### Changed
- **Unified Webhook Format:** Changed architecture to use unified routing for webhooks via Paye proxy slugs, validating signatures before forwarding.
- **Provider Registry:** Switched from static configs to a dynamic registry of payment providers with database persistence and goose SQL migrations.
- **Automatic Provider Resolution:** Removed `provider` requirement from transactions. Transactions now dynamically fetch the active provider based on environment mode.
- **Active Provider Constraint:** Enforced single-active-provider constraint per environment. Toggling one provider deactivates the previously active one.

### Fixed
- **Signature Verification:** Skipped legacy key verification for live mode on webhooks.
- **Dashboard Alignment:** Fixed `test`/`live` mode isolation correctly mapping across the JS SDK and the merchant dashboard.
- **Virtual Account Auth:** Resolved Nomba 403 errors by properly mapping the golden Parent Account ID header vs SubAccount query scopes.
- **Polling Loop Bugs:** Fixed endless polling loops for abandoned checkouts by auto-marking pending checkouts as `abandoned` if unresolved after 1 hour.
- **Cron Db Errors:** Gracefully handled duplicate key constraints (`SQLSTATE 23505`) via UPSERT logic when cron jobs poll for already-logged Virtual Account transfers.
- **Webhook Drift Parsing:** Resolved a bug where Nomba webhooks were dropped due to strict `string` parsing of native decimal floats (`WalletBalance`).
- **Missing Documentation:** Filled in strict DTO schemas and mapped missing endpoints (like Virtual Account transaction lists) for Swagger generation.

---

## [Initial Release]
- **Core Architecture:** Paystack initial implementation, Database connection, Gin Web Server, AES-256-GCM crypto utility.
- **Auth Layer:** JWT middleware, password hashing, API key generation.
- **Transaction Layer:** Initialize, verify, and status tracking for payments.
- **Dashboard Analytics:** Webhook delivery logs and payment volume tracking.
