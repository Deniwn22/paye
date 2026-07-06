# Project Milestones

This document tracks the high-level roadmap and major milestones for the Paye platform.

## Milestone 1: Core Foundation & Provider Parity (In Progress)
- [x] Basic Paystack and Flutterwave integrations.
- [x] Unified REST API for Transactions.
- [x] JS SDK for inline checkout.
- [x] Nomba & OPay integrations.
- [x] Dual Sandbox/Live Environments.
- [x] Webhook Proxying & Environment Segregation.
- [x] Virtual Accounts API & Webhooks.

## Milestone 2: Unified Virtual Accounts & Nomba Hackathon
- [x] Provider Parity for VA: Extend virtual account provisioning and webhook processing to support Paystack and Flutterwave (currently only Nomba and OPay are supported).
- [x] Automatic VA Migration: When a business switches their active provider on the dashboard, Paye should automatically start provisioning new Virtual Accounts for their existing customers under the new provider, deprecating the old ones gracefully.
- [x] Unified Account Lifecycle: Abstract the creation, updating, and expiring of virtual accounts so a single API call handles it across any provider.

## Milestone 3: Reliability & Delivery 
- [ ] Advanced Webhook Delivery Engine: Queue webhook proxy payloads with exponential backoff retries.
- [ ] Dead Letter Queue (DLQ) & Manual Replay: Allow merchants to manually replay failed webhook deliveries from the dashboard.
- [ ] Smart Routing & Failover: Dynamically switch gateway routes based on conversion rates or latency, and enable automated backup failovers during provider downtime.
- [ ] Webhook Schema Drift Detection: Implement JSON Schema validation at the webhook ingress layer to automatically detect, alert on, and fallback from undocumented payload changes by upstream providers.

## Milestone 4: Subscriptions & Recurring Billing
- [ ] Unified Subscription Engine: Abstract recurring billing contracts across underlying gateways.
- [ ] Tokenized Card Storage: Provide a unified interface to charge saved cards regardless of the provider used to save them.

## Milestone 5: Platform & Collaboration
- [ ] Team Workspaces: Support developer invitations and role-based permissions (Owner, Admin, Viewer).
- [ ] Detailed Analytics Dashboard: Expand the analytics to include conversion rates, failure reasons, and volume by provider.
- [x] PDF Reporting & Statements: Internal aggregator engine capable of dynamically generating custom, branded PDF statements for merchant volumes and customer virtual accounts.
