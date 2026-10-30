package bdd

import (
	"github.com/cucumber/godog"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/tests/internal/glue"
)

func registerToolsSteps(ctx *godog.ScenarioContext, world *glue.World) {
	ctx.Given(`^the current shared benchmark data and an established calculation vector$`, world.StepCurrentSharedBenchmarkDataEstablishedCalculation)
	ctx.When(`^the reader applies that vector's filters and comparison options$`, world.StepReaderAppliesVectorSFiltersComparisonOptions)
	ctx.Then(`^the displayed figures, ordering, and value results match the vector$`, world.StepDisplayedFiguresOrderingValueResultsMatchVector)
	ctx.Step(`^TypeScript and Go produce the same accepted results$`, world.StepTypescriptElixirProduceSameAcceptedResults)
	ctx.Given(`^a benchmark URL encodes supported comparison options$`, world.StepBenchmarkUrlEncodesSupportedComparisonOptions)
	ctx.When(`^a reader opens that URL$`, world.StepReaderOpensUrl)
	ctx.Then(`^every supported option reflects the encoded state$`, world.StepEverySupportedOptionReflectsEncodedState)
	ctx.Step(`^copying the current URL preserves that state for a new visit$`, world.StepCopyingCurrentUrlPreservesStateNewVisit)
	ctx.Given(`^a benchmark URL contains invalid or unknown filter values$`, world.StepBenchmarkUrlContainsInvalidUnknownFilterValues)
	ctx.Then(`^the tool uses the existing codec's valid defaults for those values$`, world.StepToolUsesExistingCodecSValidDefaultsThoseValues)
	ctx.Step(`^the comparison remains usable without an error$`, world.StepComparisonRemainsUsableWithoutError)
	ctx.Given(`^the benchmark data has been extracted into shared JSON$`, world.StepBenchmarkDataHasBeenExtractedIntoSharedJson)
	ctx.When(`^either implementation reads the data and generates its reference results$`, world.StepEitherImplementationReadsDataGeneratesReferenceR)
	ctx.Then(`^model figures, prices, ordering policies, and reference results remain unchanged$`, world.StepModelFiguresPricesOrderingPoliciesReferenceResul)
	ctx.Step(`^the source links, source dates, notes, and methodology remain available$`, world.StepSourceLinksSourceDatesNotesMethodologyRemainAvai)
	ctx.Given(`^a supported filter combination matches no model$`, world.StepSupportedFilterCombinationMatchesModel)
	ctx.When(`^the reader applies that combination$`, world.StepReaderAppliesCombination)
	ctx.Then(`^the tool shows an intentional no-results state$`, world.StepToolShowsIntentionalResultsState)
	ctx.Step(`^the reader can change or reset the filters$`, world.StepReaderCanChangeResetFilters)
	ctx.Given(`^the current shared city, role, and foreign-exchange data$`, world.StepCurrentSharedCityRoleForeignExchangeData)
	ctx.When(`^a reader enters an established calculator vector's inputs$`, world.StepReaderEntersEstablishedCalculatorVectorSInputs)
	ctx.Then(`^the displayed costs, savings, and minimum qualifying role match that vector$`, world.StepDisplayedCostsSavingsMinimumQualifyingRoleMatchV)
	ctx.Given(`^a calculator URL encodes supported geography, household, schooling, and income options$`, world.StepCalculatorUrlEncodesSupportedGeographyHouseholdS)
	ctx.Then(`^every supported input reflects the encoded state$`, world.StepEverySupportedInputReflectsEncodedState)
	ctx.Step(`^copying the current URL preserves the inputs for a new visit$`, world.StepCopyingCurrentUrlPreservesInputsNewVisit)
	ctx.Given(`^a reader provides an invalid or out-of-range calculator input$`, world.StepReaderProvidesInvalidOutRangeCalculatorInput)
	ctx.When(`^the tool validates that input$`, world.StepToolValidatesInput)
	ctx.Then(`^it applies the existing input codec's accepted recovery or validation result$`, world.StepAppliesExistingInputCodecSAcceptedRecoveryValida)
	ctx.Step(`^the tool does not display a misleading finite estimate from invalid arithmetic$`, world.StepToolDoesDisplayMisleadingFiniteEstimateFromInval)
	ctx.Given(`^a reader has selected a city$`, world.StepReaderHasSelectedCity)
	ctx.When(`^the reader changes geography so that city is no longer eligible$`, world.StepReaderChangesGeographySoCityLongerEligible)
	ctx.Then(`^the selection follows the current tool's fallback behavior$`, world.StepSelectionFollowsCurrentToolSFallbackBehavior)
	ctx.Step(`^the visible results match the resulting geography and city selection$`, world.StepVisibleResultsMatchResultingGeographyCitySelecti)
	ctx.Given(`^the city, salary, and currency datasets have their own source dates$`, world.StepCitySalaryCurrencyDatasetsHaveTheirOwnSourceDate)
	ctx.When(`^either implementation calculates a currency-converted estimate$`, world.StepEitherImplementationCalculatesCurrencyConvertedE)
	ctx.Then(`^it uses the shared USD-per-unit rates without refreshing them$`, world.StepUsesSharedUsdPerUnitRatesWithoutRefreshingThem)
	ctx.Step(`^the independent FX snapshot date and per-currency provenance remain available$`, world.StepIndependentFxSnapshotDatePerCurrencyProvenanceRe)
}
