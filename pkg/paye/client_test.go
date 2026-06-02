package paye

import (
	"testing"
)

func TestNewClient(t *testing.T) {
	client := NewClient()
	if client == nil {
		t.Errorf("expected client, got nil")
	}
}
