# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Dual Environments:** Full support for `test` and `live` environments separated by API keys (`paye_test_...` vs `paye_live_...`).
- **Webhook Environments:** Webhook configurations are now environment-aware. You can specify a separate Target URL for test webhooks and live webhooks, preventing accidental data mixing.
- **Provider Parity:** Added support for Nomba and OPay as new payment providers.
- **Virtual Accounts:** Introduced virtual account creation and webhook processing.

### Changed
- **Automatic Provider Resolution:** The `provider` field is no longer required or accepted when initializing a transaction. Paye now automatically resolves the single active provider for the project based on the environment (test/live) making the API request.
- **Single Active Provider Constraint:** Enforced a constraint that only one provider can be active per environment (test/live) at any given time. Toggling a new provider to "active" automatically deactivates the previously active one.
- **Webhook Logs:** Dashboard logs now display the `environment` and `provider_name` for full transparency, making it easy to identify where a log originated.

### Removed
- Removed the `provider` field from the `/api/v1/transactions/initialize` endpoint request payload.
