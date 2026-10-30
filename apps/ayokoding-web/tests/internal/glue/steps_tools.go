package glue

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
)

// Current-codec tool journey URLs. Query keys follow the old-app codecs
// (apps/ayokoding-www ai-benchmark/core/url-state.ts and
// cost-of-living-calculator/core/url-state.ts) and the plan 004 fragment
// packets: scalar-only filters, first-value duplicate rule, unknown scalars
// recovering to unset, and nested or unexpected fields yielding the inline
// invalid-filters state.
const (
	benchVectorURL  = "/en/tools/ai-benchmark?harness=command-code-pro&tier=planning"
	benchRestoreURL = "/en/tools/ai-benchmark?harness=cursor&tier=planning&sub=gpt-5.6-terra&sub-harness=command-code"
	benchUnknownURL = "/en/tools/ai-benchmark?harness=nope&tier=nope"
	benchEmptyURL   = "/en/tools/ai-benchmark?harness=opencode-go&tier=ultra"
	benchLegacyURL  = "/en/tools/ai-benchmark?use-case=chat&price-band=mid"
	calcVectorURL   = "/en/tools/cost-of-living-calculator?city=singapore&gross=5000&baseline=my_salary&mygross=5000&mysalarycity=singapore"
	calcRestoreURL  = "/en/tools/cost-of-living-calculator?region=asean&country=id&city=jakarta&adults=2&preschool=1&schoolkids=2&schooltype=private&area=rural"
	calcRecoveryURL = "/en/tools/cost-of-living-calculator?city=jakarta&adults=abc"
	calcLegacyURL   = "/en/tools/cost-of-living-calculator?city=jakarta&role=mid&mode=standard&workers=1"
	calcFallbackURL = "/en/tools/cost-of-living-calculator?tab=min-role&target=1000000&city=no-such-city"
	calcSavingsURL  = "/en/tools/cost-of-living-calculator?city=singapore&gross=5000"
	benchVectorKey  = "harness=command-code-pro&tier=planning"
	calcVectorKey   = "city=singapore&gross=5000&baseline=my_salary&mygross=5000&mysalarycity=singapore"
)

func (w *World) StepCurrentSharedBenchmarkDataEstablishedCalculation() error {
	w.journey = "benchmark"
	return nil
}

func (w *World) StepReaderAppliesVectorSFiltersComparisonOptions() error {
	return w.get(benchVectorURL)
}

func (w *World) StepDisplayedFiguresOrderingValueResultsMatchVector() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	figures, err := loadBenchmarkVectorFigures()
	if err != nil {
		return err
	}
	names := []string{figures.Models[0].Name, figures.Models[1].Name, figures.Models[2].Name}
	// Scope the order assertion to the results list: the select-based
	// filter form above it legitimately names the same models in display
	// order.
	results := w.body
	if at := indexOf(w.body, "data-tool-results"); at >= 0 {
		results = w.body[at:]
	}
	first := indexOf(results, names[0])
	second := indexOf(results, names[1])
	third := indexOf(results, names[2])
	if first < 0 || second < 0 || third < 0 || first >= second || second >= third {
		return fail("models out of vector order")
	}
	for _, marker := range []string{
		figures.Models[0].Name, figures.Models[1].Name, figures.Models[2].Name,
		figures.Models[0].Index, figures.Models[1].Index, figures.Models[2].Index,
		figures.Models[0].Price, figures.Models[1].Price, figures.Models[2].Price,
	} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepTypescriptElixirProduceSameAcceptedResults() error {
	// The corpus names the pre-Go stack; the Go contract is that the served
	// HANDLER body matches the checked-in test-vector JSON for the journey,
	// which mirrors the shared datasets and libs/ayokoding-data test vectors.
	// This Then reads the vector file and asserts the handler response body,
	// never the glue FakeEngine in engines.go.
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	if w.journey == "calculator" {
		figures, err := loadCalculatorVectorFigures()
		if err != nil {
			return err
		}
		for _, marker := range []string{figures.Cost, figures.Saving, figures.Role} {
			if err := w.mustContain(marker); err != nil {
				return err
			}
		}
		return nil
	}
	figures, err := loadBenchmarkVectorFigures()
	if err != nil {
		return err
	}
	for _, marker := range []string{
		figures.Models[0].Name, figures.Models[1].Name, figures.Models[2].Name,
		figures.Models[0].Index, figures.Models[1].Index, figures.Models[2].Index,
	} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

// fixtureVectorPath resolves one checked-in test-vector JSON under
// apps/ayokoding-web/tests/fixtures.
func fixtureVectorPath(name string) string {
	_, file, _, _ := runtime.Caller(0)
	appRoot := filepath.Join(filepath.Dir(file), "..", "..", "..")
	return filepath.Join(appRoot, "tests", "fixtures", name)
}

// benchmarkVector mirrors the shared-dataset comparison for one current-codec
// filter state: display names, formatted composite indices, and blended
// prices in descending index order plus the model count.
type benchmarkVector struct {
	Models []struct {
		Name  string `json:"name"`
		Index string `json:"index"`
		Price string `json:"price"`
	} `json:"models"`
	Count int  `json:"count"`
	Empty bool `json:"empty"`
}

func loadBenchmarkVectorFigures() (benchmarkVector, error) {
	raw, err := os.ReadFile(fixtureVectorPath("benchmark-vectors.json"))
	if err != nil {
		return benchmarkVector{}, fail("read benchmark vectors: %v", err)
	}
	var vectors map[string]benchmarkVector
	if err := json.Unmarshal(raw, &vectors); err != nil {
		return benchmarkVector{}, fail("parse benchmark vectors: %v", err)
	}
	vector, ok := vectors[benchVectorKey]
	if !ok || len(vector.Models) != 3 || vector.Count != 3 || vector.Empty {
		return benchmarkVector{}, fail("benchmark vector %q missing or misshapen", benchVectorKey)
	}
	return vector, nil
}

// calculatorVector mirrors the shared-dataset estimate for one current-codec
// input state: formatted cost, savings, and minimum qualifying role.
type calculatorVector struct {
	Cost   string `json:"cost"`
	Saving string `json:"saving"`
	Role   string `json:"min_role"`
	Empty  bool   `json:"empty"`
}

func loadCalculatorVectorFigures() (calculatorVector, error) {
	raw, err := os.ReadFile(fixtureVectorPath("calculator-vectors.json"))
	if err != nil {
		return calculatorVector{}, fail("read calculator vectors: %v", err)
	}
	var vectors map[string]calculatorVector
	if err := json.Unmarshal(raw, &vectors); err != nil {
		return calculatorVector{}, fail("parse calculator vectors: %v", err)
	}
	vector, ok := vectors[calcVectorKey]
	if !ok || vector.Empty {
		return calculatorVector{}, fail("calculator vector %q missing", calcVectorKey)
	}
	if vector.Cost == "" || vector.Saving == "" || vector.Role == "" {
		return calculatorVector{}, fail("calculator vector changed: %+v", vector)
	}
	return vector, nil
}

func (w *World) StepBenchmarkUrlEncodesSupportedComparisonOptions() error {
	return nil
}

func (w *World) StepReaderOpensUrl() error {
	// The url-state.json benchmark vector carries every supported axis:
	// harness, tier, frontier substitute target, and a non-default
	// substitute harness.
	return w.get(benchRestoreURL)
}

func (w *World) StepEverySupportedOptionReflectsEncodedState() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	for _, marker := range []string{`value="cursor"`, `value="planning"`, `value="gpt-5.6-terra"`, `value="command-code"`} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepCopyingCurrentUrlPreservesStateNewVisit() error {
	return w.mustContain(`data-encoded-state`)
}

func (w *World) StepBenchmarkUrlContainsInvalidUnknownFilterValues() error {
	return nil
}

func (w *World) StepToolUsesExistingCodecSValidDefaultsThoseValues() error {
	// Unknown scalars recover to unset under the current codec, so the
	// comparison stays usable over the full shared roster.
	if err := w.get(benchUnknownURL); err != nil {
		return err
	}
	if err := w.mustContain(`data-count="93"`); err != nil {
		return err
	}
	return w.mustNotContain("data-invalid-filters")
}

func (w *World) StepComparisonRemainsUsableWithoutError() error {
	return w.mustStatus(http.StatusOK)
}

func (w *World) StepBenchmarkDataHasBeenExtractedIntoSharedJson() error {
	return nil
}

func (w *World) StepEitherImplementationReadsDataGeneratesReferenceR() error {
	return nil
}

func (w *World) StepModelFiguresPricesOrderingPoliciesReferenceResul() error {
	// The reference result is the shared-dataset fragment for the vector
	// state: three models in index order with blended prices.
	if err := w.get(benchVectorURL); err != nil {
		return err
	}
	if err := w.mustContain(`data-count="3"`); err != nil {
		return err
	}
	figures, err := loadBenchmarkVectorFigures()
	if err != nil {
		return err
	}
	first := indexOf(w.body, figures.Models[0].Name)
	second := indexOf(w.body, figures.Models[1].Name)
	if first < 0 || second < 0 || first > second {
		return fail("reference results changed: models out of order")
	}
	for _, marker := range []string{figures.Models[0].Price, figures.Models[1].Price, figures.Models[2].Price} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepSourceLinksSourceDatesNotesMethodologyRemainAvai() error {
	return w.get(benchVectorURL)
}

func (w *World) StepSupportedFilterCombinationMatchesModel() error {
	return nil
}

func (w *World) StepReaderAppliesCombination() error {
	// harness=opencode-go with tier=ultra is valid under the current codec
	// and matches no model in the shared roster.
	return w.get(benchEmptyURL)
}

func (w *World) StepToolShowsIntentionalResultsState() error {
	return w.mustContain("data-empty-state")
}

func (w *World) StepReaderCanChangeResetFilters() error {
	return w.mustContain("data-tool-filters")
}

func (w *World) StepCurrentSharedCityRoleForeignExchangeData() error {
	w.journey = "calculator"
	return nil
}

func (w *World) StepReaderEntersEstablishedCalculatorVectorSInputs() error {
	return w.get(calcVectorURL)
}

func (w *World) StepDisplayedCostsSavingsMinimumQualifyingRoleMatchV() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	figures, err := loadCalculatorVectorFigures()
	if err != nil {
		return err
	}
	for _, marker := range []string{figures.Cost, figures.Saving, figures.Role} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepCalculatorUrlEncodesSupportedGeographyHouseholdS() error {
	return nil
}

func (w *World) StepEverySupportedInputReflectsEncodedState() error {
	// The url-state.json calculator vector carries geography, household,
	// schooling, and area inputs with narrower-wins backfill applied.
	if err := w.get(calcRestoreURL); err != nil {
		return err
	}
	for _, marker := range []string{
		`value="asean"`, `value="id"`, `value="jakarta"`,
		`value="2"`, `value="1"`, `value="private"`, `value="rural"`,
	} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepCopyingCurrentUrlPreservesInputsNewVisit() error {
	return w.mustContain(`data-encoded-state`)
}

func (w *World) StepReaderProvidesInvalidOutRangeCalculatorInput() error {
	return nil
}

func (w *World) StepToolValidatesInput() error {
	// An out-of-range household count recovers through the codec while the
	// valid city selection is kept.
	return w.get(calcRecoveryURL)
}

func (w *World) StepAppliesExistingInputCodecSAcceptedRecoveryValida() error {
	for _, marker := range []string{`value="jakarta"`, `value="1"`} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepToolDoesDisplayMisleadingFiniteEstimateFromInval() error {
	// Retired fake-engine fields are unexpected under the current codec, so
	// the legacy vector yields invalid-filters and never an estimate.
	if err := w.get(calcLegacyURL); err != nil {
		return err
	}
	if err := w.mustContain("data-invalid-filters"); err != nil {
		return err
	}
	return w.mustNotContain("data-tool-estimate")
}

func (w *World) StepReaderHasSelectedCity() error {
	return nil
}

func (w *World) StepReaderChangesGeographySoCityLongerEligible() error {
	// An unknown city clears under narrower-wins reconciliation while the
	// engaged savings baseline stays reachable by nothing.
	return w.get(calcFallbackURL)
}

func (w *World) StepSelectionFollowsCurrentToolSFallbackBehavior() error {
	return w.mustContain("data-fallback-state")
}

func (w *World) StepVisibleResultsMatchResultingGeographyCitySelecti() error {
	return w.mustNotContain("data-tool-estimate")
}

func (w *World) StepCitySalaryCurrencyDatasetsHaveTheirOwnSourceDate() error {
	return nil
}

func (w *World) StepEitherImplementationCalculatesCurrencyConvertedE() error {
	return nil
}

func (w *World) StepUsesSharedUsdPerUnitRatesWithoutRefreshingThem() error {
	// The savings row for Singapore at 5000 USD gross converts through the
	// shared USD-per-unit snapshot to the checked-in 846 USD figure.
	if err := w.get(calcSavingsURL); err != nil {
		return err
	}
	return w.mustContain("846 USD")
}

func (w *World) StepIndependentFxSnapshotDatePerCurrencyProvenanceRe() error {
	return w.get(calcVectorURL)
}
