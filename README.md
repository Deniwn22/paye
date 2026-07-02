# Paye

🏆 **Currently competing in the DevCareer x Nomba Hackathon 2026**

Unified payment routing engine and secure webhook proxies for African businesses and developers. 

Paye acts as a unified middle-layer connecting your apps to payment providers like Nomba, Paystack, Flutterwave, OPay, etc. Build your integration once against the Paye REST API or drop in our JS SDK, manage API credentials dynamically via the dashboard, generate Static Virtual Accounts on the fly, and route webhook events securely through isolated proxy slugs.

## Quick Links
- 🌍 **Web App:** [https://paye.africa](https://paye.africa)
- 📖 **Documentation:** [https://paye.africa/docs](https://paye.africa/docs)
- 🔌 **API Reference (Swagger):** [https://api.paye.africa/swagger/index.html](https://api.paye.africa/swagger/index.html)
- 🗺️ **Roadmap & Milestones:** [MILESTONES.md](./MILESTONES.md)

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
        ROUTER["Unified Router\nCheckout & Virtual Accounts"]
        WEBHOOK["Webhook Engine\nVerification & Normalization"]
        REPORTING["Reporting Engine\nVerifiable PDF Statements"]
        DB[("PostgreSQL/SQLite\nCredentials & Logs")]
        DASH["Merchant Dashboard"]
    end

    subgraph PROVIDERS ["💳 Payment Providers"]
        NB["Nomba"]
        PS["Paystack"]
        FW["Flutterwave"]
        OP["OPay"]
    end

    APP -->|"REST API\nX-Paye-API-Key"| GW
    SDK -->|"Inline Checkout"| SDKEP
    SDKEP --> ROUTER
    GW --> ROUTER
    ROUTER -->|"Initialize/Provision"| NB
    ROUTER -->|"Initialize"| PS
    ROUTER -->|"Initialize"| FW
    ROUTER <--> DB
    DASH -->|"Switch Provider\nManage Keys"| DB
    NB -->|"Webhook Events\n(Transfers/Payments)"| WEBHOOK
    PS -->|"Webhook Events"| WEBHOOK
    OP -->|"Webhook Events"| WEBHOOK
    WEBHOOK -->|"Verified &amp; Forwarded"| APP
    WEBHOOK -->|"Record Transaction"| DB
    REPORTING -->|"Aggregate Data"| DB
    DASH -->|"Generate PDF"| REPORTING
```

---

### Unified Virtual Accounts Flow

Paye abstracts the creation of Static Virtual Accounts. You call one endpoint, and Paye provisions the account on the active provider (e.g., Nomba), tracking incoming transfers locally and forwarding standardized webhooks to your server.

```mermaid
sequenceDiagram
    participant App as Your App
    participant Paye as Paye API
    participant Provider as Active Provider<br/>(e.g., Nomba)
    
    App->>Paye: POST /api/v1/virtual-accounts<br/>{ customer_name, email }
    Paye->>Provider: Create Virtual Account API
    Provider-->>Paye: Return NUBAN & Bank Name
    Paye->>Paye: Map pvc_id to underlying NUBAN
    Paye-->>App: { pvc_id, account_number, bank }
    
    Note over Provider, Paye: Customer makes a bank transfer
    Provider->>Paye: Inbound Transfer Webhook
    Paye->>Paye: Idempotent Check & Log Transaction
    Paye->>App: Normalized Transfer Webhook
```

---

### Webhook Proxy & Normalization Flow

Each Paye project gets an isolated webhook slug. Provider webhooks are verified (signature checked), normalized into a single predictable format, and forwarded to your endpoint — so your server never needs to handle raw provider formats.

```mermaid
flowchart LR
    PS["Paystack\nWebhook"]
    FW["Flutterwave\nWebhook"]
    NB["Nomba\nWebhook"]

    PROXY["Paye Webhook Proxy\n/webhooks/:project_slug\n\n✓ Signature Verified\n✓ Normalized\n✓ Idempotent"]

    YOUR["Your Server\nOne endpoint\nOne format"]

    PS --> PROXY
    FW --> PROXY
    NB --> PROXY
    PROXY --> YOUR
```

---

### Verifiable Statement Engine

Paye doesn't just process payments; it acts as a system of record. Merchants can generate PDF Statements of Account (for aggregated checkout volumes or specific Virtual Accounts). Each PDF contains a cryptographic `Verification Ref` that anyone can verify via a public endpoint.

```mermaid
flowchart LR
    MERCHANT["Merchant Dashboard"]
    PDF["Generated PDF\n(Includes Verification Ref)"]
    PUBLIC["Public Verifier\n(Investors/Auditors)"]
    API["Public Endpoint\nGET /statements/verify/:id"]

    MERCHANT -->|"Request Statement"| PDF
    PUBLIC -->|"Checks ID"| API
    API -->|"Returns Original Data"| PUBLIC
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

- **Static Virtual Accounts**: Provision dedicated NUBANs (powered by Nomba) for your customers through a single abstracted API.
- **Dynamic Router**: Connect Nomba, Paystack, Flutterwave, or other provider credentials and switch active providers instantly from the dashboard without modifying your codebase.
- **Zero-Exposure Webhooks**: Proxy callback event payloads from gateways back to your application servers. Paye normalizes varying payload structures into one clean schema.
- **Verifiable PDF Statements**: Generate stylized, downloadable PDF statements with embedded UUIDs that can be publicly authenticated.
- **Unified REST API**: Initialize and verify transactions across different gateways using a single API contract.
- **Frontend JS SDK**: Drop a script tag and checkout target on your pages to launch instant inline checkouts securely.

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
3. Go to the **Providers** tab and save your provider keys (e.g. Nomba Client ID/Secret). These keys are stored encrypted using AES-GCM at rest.

### 3. Integrate Services

#### Option A: Virtual Accounts

Provision a Virtual Account for a customer:

```bash
curl -X POST "http://localhost:8080/api/v1/virtual-accounts" \
  -H "X-Paye-API-Key: <your_paye_api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "account_name": "John Doe",
    "email": "customer@example.com"
  }'
```

#### Option B: REST API (Backend Checkout Integration)

Initialize a transaction from your server:

```bash
curl -X POST "http://localhost:8080/api/v1/transactions/initialize" \
  -H "X-Paye-API-Key: <your_paye_api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "email": "customer@example.com",
    "currency": "NGN"
  }'
```

#### Option C: JS SDK Embed (Zero-Code Frontend Checkout)

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
- Downloadable Statements of Account.

## Future Roadmap & Evolution Plan

To transition Paye from a robust unified payment router into a production-grade fintech infrastructure platform, we plan to implement:

1. **Smart Routing & Failover**: Dynamically switch gateway routes based on conversion rates, latency, or transaction costs, and enable automated backup failovers during provider downtime.
2. **Advanced Webhook Delivery Engine**: Queue webhook proxy payloads with exponential backoff retries and manual log replay features (Dead Letter Queue).
3. **Unified Subscription Engine**: Abstract recurring billing contracts and card tokenization across multiple underlying gateways.
4. **Automatic VA Migration**: Seamlessly provisioning new accounts on a new provider for existing customers without downtime when a merchant switches providers.
5. **Expanded Global Provider Support**: Adding integrations for international gateways including **Stripe, Square, Braintree, and Monnify** to allow African merchants to seamlessly accept global payments.

## License
MIT
