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

func TestCalculatorFragmentExposesInputOptions(t *testing.T) {
	dataset, matrix := loadData(t)
	fragment := calculator.BuildFragment(dataset, matrix, calculator.DefaultState(), "en")
	if len(fragment.TabOptions) != 3 || len(fragment.RegionOptions) == 0 {
		t.Fatal("tab and region options must list the closed vocabularies")
	}
	if len(fragment.AdultOptions) != 2 || len(fragment.KidOptions) != 4 {
		t.Fatal("household options must list the closed counts")
	}
	if len(fragment.CountryOptions) == 0 || len(fragment.CityOptions) == 0 {
		t.Fatal("country and city options must list the dataset roster")
	}
	if len(fragment.RoleOptions) == 0 || len(fragment.CurrencyOptions) == 0 {
		t.Fatal("role and currency options must list the closed rosters")
	}
	singapore := false
	for _, option := range fragment.CityOptions {
		if option.Value == "" || option.Label == "" {
			t.Fatalf("city option = %+v, want value and label", option)
		}
		if option.Value == "singapore" {
			singapore = true
		}
	}
	if !singapore {
		t.Fatal("city options must include singapore")
	}
	localized := calculator.BuildFragment(dataset, matrix, calculator.DefaultState(), "id")
	for _, option := range localized.CityOptions {
		if option.Value == "singapore" && option.Label != "Singapura" {
			t.Fatalf("id city label = %q, want the Indonesian name", option.Label)
		}
	}
	for _, option := range localized.RoleOptions {
		if option.Value == "senior_swe" && option.Label != "Insinyur Perangkat Lunak Senior" {
			t.Fatalf("id role label = %q, want the Indonesian name", option.Label)
		}
	}
	unlabeled := calculator.RoleMatrix{Ladder: []calculator.LadderRung{
		{Role: "id-only", Rank: 1, Label: calculator.LocalizedString{ID: "Hanya ID"}},
		{Role: "nameless", Rank: 2, Label: calculator.LocalizedString{}},
	}}
	english := unlabeled.RoleOptions("en")
	if english[0].Label != "Hanya ID" {
		t.Fatalf("missing English label = %q, want the Indonesian fallback", english[0].Label)
	}
	if english[1].Label != "nameless" {
		t.Fatalf("missing labels = %q, want the raw role", english[1].Label)
	}
	if got := unlabeled.RoleOptions("id")[0].Label; got != "Hanya ID" {
		t.Fatalf("id label = %q, want the Indonesian name", got)
	}
}

func TestCalculatorFragmentNeedsCityGuidance(t *testing.T) {
	dataset, matrix := loadData(t)
	if !calculator.DecodeFragment(mustParseCalculatorQuery(t, ""), dataset, matrix, "en").NeedsCity {
		t.Fatal("a missing city selection must request guidance")
	}
	if calculator.DecodeFragment(mustParseCalculatorQuery(t, "city=no-such-city"), dataset, matrix, "en").NeedsCity {
		t.Fatal("a reconciled-away city keeps the fallback behavior, not guidance")
	}
	withCity, _ := decodeCalculatorState(t, dataset, "city=singapore")
	if calculator.BuildFragment(dataset, matrix, withCity, "en").NeedsCity {
		t.Fatal("a selected city must not request guidance")
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
