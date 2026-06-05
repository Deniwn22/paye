# Paye

Unified payment routing engine and secure webhook proxies for African developers. 

Paye acts as a unified middle-layer connecting your apps to payment providers like Paystack and Flutterwave. Build your integration once against the Paye REST API or drop in our JS SDK, manage API credentials dynamically via the dashboard, and route webhook events securely through isolated proxy slugs.

## Core Features

- **Dynamic Router**: Connect Paystack or Flutterwave credentials and switch active providers instantly from the dashboard without modifying your codebase.
- **Unified REST API**: Initialize and verify transactions across different gateways using a single API contract.
- **Frontend JS SDK**: Drop a script tag and checkout target on your pages to launch instant inline checkouts securely.
- **Zero-Exposure Webhooks**: Proxy callback event payloads from gateways back to your application servers through proxy slugs with signature validation.

## Getting Started

### 1. Run the Platform

Clone this repository and spin up the backend and database:

```bash
docker-compose up -d
```

Ensure the Go backend is running (defaults to `http://localhost:8080`).

### 2. Configure Providers

1. Navigate to the merchant dashboard (configured under the `web` workspace, running at `http://localhost:3000`).
2. Log in or create a new merchant account.
3. Go to the **Providers** tab and save your provider secret and public keys (e.g. Paystack Live/Test keys). These keys are stored encrypted using AES-GCM at rest.

### 3. Integrate Checkout

#### Option A: REST API (Backend Integration)

Initialize a transaction from your server:

```bash
curl -X POST "http://localhost:8080/api/v1/transactions/initialize" \
  -H "X-Paye-API-Key: <your_paye_api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "email": "customer@example.com",
    "currency": "NGN",
    "provider": "paystack"
  }'
```

Verify transaction status:

```bash
curl "http://localhost:8080/api/v1/transactions/verify/<transaction_reference>" \
  -H "X-Paye-API-Key: <your_paye_api_key>"
```

#### Option B: JS SDK Embed (Zero-Code Frontend)

Paste the script tag inside your HTML pages:

```html
<script src="http://localhost:8080/sdk/<your_public_id>.js"></script>
```

And place the container element anywhere:

```html
<div data-paye-checkout 
     data-amount="5000" 
     data-email="customer@example.com">
</div>
```

## Developer Dashboard

The frontend workspace provides:
- Live volume and success rate analytics.
- Webhook forward logs for auditing incoming gateway requests.
- Live provider toggle control switches.

## Future Roadmap & Evolution Plan

To transition Paye from a robust unified payment router into a production-grade fintech infrastructure platform, we plan to implement:

1. **Smart Routing & Failover**: Dynamically switch gateway routes based on conversion rates, latency, or transaction costs, and enable automated backup failovers during provider downtime.
2. **Dual Sandbox/Live Environments**: Support `paye_test_...` and `paye_live_...` API keys per project with separate test/live credential stores.
3. **Advanced Webhook Delivery Engine**: Queue webhook proxy payloads with exponential backoff retries and manual log replay features (Dead Letter Queue).
4. **Unified Subscription Engine**: Abstract recurring billing contracts and card tokenization across multiple underlying gateways.
5. **Team Workspaces**: Support developer invitations and role-based permissions (Owner, Admin, Viewer) per project.

## License
MIT
