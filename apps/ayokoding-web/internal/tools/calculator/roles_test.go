package calculator_test

import (
	"math"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
)

func TestMinimumRoleEmptyWhenNothingClears(t *testing.T) {
	ladder := []calculator.LadderEntry{
		{Role: "junior", Rank: 3, BestEssentialSavingsUSD: 100},
		{Role: "senior", Rank: 1, BestEssentialSavingsUSD: 200},
	}
	if got := calculator.MinimumRole(1000, ladder); got != "" {
		t.Fatalf("MinimumRole above every saving = %q, want empty", got)
	}
	for _, entry := range ladder {
		if entry.Clears {
			t.Fatalf("role %q must not clear a baseline above its saving", entry.Role)
		}
	}
	if got := calculator.MinimumRole(150, ladder); got != "senior" {
		t.Fatalf("MinimumRole(150) = %q, want the lowest-rank clearing role", got)
	}
}

func TestInfiniteTargetStaysEngaged(t *testing.T) {
	dataset, matrix := loadData(t)
	target := calculator.DefaultState()
	target.MinRole.BaselineSource = calculator.BaselineSavingsTarget
	target.MinRole.TargetRaw = "1e999"
	target.MinRole.DisplayCurrency = "USD"
	baseline, ready := calculator.ResolveFragmentBaseline(target, dataset, matrix)
	if !ready {
		t.Fatal("an infinite savings target must stay engaged")
	}
	if !math.IsInf(baseline, 1) {
		t.Fatalf("infinite target baseline = %v, want +Inf", baseline)
	}
	under := calculator.DefaultState()
	under.MinRole.BaselineSource = calculator.BaselineSavingsTarget
	under.MinRole.TargetRaw = "1e-9999"
	under.MinRole.DisplayCurrency = "USD"
	baseline, ready = calculator.ResolveFragmentBaseline(under, dataset, matrix)
	if !ready || baseline != 0 {
		t.Fatalf("underflow target = (%v, %v), want (0, true)", baseline, ready)
	}
}
