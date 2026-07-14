# Paye: New Features & Integration Guide

This guide is intended for the frontend and docs teams to update the official Paye documentation. It outlines the three major "Paye Philosophy" features recently added to the platform.

---

## 1. Unified Customer Identity & Lifetime Value (LTV)

Previously, if a customer checked out via Paystack on Monday and Nomba on Friday, they appeared as two separate customers. Paye now implements a **Unified Customer Identity**.

### How it works:
- Paye acts as the single source of truth. We track customers by their `Email` (and dynamically merge their identity regardless of the payment gateway used).
- **Lifetime Value (LTV):** Every time a transaction successfully settles (via any provider), Paye automatically increments the customer's `TotalSpent` and `TransactionsCount`.
- **Environment Isolation:** Customer data is strictly isolated between `test` and `live` modes. 

### What the Frontend Dev needs to know:
- **Endpoints:** You can fetch a project's customers via `GET /api/v1/customers`.
- **Response Data:** The customer object now reliably returns `total_spent` (LTV) and `transactions_count`. This is highly valuable data to display on the Merchant Dashboard!

---

## 2. Unified Subscriptions

Merchants typically have to write entirely different subscription logic depending on whether they use Paystack's subscription API or Flutterwave's subscription API. Paye abstracts this completely. **Paye owns the Plan and the Subscription.**

### How it works:
- Merchants create a "Paye Plan" (`POST /api/v1/plans`).
- When a customer checks out, the merchant simply includes the `plan_code` in the transaction initialization.
- Upon a successful transaction, the provider returns an `AuthorizationCode` (a tokenized card). Paye intercepts this and **automatically** creates an active subscription for the customer.
- Paye's background hourly cron job automatically charges the tokenized cards when subscriptions are due, dynamically routing the charge to the correct gateway.

### What the Frontend Dev needs to know:
- **JS SDK Update:** The `Paye.js` SDK has been vastly simplified! You no longer need to make a second manual API call to `/sdk/subscriptions/create` after a successful checkout.
- **Usage:** Simply pass `planId: "PLN_12345"` in the options when calling `Paye.pay()`. The backend handles the automatic enrollment.

```javascript
// Example of the simplified JS SDK Subscription Flow
window.Paye.pay({
    type: "subscription",
    planId: "PLN_123456789", // The Paye Plan Code
    amount: 5000,
    email: "customer@example.com",
    onSuccess: function(ref, details) {
        console.log("Payment successful AND customer is automatically subscribed!");
    }
});
```

---

## 3. Smart Payouts (Unified Transfers)

Managing liquidity across multiple gateways is a nightmare. If a merchant has \$500 in Paystack and \$200 in Nomba, how do they withdraw \$600? Paye's **Smart Payouts** abstracts this liquidity routing.

### How it works:
- Merchants collect funds via Static Virtual Accounts.
- When a merchant requests a transfer/payout (`POST /api/v1/transfers`), they don't need to specify *which* gateway to withdraw from.
- Paye intelligently checks the active provider configuration, verifies the merchant's underlying virtual account balances, and routes the payout API call to the correct upstream provider automatically.

### What the Frontend Dev needs to know:
- **Endpoints:** The `POST /api/v1/transfers` endpoint is gateway-agnostic. 
- The merchant dashboard should emphasize that Paye acts as a single unified ledger. The merchant just asks for a payout, and Paye figures out the routing logic based on where the funds currently reside.
