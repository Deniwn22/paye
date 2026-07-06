package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Transaction struct {
	ID        string
	Amount    float64
	Provider  string
	Status    string
	IsLive    bool
	CreatedAt string
}

func main() {
	dsn := "postgres://postgres:postgres@localhost:5432/paye?sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	var txs []Transaction
	db.Raw("SELECT id, amount, provider, status, is_live, created_at FROM transactions").Scan(&txs)
	
	fmt.Printf("Total Checkout Transactions: %d\n", len(txs))
	for _, t := range txs {
		fmt.Printf("Tx: amount=%.2f provider=%s status=%s live=%v\n", t.Amount, t.Provider, t.Status, t.IsLive)
	}

	var vaTxs []Transaction
	db.Raw("SELECT id, amount, provider, status, is_live, created_at FROM virtual_account_transactions").Scan(&vaTxs)
	
	fmt.Printf("\nTotal VA Transactions: %d\n", len(vaTxs))
	for _, t := range vaTxs {
		fmt.Printf("VA Tx: amount=%.2f provider=%s status=%s live=%v\n", t.Amount, t.Provider, t.Status, t.IsLive)
	}
}
