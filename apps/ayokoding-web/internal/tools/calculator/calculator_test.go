package calculator_test

import (
	"net/url"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
)

func fixtureEngine() *calculator.Engine {
	return calculator.NewFakeEngine(map[string]calculator.Estimate{
		"jakarta|mid|standard|1": {MonthlyCostUSD: 900, MonthlySaving: 600, MinRole: "mid"},
	})
}

func TestComputeMatchesReferenceVector(t *testing.T) {
	got := fixtureEngine().Compute(calculator.Inputs{City: "jakarta", Role: "mid", Mode: "standard", Workers: 1})
	if got.MonthlyCostUSD != 900 || got.MonthlySaving != 600 || got.MinRole != "mid" {
		t.Fatalf("estimate = %+v, want vector {900 600 mid}", got)
	}
}

func TestUnknownCityFallsBack(t *testing.T) {
	got := fixtureEngine().Compute(calculator.Inputs{City: "atlantis", Role: "mid"})
	if got.MonthlyCostUSD != 0 || !got.Empty {
		t.Fatalf("incompatible geography must use the fallback state, got %+v", got)
	}
	if calculator.KnownCity("atlantis") {
		t.Fatal("atlantis must not be a known city")
	}
	if !calculator.KnownCity("jakarta") {
		t.Fatal("jakarta must be a known city")
	}
}

func TestURLRoundTripPreservesInputs(t *testing.T) {
	original := calculator.Inputs{City: "jakarta", Role: "mid", Mode: "standard", Workers: 1}
	restored := calculator.DecodeInputs(mustParseQuery(t, calculator.EncodeInputs(original)))
	if restored != original {
		t.Fatalf("round trip = %+v, want %+v", restored, original)
	}
}

func TestInvalidInputsUseCodecRecovery(t *testing.T) {
	restored := calculator.DecodeInputs(mustParseQuery(t, "workers=abc&city="))
	want := calculator.Inputs{City: "", Role: "mid", Mode: "standard", Workers: 1}
	if restored != want {
		t.Fatalf("invalid inputs must use codec recovery, got %+v want %+v", restored, want)
	}
}

func mustParseQuery(t *testing.T, encoded string) url.Values {
	t.Helper()
	query, err := url.ParseQuery(encoded)
	if err != nil {
		t.Fatalf("ParseQuery: %v", err)
	}
	return query
}
