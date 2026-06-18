# Paye Supported Payment Providers Sandbox Testing Guide

This guide contains all the staging/sandbox test card details, wallet credentials, and mock bank accounts for each payment provider supported by Paye. 

---

## 🟢 OPay (Sandbox Mode)

Staging Endpoint: `https://testapi.opaycheckout.com`
OPay Sandbox requires specific test accounts and cards. Do not use real cards or generic test cards.

### 💳 Staging Test Cards
| Card Number | Expiry | CVV | PIN | OTP | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`5061 4604 1012 1111 104`** | Any Future | `560` | `1104` | `543210` | **SUCCESS** (PIN Authentication) |
| **`5061 4604 1012 1111 105`** | Any Future | `561` | `1105` | `543210` | **SUCCESS** (PIN + OTP Authentication) |
| **`5061 4604 1012 1111 106`** | Any Future | `562` | `1106` | `543210` | **SUCCESS** (PIN + 3DS Authentication) |
| **`5061 4604 1012 1111 101`** | Any Future | `557` | `1102` | `543210` | **PENDING** (Simulates processing delay) |
| **`5061 4604 1012 1111 102`** | Any Future | `558` | `1103` | `543210` | **PENDING** (Simulates processing delay) |

### 📱 E-Wallet Sandbox Accounts
To test OPay E-Wallet checkouts, enter the following staging customer phone numbers:
* **`01066668888`** (or `+2341066668888`): Simulates a **SUCCESSFUL** wallet debit.
* **`01077779999`** (or `+2341077779999`): Simulates a **FAILED** wallet debit.

---

## 🟢 Paystack (Test Mode)

Paystack uses a set of standard card prefixes to trigger various outcomes. Any future expiry date and arbitrary CVV/PIN can be used unless specified.

### 💳 Staging Test Cards
| Card Number | CVV | Expiry | PIN | OTP / Authentication | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`4084 0840 8408 4081`** | `408` | Any Future | None | Any OTP | **SUCCESS** (Direct Charge) |
| **`5078 5078 5078 5078`** | `081` | Any Future | `1111` | `123456` | **SUCCESS** (PIN + OTP Authentication) |
| **`5258 5859 2266 6506`** | `883` | Any Future | None | None | **FAIL** (Insufficient Funds) |
| **`5590 1317 4329 4314`** | `887` | Any Future | None | None | **FAIL** (Suspected Fraud) |
| **`5143 0105 2233 9965`** | `276` | Any Future | None | None | **FAIL** (Declined / AVS Fail) |

### 🏦 Mock Bank Transfer Accounts
For testing direct bank charges or resolving account details:
* **Access Bank**: `0690000031` (OTP: `12345`)
* **Access Bank**: `0690000032` (OTP: `12345`)
* **Providus Bank**: `5900102340` (OTP: `12345`)

---

## 🟢 Flutterwave (Sandbox Mode)

Staging Endpoint: `https://api.flutterwave.com` (with Test Keys)

### 💳 Staging Test Cards
| Card Network | Card Number | Expiry | CVV | PIN | OTP | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Visa / Mastercard** | **`5531 8866 5214 2950`** | Any Future | `564` | `3310` | `12345` | **SUCCESS** (PIN Auth) |
| **Mastercard 3DS** | **`5438 8980 1456 0229`** | Any Future | `564` | `3310` | `12345` | **SUCCESS** (3DS Auth Redirect) |
| **Visa 3DS** | **`4187 4274 1556 4246`** | Any Future | `828` | `3310` | `12345` | **SUCCESS** (3DS Auth Redirect) |
| **Verve PIN** | **`5061 4604 1012 0223 210`** | Any Future | `780` | `3310` | `12345` | **SUCCESS** (Verve PIN Auth) |

### 🏦 Mock Bank Accounts
* **Access Bank**: `0690000031` (OTP: `12345`)
* **Providus Bank**: `5900102340` / `5900002567` (OTP: `12345`)

---

## 🟡 Nomba (Sandbox Mode - Currently Deactivated)

Staging Endpoint: `https://sandbox.nomba.com`
During sandbox checkout, CVV and Expiry are not validated. Use PIN `9999` and OTP `9999` to approve simulated steps.

### 💳 Staging Test Cards
| Card Network | Card Number | PIN | OTP | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **Mastercard** | **`5434 6210 7425 2808`** | `9999` | `9999` | **SUCCESS** (OTP Auth) |
| **Visa** | **`4000 0000 0000 2503`** | `9999` | `9999` | **SUCCESS** (3DS Redirect) |
| **Mastercard** | **`5484 4972 1831 7651`** | `9999` | - | **DECLINED** (Do Not Honor) |

### 🔐 Simulating OTP Results (Nomba)
* **Approve Transaction**: Enter `9999`
* **Simulate Timeout**: Enter `1234`
* **Simulate Invalid OTP**: Enter `5464`
