# The Paye Resource Model v0.1

## What is Paye?

Paye is a unified payment infrastructure layer between applications and payment providers.

Applications integrate with Paye.

Paye integrates with payment providers.

The application should not need to understand how Paystack, Flutterwave, Nomba, OPay, or any other provider represents a payment operation.

The provider is an implementation detail handled by Paye.

## The Core Idea

Users deal with Paye.

Paye deals with providers.

An application creates, manages, and interacts with Paye resources. Underneath, Paye uses payment providers to implement those resources.

This creates two distinct concepts:

**Paye Resource**

A stable financial object exposed and managed by Paye.

**Provider Implementation**

The provider-specific object or operation used to materialize or execute a Paye resource.

For example:

Paye Virtual Account → Nomba Virtual Account

Paye Plan → Paystack Plan

Paye Subscription → Flutterwave Subscription

Paye Payment → OPay Transaction

The merchant interacts with the Paye resource.

Paye manages the provider implementation.

## Shared Identity

Unification requires a shared identity.

A virtual account cannot truly be provider-agnostic if the application's identity for that account is a Nomba account ID.

A plan cannot truly be provider-agnostic if the application stores a Paystack plan code as its primary identity.

Paye resources therefore have their own identities.

For example:

`pva_123`

`plan_123`

`sub_123`

`pay_123`

Provider identifiers are mappings attached to those resources.

A Paye resource may be implemented by one provider today and another provider tomorrow while retaining its Paye identity.

## Example: Virtual Accounts

A customer has a Paye virtual account:

`pva_123`

Initially, Nomba implements the virtual account.

`pva_123 → Nomba VA`

The merchant later switches virtual account providers.

Paye does not create an entirely new logical customer relationship.

When the virtual account is needed, Paye lazily creates the account with the new provider and links the new provider implementation to the existing Paye resource.

`pva_123 → New Provider VA`

The provider implementation changed.

The Paye resource survived.

The customer may receive a new account number, but the merchant's application continues interacting with the same Paye virtual account identity.

Paye maintains the financial context required to present the correct state of that resource.

## Paye Checkout

The same principle applies to checkout.

The checkout should be a Paye checkout.

The customer does not need to understand whether Paystack, Flutterwave, Nomba, or OPay is processing the payment.

The merchant creates a Paye payment.

Paye decides which provider implementation executes that payment.

The payment belongs to Paye's resource model.

The provider executes it.

This creates room for provider switching, routing rules, provider health decisions, and eventually automatic failover without exposing provider complexity to the merchant's application.

## The Principle

A merchant's application should depend on Paye resources, not provider resources.

Providers are interchangeable implementations beneath Paye's unified model.

When possible, changing a provider should change the implementation of a financial resource, not force the merchant to redesign their application.

## The Question We Ask for Every Paye Resource

When designing a new Paye resource, we ask:

**What belongs to Paye?**

**What belongs to the provider?**

**What identity does the merchant use?**

**What provider state must Paye map?**

**What should survive when the provider changes?**

**Can the resource be recreated or migrated to another provider?**

**What limitations prevent switching?**

Not every financial resource will be fully portable between providers.

Paye should not pretend otherwise.

Instead, Paye should clearly define the portability and provider dependencies of every resource.

## Current and Potential Paye Resources

Current:

* Payment
* Virtual Account

Potential:

* Customer
* Plan
* Subscription
* Transfer Recipient
* Transfer
* Refund

Each resource should have a stable Paye identity and clearly defined provider implementations.

## The Paye Model

Application
↓
Paye Resources
↓
Provider Implementations
↓
Paystack / Flutterwave / Nomba / OPay / Others

Users deal with Paye.

Paye deals with providers.
