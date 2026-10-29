package glue

import (
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/benchmark"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
)

// The helpers below mirror the canned P1H vectors in internal/web/seed.go so
// godog steps can assert engine outcomes without duplicating HTTP parsing. P2
// replaces both call sites with the shared test vectors from ayokoding-data.

// benchmarkFilters builds one filter set for the canned vector keys.
func benchmarkFilters(useCase, priceBand string) benchmark.Filters {
	return benchmark.Filters{UseCase: useCase, PriceBand: priceBand}
}

// scoreBenchmark scores against the canned P1H benchmark vector.
func scoreBenchmark(filters benchmark.Filters) benchmark.Result {
	engine := benchmark.NewFakeEngine(map[string]benchmark.Result{
		"chat|mid": {Models: []benchmark.ModelResult{{Name: "Model B", Score: 9.1, PriceUSD: 4}, {Name: "Model A", Score: 8.2, PriceUSD: 2}}},
	})
	return engine.Score(filters)
}

// calculatorInputs builds one input set for the canned vector keys.
func calculatorInputs(city, role, mode string, workers int) calculator.Inputs {
	return calculator.Inputs{City: city, Role: role, Mode: mode, Workers: workers}
}

// computeCalculator estimates against the canned P1H calculator vector.
func computeCalculator(inputs calculator.Inputs) calculator.Estimate {
	engine := calculator.NewFakeEngine(map[string]calculator.Estimate{
		"jakarta|mid|standard|1": {MonthlyCostUSD: 900, MonthlySaving: 600, MinRole: "mid"},
	})
	return engine.Compute(inputs)
}
