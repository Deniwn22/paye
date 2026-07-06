# Paye Virtual Accounts (VA)

Paye provides a unified, highly reliable Virtual Accounts API that abstracts away the complexities of interacting with multiple payment gateways. Whether you're using Nomba, Flutterwave, Paystack, or OPay, your integration remains exactly the same.

This guide covers how Virtual Accounts work under the hood, how migrations are handled, and how to track unified balances.

---

## 1. Provider Parity & Abstraction

In traditional integrations, switching from Paystack to Flutterwave means rewriting your Virtual Account logic. With Paye, you simply hit:

```http
POST /virtual-accounts
```

Paye automatically checks your **active environment provider** (configured in your dashboard) and provisions the account using that underlying gateway. The response payload is entirely standardized, meaning your frontend or backend logic never needs to change when you switch providers.

---

## 2. Dynamic & Static Accounts

Paye natively supports both static and dynamic accounts across all providers:

- **Static VAs:** Permanent accounts assigned to a customer for continuous top-ups or deposits.
- **Dynamic VAs:** Temporary accounts used for a single checkout session.
  - **Expected Amount:** You can define exactly how much should be paid.
  - **Expiring VAs:** You can set an `expiry_date`. Paye will automatically enforce this expiration and reject late payments via the **Misdirected Payments** queue.

---

## 3. Automatic VA Migration

One of Paye's most powerful features is **Automatic VA Migration**. 

### The Problem
If a business has 1,000 customers with active Virtual Accounts on Nomba, and the business decides to switch their active provider to Flutterwave, those 1,000 accounts would normally become obsolete, or the business would be forced to write a complex migration script.

### The Paye Solution
Paye handles this lazily and automatically via the `auto_migrate_vas` setting.

1. A business switches their active provider from Nomba to Flutterwave.
2. The next time the business requests a Virtual Account for an existing customer using their `customer_reference`, Paye detects the provider mismatch.
3. Paye safely marks the old Nomba account as `expired` locally.
4. Paye immediately provisions a brand new Virtual Account on Flutterwave for the customer and returns it.

*(Note: Any late payments made to the old expired account are caught by Paye and routed to a "Misdirected Payments" queue to ensure no funds are lost).*

---

## 4. Unified Tracking (`PayeVaID`)

When an account is migrated across providers, how do you track the total amount that customer has deposited over the lifetime of their relationship with you?

Paye solves this using the `paye_va_id`.

- When a Virtual Account is migrated, the new account inherits the `paye_va_id` of its predecessor.
- This creates a unified "chain" of Virtual Accounts for a single customer.

When you fetch a Virtual Account, Paye automatically aggregates the transactions across this chain and returns two powerful fields:

```json
{
  ...
  "total_received": 5000.00,
  "paye_va_id": "pva_12345",
  "paye_total_received": 25000.00,
  "paye_va_count": 3
}
```

- `total_received`: The amount deposited into *this specific* provider's Virtual Account.
- `paye_total_received`: The total amount deposited across *all 3* of this customer's migrated Virtual Accounts.
- `paye_va_count`: The number of times this account has been migrated/re-provisioned.

This allows businesses to seamlessly show customers their total lifetime balance without writing complex aggregation queries.

---

## 5. Manual Migration

If a business prefers not to use Lazy Auto-Migration, they can manually trigger a migration at any time using the dedicated migration endpoint:

```http
POST /virtual-accounts/:pvc_id/migrate
```

This endpoint will immediately expire the specified Virtual Account on its current provider, re-provision it on the currently active provider, and link them together using the same `paye_va_id`.

---

## 6. Dashboard & Analytics

The Paye Dashboard provides deep visibility into your Virtual Accounts. When fetching your Provider configurations via the API, Paye dynamically returns a `va_count` property. This allows developers to instantly see exactly how many active Virtual Accounts are attached to each payment gateway.
