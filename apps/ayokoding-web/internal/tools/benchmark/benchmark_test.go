package benchmark_test

import (
	"net/url"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/benchmark"
)

func fixtureEngine() *benchmark.Engine {
	return benchmark.NewFakeEngine(map[string]benchmark.Result{
		"chat|mid": {Models: []benchmark.ModelResult{
			{Name: "Model B", Score: 9.1, PriceUSD: 4},
			{Name: "Model A", Score: 8.2, PriceUSD: 2},
		}},
	})
}

func TestScoreMatchesReferenceVector(t *testing.T) {
	result := fixtureEngine().Score(benchmark.Filters{UseCase: "chat", PriceBand: "mid"})
	if len(result.Models) != 2 {
		t.Fatalf("models = %d, want 2", len(result.Models))
	}
	if result.Models[0].Name != "Model B" {
		t.Fatalf("first model = %q, want Model B (vector order)", result.Models[0].Name)
	}
}

func TestNoMatchShowsEmptyState(t *testing.T) {
	result := fixtureEngine().Score(benchmark.Filters{UseCase: "unknown-combo", PriceBand: "none"})
	if !result.Empty || len(result.Models) != 0 {
		t.Fatalf("no-match must be the empty state, got %+v", result)
	}
}

func TestURLRoundTripPreservesState(t *testing.T) {
	original := benchmark.Filters{UseCase: "chat", PriceBand: "mid", MinScore: 8}
	restored := benchmark.DecodeFilters(mustParseQuery(t, benchmark.EncodeFilters(original)))
	if restored != original {
		t.Fatalf("round trip = %+v, want %+v", restored, original)
	}
}

func TestInvalidURLValuesFallBackToDefaults(t *testing.T) {
	restored := benchmark.DecodeFilters(mustParseQuery(t, "use-case=nope&min-score=abc"))
	if restored != benchmark.Defaults() {
		t.Fatalf("invalid values must fall back to defaults, got %+v", restored)
	}
}

func TestMissingMinScoreAndOutOfRange(t *testing.T) {
	restored := benchmark.DecodeFilters(mustParseQuery(t, "use-case=chat&price-band=mid"))
	if restored.MinScore != 0 {
		t.Fatalf("missing min-score = %v, want 0", restored.MinScore)
	}
	restored = benchmark.DecodeFilters(mustParseQuery(t, "use-case=chat&price-band=mid&min-score=99"))
	if restored.MinScore != 0 {
		t.Fatalf("out-of-range min-score = %v, want default 0", restored.MinScore)
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
