# Paye

Unified payment routing engine and secure webhook proxies for African developers. 

Paye acts as a unified middle-layer connecting your apps to payment providers like Paystack and Flutterwave. Build your integration once against the Paye REST API or drop in our JS SDK, manage API credentials dynamically via the dashboard, and route webhook events securely through isolated proxy slugs.

## Architecture

### How Paye Works

Paye sits as a unified middleware between your platform and payment providers. Your code integrates once against Paye's stable API — providers can be swapped from the dashboard without touching your codebase.

```mermaid
flowchart TD
    subgraph YOUR_PLATFORM ["🏪 Your Platform"]
        APP["Your App\n(web / mobile / backend)"]
        SDK["Paye JS SDK\n&lt;script&gt; embed"]
    end

    subgraph PAYE ["⚡ Paye Infrastructure"]
        direction TB
        GW["API Gateway\n/api/v1/*"]
        SDKEP["SDK Endpoint\n/sdk/:public_id.js"]
        ROUTER["Unified Router\nProvider Resolution"]
        WEBHOOK["Webhook Proxy\n/webhooks/:slug"]
        DB[("PostgreSQL\nEncrypted Credentials\nTransaction Logs")]
        DASH["Merchant Dashboard"]
    end

    subgraph PROVIDERS ["💳 Payment Providers"]
        PS["Paystack"]
        FW["Flutterwave"]
        NB["Nomba"]
    end

    APP -->|"REST API\nX-Paye-API-Key"| GW
    SDK -->|"Inline Checkout"| SDKEP
    SDKEP --> ROUTER
    GW --> ROUTER
    ROUTER -->|"Active Provider"| PS
    ROUTER -->|"Active Provider"| FW
    ROUTER -->|"Active Provider"| NB
    ROUTER <--> DB
    DASH -->|"Switch Provider\nManage Keys"| DB
    PS -->|"Webhook Events"| WEBHOOK
    FW -->|"Webhook Events"| WEBHOOK
    NB -->|"Webhook Events"| WEBHOOK
    WEBHOOK -->|"Verified &amp; Forwarded"| APP
```

---

### Unified Checkout Flow

When a payment is initialized, Paye resolves the active provider, forwards the request, and returns a stable response — the same shape regardless of which provider handled it.

```mermaid
sequenceDiagram
    participant Platform as Your Platform
    participant Paye as Paye API
    participant Provider as Active Provider<br/>(Paystack / Flutterwave / Nomba)
    participant Customer as Customer Browser

    Platform->>Paye: POST /api/v1/transactions/initialize<br/>{ amount, email, currency }
    Paye->>Paye: Resolve active provider<br/>Decrypt credentials
    Paye->>Provider: Initialize transaction<br/>(provider-specific API)
    Provider-->>Paye: Checkout URL + Reference
    Paye-->>Platform: { auth_url, reference }
    Platform->>Customer: Redirect to auth_url
    Customer->>Provider: Complete payment
    Provider->>Paye: Webhook event (payment_success)
    Paye->>Paye: Verify signature<br/>Log transaction
    Paye->>Platform: Forwarded webhook<br/>(normalized payload)
```

---

### Webhook Proxy Flow

Each Paye project gets an isolated webhook slug. Provider webhooks are verified (signature checked), normalized, and forwarded to your endpoint — so your server never needs to handle raw provider formats.

```mermaid
flowchart LR
    PS["Paystack\nWebhook"]
    FW["Flutterwave\nWebhook"]
    NB["Nomba\nWebhook"]

    PROXY["Paye Webhook Proxy\n/webhooks/:project_slug\n\n✓ Signature Verified\n✓ Logged\n✓ Normalized"]

    YOUR["Your Server\nOne endpoint\nOne format"]

    PS --> PROXY
    FW --> PROXY
    NB --> PROXY
    PROXY --> YOUR
```

---

### Provider Switch — Zero Code Change

Switching providers in the dashboard triggers zero changes on the platform side. Paye handles the resolution underneath.

```mermaid
flowchart TD
    subgraph BEFORE ["Before Switch"]
        A1["paye_ref_abc123"] --> B1["Paystack\n✓ Active"]
        A1 -.->|"inactive"| C1["Nomba"]
    end

    subgraph AFTER ["After Switch (Dashboard Click)"]
        A2["paye_ref_abc123"] -.->|"inactive"| B2["Paystack"]
        A2 --> C2["Nomba\n✓ Active"]
    end

    DASH["Merchant Dashboard\nOne Click"] -->|"Toggle Active Provider"| AFTER
```

> Your platform always calls the same Paye endpoint with the same reference format. What changes underneath is invisible to your code.

---

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

#### Database Migrations

The Go backend programmatically applies database migrations automatically on startup using embedded SQL files.

If you want to manage migrations manually using the `goose` CLI tool (which you have installed), you can run:

```bash
# Run PostgreSQL migrations
goose -dir internal/db/migrations/postgres postgres "postgres://postgres:postgres@localhost:5432/paye?sslmode=disable" up

# Check migration status
goose -dir internal/db/migrations/postgres postgres "postgres://postgres:postgres@localhost:5432/paye?sslmode=disable" status
```


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
