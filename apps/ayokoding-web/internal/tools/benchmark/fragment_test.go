package benchmark_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/benchmark"
)

func TestFormatIndexAndPercent(t *testing.T) {
	if got := benchmark.FormatIndex(59.73, "en"); got != "59.7" {
		t.Fatalf("index en = %q, want 59.7", got)
	}
	if got := benchmark.FormatIndex(59.73, "id"); got != "59,7" {
		t.Fatalf("index id = %q, want 59,7", got)
	}
	if got := benchmark.FormatIndex(1234.56, "en"); got != "1,234.6" {
		t.Fatalf("grouped en = %q", got)
	}
	if got := benchmark.FormatIndex(1234.56, "id"); got != "1.234,6" {
		t.Fatalf("grouped id = %q", got)
	}
	if got := benchmark.FormatPercent(64.31, "en"); got != "64.3%" {
		t.Fatalf("percent = %q", got)
	}
	if benchmark.NoRating != "—" {
		t.Fatalf("NoRating = %q, want the old em-dash placeholder", benchmark.NoRating)
	}
}

func TestFormatUSDAndRatio(t *testing.T) {
	if got := benchmark.FormatUSD(12.39, "en"); got != "$12.39" {
		t.Fatalf("usd = %q", got)
	}
	if got := benchmark.FormatUSD(0.435, "en"); got != "$0.435" {
		t.Fatalf("sub-cent usd = %q, want the exact third decimal", got)
	}
	if got := benchmark.FormatUSD(10, "en"); got != "$10.00" {
		t.Fatalf("whole usd = %q", got)
	}
	if got := benchmark.FormatRatio(0.05, "en"); got != "0.1" {
		t.Fatalf("ratio = %q", got)
	}
	if got := benchmark.FormatRatio(12.39, "en"); got != "12" {
		t.Fatalf("large ratio = %q", got)
	}
	if got := benchmark.FormatRatio(0.05, "id"); got != "0,1" {
		t.Fatalf("ratio id = %q", got)
	}
}

func TestBenchmarkFragmentRendersRowsOrEmpty(t *testing.T) {
	dataset := loadDataset(t)
	fragment := benchmark.DecodeFragment(mustParseBenchmarkQuery(t, "harness=cursor"), dataset, "en")
	if fragment.Invalid || fragment.Empty {
		t.Fatalf("cursor fragment = %+v, want rows", fragment)
	}
	if fragment.Count != 29 {
		t.Fatalf("cursor count = %d, want the shared filter count 29", fragment.Count)
	}
	if fragment.Encoded != "harness=cursor" {
		t.Fatalf("fragment encoded = %q", fragment.Encoded)
	}
	previous := len(dataset.Config.Tiers)
	for _, row := range fragment.Rows {
		if row.ID == "" || row.Name == "" || row.IndexText == "" || row.PriceText == "" {
			t.Fatalf("row %+v misses display text", row)
		}
		rank := benchmark.TierRank(row.Tier, dataset.Config.Tiers)
		if rank > previous {
			t.Fatalf("rows leave tier order at %+v", row)
		}
		previous = rank
	}
	tiers := []string{"", "ultra", "planning", "execution", "fast", "insufficient"}
	harnesses := []string{"", "cursor", "opencode-go", "command-code-pro"}
	for _, harness := range harnesses {
		for _, tier := range tiers {
			state := benchmark.UrlState{Harness: harness, Tier: tier}
			built := benchmark.BuildFragment(dataset, state, "en")
			if built.Empty != (built.Count == 0) {
				t.Fatalf("state %+v: empty=%v count=%d", state, built.Empty, built.Count)
			}
		}
	}
}

func TestBenchmarkFragmentInvalidFilters(t *testing.T) {
	dataset := loadDataset(t)
	fragment := benchmark.DecodeFragment(mustParseBenchmarkQuery(t, "harness[cursor]=1"), dataset, "en")
	if !fragment.Invalid {
		t.Fatal("nested query must yield the invalid-filters fragment")
	}
	if fragment.Count != 0 || len(fragment.Rows) != 0 {
		t.Fatal("invalid-filters fragment must carry no rows")
	}
}

func TestBenchmarkFragmentEmptyState(t *testing.T) {
	dataset := loadDataset(t)
	fragment := benchmark.BuildFragment(dataset, benchmark.UrlState{Tier: "no-such-tier"}, "en")
	if !fragment.Empty || fragment.Count != 0 {
		t.Fatalf("impossible tier must be empty, got %+v", fragment)
	}
}
