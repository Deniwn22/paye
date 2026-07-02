# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Dual Environments:** Full support for `test` and `live` environments separated by API keys (`paye_test_...` vs `paye_live_...`).
- **Webhook Environments:** Webhook configurations are now environment-aware. You can specify a separate Target URL for test webhooks and live webhooks.
- **Provider Parity:** Added support for Nomba and OPay alongside Paystack and Flutterwave.
- **Virtual Accounts (VA):** Introduced API and webhook integrations for provisioning and processing Virtual Accounts.
- **Misdirected Payments:** Safe handling and idempotent processing for webhooks regarding misdirected transfers.
- **Structured Logging:** Switched logging engine to `slog` for structured JSON logs.
- **Background Polling:** Added scheduled background jobs for polling transaction statuses on pending checkouts and serving as a fallback for missed Virtual Account webhooks.
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
