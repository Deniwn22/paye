# Paye Reconciliation Architecture

Reconciliation in Paye is built on a "zero data loss" philosophy. Because we interface with multiple external payment providers (Flutterwave, Nomba, Paystack, OPay, etc.), network timeouts and missed webhooks are inevitable. Paye's architecture is designed to automatically detect, recover, and reconcile these discrepancies without manual intervention.

Here is a comprehensive breakdown of how Paye manages reconciliation across the system.

## 1. Webhook First-Logging (Zero Data Loss)
Before any webhook payload is processed, validated, or routed, it is immediately dumped into the `webhook_logs` database table. 
* **Why it matters:** If the server crashes during processing, or if there is a routing bug (like a signature failure), the raw data from the provider is never lost. The system always has a historical ledger of exactly what the provider sent.

## 2. Automated Reconciliation Workers
Paye utilizes a suite of background cron workers that constantly monitor the system for discrepancies. These workers are fully configurable via `.env` variables and can be started, stopped, or rescheduled without redeploying the application.

### A. Virtual Account Reconciliation (`ReconcileMissedVAWebhooks`)
Virtual Accounts (VAs) are prone to missed webhooks. This worker automatically:
1. Scans the `webhook_logs` table for any successful VA credit webhooks received in the last 24 hours.
2. Identifies any webhooks that exist in the logs but do not have a corresponding `VirtualAccountTransaction` in the ledger.
3. Automatically replays the raw payload through the `ProcessVAWebhook` engine.
4. **Idempotency:** Because the engine checks the transaction reference before saving, this worker is completely safe to run repeatedly. It will never duplicate a transaction.

### B. Checkout Transaction Poller (`PollPendingTransactions`)
For standard checkouts, if a user pays but the provider's webhook is delayed or dropped, the transaction might get stuck in a `pending` state. This worker:
1. Finds all transactions that have been `pending` for longer than a specific threshold.
2. Reaches out to the payment provider's API directly to verify the actual status of the transaction.
3. Updates the local database and fulfills the value if the provider confirms the payment was successful.

### C. Virtual Account Poller (`PollVirtualAccounts`)
Acts as a secondary fallback for Virtual Accounts, proactively polling providers for the latest ledger balances and un-synced transfers.

## 3. Misdirected Payments Ledger
When money is transferred to a Virtual Account that belongs to Paye, but the system cannot automatically credit the merchant (e.g., the VA was deleted, suspended, or the bank account number doesn't perfectly match), the money is not lost.
* The system catches the funds and records them in the `misdirected_payments` table.
* The status is marked as `unresolved` with a clear reason (e.g., `va_not_found`, `va_expired`).
* Administrators and Merchants can then review this ledger and manually route the funds to the correct destination or trigger a refund.

## 4. Real-Time Recovery Notifications
Reconciliation should not be a silent process. When the system detects and automatically recovers a missing transaction (for instance, the `ReconcileMissedVAWebhooks` worker recovers a dropped VA transfer), it immediately broadcasts a real-time WebSocket event to the frontend.

Merchants receive an instant toast notification:
> **"System Reconciliation: We noticed an unprocessed money, we have successfully recovered and processed it now!"**

This maintains high user trust by showing the merchants that the system is actively working to protect their funds.

## 5. Worker Configuration Guide
All reconciliation workers can be configured in your `.env` file:

```env
# Virtual Account Reconciliation (e.g. "*/30 * * * *" for every 30 mins)
WORKER_RECONCILE_VA_SCHEDULE="@hourly"
WORKER_RECONCILE_VA_STATUS="start"

# Pending Transactions Poller
WORKER_PENDING_TX_SCHEDULE="*/5 * * * *"
WORKER_PENDING_TX_STATUS="start"

# Virtual Account Fallback Poller
WORKER_POLL_VA_SCHEDULE="*/5 * * * *"
WORKER_POLL_VA_STATUS="start"
```
To temporarily disable any reconciliation process, simply set its status to `stop`.
