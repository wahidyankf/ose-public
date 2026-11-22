package calculator_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
)

func TestFmtCurrencyWithoutCodeReturnsBareNumber(t *testing.T) {
	if got := calculator.FmtCurrency(5500, ""); got != "5,500" {
		t.Fatalf("FmtCurrency without code = %q, want %q", got, "5,500")
	}
	if got := calculator.FmtCurrency(5500, "SGD"); got != "SGD 5,500" {
		t.Fatalf("FmtCurrency with code = %q, want %q", got, "SGD 5,500")
	}
}

func TestFmtDualCurrencyRendersBothAmounts(t *testing.T) {
	if got := calculator.FmtDualCurrency(5500, "SGD", 100); got != "SGD 5,500 / $100" {
		t.Fatalf("FmtDualCurrency = %q, want %q", got, "SGD 5,500 / $100")
	}
}
