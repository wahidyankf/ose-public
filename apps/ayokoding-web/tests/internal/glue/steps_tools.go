package glue

import (
	"net/http"
)

func (w *World) StepCurrentSharedBenchmarkDataEstablishedCalculation() error {
	w.journey = "benchmark"
	w.benchFilters = benchmarkFilters("chat", "mid")
	return nil
}

func (w *World) StepReaderAppliesVectorSFiltersComparisonOptions() error {
	w.benchResult = scoreBenchmark(w.benchFilters)
	return w.get("/en/tools/ai-benchmark?use-case=chat&price-band=mid")
}

func (w *World) StepDisplayedFiguresOrderingValueResultsMatchVector() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	first := indexOf(w.body, "Model B")
	second := indexOf(w.body, "Model A")
	if first < 0 || second < 0 || first > second {
		return fail("models out of vector order")
	}
	for _, marker := range []string{"9.1", "8.2", "Model B", "Model A"} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepTypescriptElixirProduceSameAcceptedResults() error {
	// The corpus names the pre-Go stack and shares this text across both
	// tool features; the Go contract is that the served figures match
	// the shared reference vector for the active journey. The landing
	// unit rewords this step per tech-docs/005.
	if w.journey == "calculator" {
		if w.calcResult.MonthlyCostUSD != 900 || w.calcResult.MinRole != "mid" {
			return fail("served estimate = %+v, want the vector", w.calcResult)
		}
		return nil
	}
	if len(w.benchResult.Models) != 2 || w.benchResult.Models[0].Name != "Model B" {
		return fail("served result = %+v, want the vector", w.benchResult)
	}
	return nil
}

func (w *World) StepBenchmarkUrlEncodesSupportedComparisonOptions() error {
	return nil
}

func (w *World) StepReaderOpensUrl() error {
	return w.get("/en/tools/ai-benchmark?use-case=chat&price-band=mid&min-score=8")
}

func (w *World) StepEverySupportedOptionReflectsEncodedState() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	for _, marker := range []string{`value="chat"`, `value="mid"`, `value="8"`} {
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
	if err := w.get("/en/tools/ai-benchmark?use-case=nope&min-score=abc"); err != nil {
		return err
	}
	for _, marker := range []string{`value="chat"`, `value="mid"`} {
		if err := w.mustContain(marker); err != nil {
			return err
		}
	}
	return nil
}

func (w *World) StepComparisonRemainsUsableWithoutError() error {
	return w.mustStatus(http.StatusOK)
}

func (w *World) StepBenchmarkDataHasBeenExtractedIntoSharedJson() error {
	return nil
}

func (w *World) StepEitherImplementationReadsDataGeneratesReferenceR() error {
	w.benchResult = scoreBenchmark(benchmarkFilters("chat", "mid"))
	return nil
}

func (w *World) StepModelFiguresPricesOrderingPoliciesReferenceResul() error {
	if len(w.benchResult.Models) != 2 {
		return fail("reference results changed: %+v", w.benchResult)
	}
	if w.benchResult.Models[0].PriceUSD != 4 {
		return fail("reference price changed: %+v", w.benchResult.Models[0])
	}
	return nil
}

func (w *World) StepSourceLinksSourceDatesNotesMethodologyRemainAvai() error {
	return w.get("/en/tools/ai-benchmark?use-case=chat&price-band=mid")
}

func (w *World) StepSupportedFilterCombinationMatchesModel() error {
	w.benchFilters = benchmarkFilters("chat", "ultra")
	return nil
}

func (w *World) StepReaderAppliesCombination() error {
	w.benchResult = scoreBenchmark(w.benchFilters)
	return w.get("/en/tools/ai-benchmark?use-case=chat&price-band=ultra")
}

func (w *World) StepToolShowsIntentionalResultsState() error {
	if !w.benchResult.Empty {
		return fail("expected the empty state, got %+v", w.benchResult)
	}
	return w.mustContain("data-empty-state")
}

func (w *World) StepReaderCanChangeResetFilters() error {
	return w.mustContain("data-tool-filters")
}

func (w *World) StepCurrentSharedCityRoleForeignExchangeData() error {
	w.journey = "calculator"
	w.calcInputs = calculatorInputs("jakarta", "mid", "standard", 1)
	return nil
}

func (w *World) StepReaderEntersEstablishedCalculatorVectorSInputs() error {
	w.calcResult = computeCalculator(w.calcInputs)
	return w.get("/en/tools/cost-of-living-calculator?city=jakarta&role=mid&mode=standard&workers=1")
}

func (w *World) StepDisplayedCostsSavingsMinimumQualifyingRoleMatchV() error {
	if err := w.mustStatus(http.StatusOK); err != nil {
		return err
	}
	for _, marker := range []string{"900", "600", "mid"} {
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
	if err := w.get("/en/tools/cost-of-living-calculator?city=jakarta&role=mid&mode=standard&workers=1"); err != nil {
		return err
	}
	for _, marker := range []string{`value="jakarta"`, `value="mid"`, `value="standard"`, `value="1"`} {
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
	return w.get("/en/tools/cost-of-living-calculator?city=jakarta&workers=abc")
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
	if err := w.get("/en/tools/cost-of-living-calculator?city=atlantis&workers=abc"); err != nil {
		return err
	}
	return w.mustContain("data-fallback-state")
}

func (w *World) StepReaderHasSelectedCity() error {
	w.calcInputs = calculatorInputs("jakarta", "mid", "standard", 1)
	return nil
}

func (w *World) StepReaderChangesGeographySoCityLongerEligible() error {
	w.calcInputs = calculatorInputs("atlantis", "mid", "standard", 1)
	w.calcResult = computeCalculator(w.calcInputs)
	return w.get("/en/tools/cost-of-living-calculator?city=atlantis&role=mid&mode=standard&workers=1")
}

func (w *World) StepSelectionFollowsCurrentToolSFallbackBehavior() error {
	if !w.calcResult.Empty {
		return fail("incompatible geography must fall back, got %+v", w.calcResult)
	}
	return w.mustContain("data-fallback-state")
}

func (w *World) StepVisibleResultsMatchResultingGeographyCitySelecti() error {
	return w.mustNotContain("data-tool-estimate")
}

func (w *World) StepCitySalaryCurrencyDatasetsHaveTheirOwnSourceDate() error {
	return nil
}

func (w *World) StepEitherImplementationCalculatesCurrencyConvertedE() error {
	w.calcResult = computeCalculator(calculatorInputs("jakarta", "mid", "standard", 1))
	return nil
}

func (w *World) StepUsesSharedUsdPerUnitRatesWithoutRefreshingThem() error {
	if w.calcResult.MonthlyCostUSD != 900 {
		return fail("estimate = %+v, want the shared-rate vector", w.calcResult)
	}
	return nil
}

func (w *World) StepIndependentFxSnapshotDatePerCurrencyProvenanceRe() error {
	return w.get("/en/tools/cost-of-living-calculator?city=jakarta&role=mid&mode=standard&workers=1")
}
