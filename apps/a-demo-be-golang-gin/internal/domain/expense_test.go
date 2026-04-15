package domain_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/a-demo-be-golang-gin/internal/domain"
)

func TestUnitValidateCurrency(t *testing.T) {
	tests := []struct {
		name     string
		currency string
		wantErr  bool
	}{
		{"USD", "USD", false},
		{"IDR", "IDR", false},
		{"lowercase usd", "usd", false},
		{"unsupported EUR", "EUR", true},
		{"too short US", "US", true},
		{"empty", "", true},
		{"four chars USDD", "USDD", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := domain.ValidateCurrency(tt.currency)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateCurrency(%q) error = %v, wantErr %v", tt.currency, err, tt.wantErr)
			}
		})
	}
}

func TestUnitValidateAmount(t *testing.T) {
	tests := []struct {
		name     string
		currency string
		amount   float64
		wantErr  bool
	}{
		{"USD valid", "USD", 10.50, false},
		{"USD zero", "USD", 0.00, false},
		{"USD two decimals", "USD", 99.99, false},
		{"USD too many decimals", "USD", 10.999, true},
		{"IDR whole number", "IDR", 150000, false},
		{"IDR with decimals", "IDR", 150000.5, true},
		{"negative USD", "USD", -10.00, true},
		{"negative IDR", "IDR", -1000, true},
		{"unsupported currency", "EUR", 10.00, true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := domain.ValidateAmount(tt.currency, tt.amount)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateAmount(%q, %v) error = %v, wantErr %v", tt.currency, tt.amount, err, tt.wantErr)
			}
		})
	}
}

func TestUnitValidateUnit(t *testing.T) {
	tests := []struct {
		name    string
		unit    string
		wantErr bool
	}{
		{"empty unit allowed", "", false},
		{"liter", "liter", false},
		{"gallon", "gallon", false},
		{"kg", "kg", false},
		{"piece", "piece", false},
		{"hour", "hour", false},
		{"unsupported fathom", "fathom", true},
		{"unsupported cubit", "cubit", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := domain.ValidateUnit(tt.unit)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateUnit(%q) error = %v, wantErr %v", tt.unit, err, tt.wantErr)
			}
		})
	}
}

func TestUnitFormatAmount(t *testing.T) {
	tests := []struct {
		name     string
		currency string
		amount   float64
		want     float64
	}{
		{"USD round", "USD", 10.505, 10.51},
		{"IDR truncate", "IDR", 150000.9, 150000},
		{"unknown currency", "XYZ", 10.5, 10.5},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := domain.FormatAmount(tt.currency, tt.amount)
			if got != tt.want {
				t.Errorf("FormatAmount(%q, %v) = %v, want %v", tt.currency, tt.amount, got, tt.want)
			}
		})
	}
}
