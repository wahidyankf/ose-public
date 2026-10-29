package calculator_test

import (
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
)

func TestFmtCurrencyTrailing(t *testing.T) {
	if got := calculator.FmtCurrencyTrailing(5500, "SGD"); got != "5,500 SGD" {
		t.Fatalf("trailing = %q", got)
	}
	if got := calculator.FmtCurrency(26147, "IDR"); got != "IDR 26,147" {
		t.Fatalf("prefixed = %q", got)
	}
}

func TestCalculatorFragmentCostAndSavings(t *testing.T) {
	dataset, matrix := loadData(t)
	state, _ := decodeCalculatorState(t, dataset, "region=asean&country=id&city=jakarta&adults=2&preschool=1&schoolkids=2&schooltype=private&area=rural")
	fragment := calculator.BuildFragment(dataset, matrix, state, "en")
	if fragment.Invalid || fragment.Empty {
		t.Fatalf("cost fragment = %+v", fragment)
	}
	if fragment.CostText != "IDR 48,167,500" || fragment.CostCurrency != "IDR" {
		t.Fatalf("cost = %q %q, want the shared essentials vector", fragment.CostText, fragment.CostCurrency)
	}
	if fragment.SavingsText != "" {
		t.Fatalf("zero gross must show no savings, got %q", fragment.SavingsText)
	}
	if fragment.Ready {
		t.Fatal("blank savings target must not engage the baseline")
	}
	// The savings vector's household at a 3000 gross shows converted savings.
	saving, _ := decodeCalculatorState(t, dataset, "region=asean&country=id&city=jakarta&adults=2&preschool=1&schoolkids=2&schooltype=private&area=rural&tab=savings&gross=3000")
	savingFragment := calculator.BuildFragment(dataset, matrix, saving, "en")
	if savingFragment.SavingsText == "" {
		t.Fatal("entered gross must render a savings figure")
	}
}

func TestCalculatorFragmentBaselineEngagement(t *testing.T) {
	dataset, matrix := loadData(t)
	blank, _ := decodeCalculatorState(t, dataset, "tab=min-role")
	if fragment := calculator.BuildFragment(dataset, matrix, blank, "en"); fragment.Ready || fragment.MinRoleID != "" || fragment.Empty {
		t.Fatalf("blank target disengages, got %+v", fragment)
	}
	zero, _ := decodeCalculatorState(t, dataset, "tab=min-role&target=0")
	zeroFragment := calculator.BuildFragment(dataset, matrix, zero, "en")
	if !zeroFragment.Ready {
		t.Fatal("explicit zero target engages the baseline")
	}
	if zeroFragment.MinRoleID == "" {
		t.Fatal("zero baseline must qualify a minimum role")
	}
	salary, _ := decodeCalculatorState(t, dataset, "tab=min-role&baseline=my_salary&target=0&targetcur=EUR&refcity=singapore&mygross=5000&mysalarycity=jakarta&mygrosscur=usd&displaycur=IDR")
	salaryFragment := calculator.BuildFragment(dataset, matrix, salary, "en")
	if !salaryFragment.Ready {
		t.Fatal("salary baseline must engage")
	}
	reference, _ := decodeCalculatorState(t, dataset, "tab=min-role&baseline=reference_role&refcity=singapore")
	if fragment := calculator.BuildFragment(dataset, matrix, reference, "en"); !fragment.Ready {
		t.Fatal("reference baseline must engage")
	}
	dangling, _ := decodeCalculatorState(t, dataset, "tab=min-role&baseline=my_salary&mygross=5000")
	if fragment := calculator.BuildFragment(dataset, matrix, dangling, "en"); fragment.Ready {
		t.Fatal("salary baseline without its city stays disengaged")
	}
	// An infinite target engages with a bar nothing clears.
	infinite, _ := decodeCalculatorState(t, dataset, "tab=min-role&target=Infinity")
	infiniteFragment := calculator.BuildFragment(dataset, matrix, infinite, "en")
	if !infiniteFragment.Ready || !infiniteFragment.Empty || infiniteFragment.MinRoleID != "" {
		t.Fatalf("infinite target = %+v, want engaged but empty", infiniteFragment)
	}
}

func TestCalculatorFragmentInvalidFilters(t *testing.T) {
	dataset, matrix := loadData(t)
	fragment := calculator.DecodeFragment(mustParseCalculatorQuery(t, "tab=cost&salary=5000"), dataset, matrix, "en")
	if !fragment.Invalid {
		t.Fatal("unexpected field must yield the invalid-filters fragment")
	}
	if fragment.CostText != "" || fragment.SavingsText != "" || fragment.MinRoleID != "" {
		t.Fatal("invalid-filters fragment must carry no estimates")
	}
}
