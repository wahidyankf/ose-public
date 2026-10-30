package shareddata

import "embed"

//go:embed data/*.json
var datasets embed.FS

// Benchmark returns the embedded shared AI benchmark JSON.
func Benchmark() ([]byte, error) {
	return datasets.ReadFile("data/ai-benchmark.json")
}

// CostOfLiving returns the embedded shared cost-of-living JSON.
func CostOfLiving() ([]byte, error) {
	return datasets.ReadFile("data/cost-of-living.json")
}

// Fx returns the embedded shared FX snapshot JSON.
func Fx() ([]byte, error) {
	return datasets.ReadFile("data/fx.json")
}
