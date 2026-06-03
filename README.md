# Paye

A unified payment infrastructure for Nigerian and African payment providers.

## Overview

Paye abstracts Paystack, Flutterwave, Monnify and other African payment providers behind a single unified interface. Build once, switch providers without touching your code.

## Providers
- [x] Paystack
- [ ] Flutterwave
- [ ] Monnify

## Getting Started

```bash
go get github.com/ttomsin/paye
```

## Usage

```go
client := paye.NewClient()
client.RegisterProvider(paystack.New("sk_test_xxx"))

p, ok := client.Provider("paystack")
if !ok {
    log.Fatal("provider not found")
}

resp, err := p.InitializeTransaction(provider.TransactionRequest{
    Amount:    5000,
    Email:     "customer@email.com",
    Currency:  "NGN",
})
```

## License
MIT
