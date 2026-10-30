package benchmark_test

import (
	"encoding/json"
	"net/url"
	"os"
	"path/filepath"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/benchmark"
)

func testDataRoot(t *testing.T) string {
	t.Helper()
	root := filepath.Join("..", "..", "..", "..", "..", "libs", "ayokoding-data")
	if _, err := os.Stat(filepath.Join(root, "data", "ai-benchmark.json")); err != nil {
		t.Fatalf("shared data is missing: %v", err)
	}
	return root
}

func loadDataset(t *testing.T) *benchmark.Dataset {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join(testDataRoot(t), "data", "ai-benchmark.json"))
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}
	dataset, err := benchmark.LoadDataset(raw)
	if err != nil {
		t.Fatalf("LoadDataset: %v", err)
	}
	return dataset
}

func loadVectors(t *testing.T, name string) map[string]json.RawMessage {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join(testDataRoot(t), "test-vectors", name))
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}
	var vectors map[string]json.RawMessage
	if err := json.Unmarshal(raw, &vectors); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	return vectors
}

func modelByID(t *testing.T, dataset *benchmark.Dataset, id string) *benchmark.Model {
	t.Helper()
	for index := range dataset.Models {
		if dataset.Models[index].ID == id {
			return &dataset.Models[index]
		}
	}
	t.Fatalf("model %q is missing from the shared dataset", id)
	return nil
}

func mustParseBenchmarkQuery(t *testing.T, encoded string) url.Values {
	t.Helper()
	query, err := url.ParseQuery(encoded)
	if err != nil {
		t.Fatalf("ParseQuery: %v", err)
	}
	return query
}

func TestLoadDatasetPreservesOrderDatesAndProvenance(t *testing.T) {
	dataset := loadDataset(t)
	if dataset.LastUpdated != "2026-10-14" {
		t.Fatalf("lastUpdated = %q, want the shared source date", dataset.LastUpdated)
	}
	if len(dataset.Models) != 93 {
		t.Fatalf("models = %d, want the shared roster size", len(dataset.Models))
	}
	if dataset.Models[0].ID != "claude-fable-5-1" {
		t.Fatalf("first model = %q, want source order", dataset.Models[0].ID)
	}
	specs := []benchmark.BenchSpec{
		{ID: "deep-swe", Version: "1.1"},
		{ID: "terminal-bench", Version: "4.0"},
		{ID: "swe-atlas-qna", Version: "QnA"},
	}
	for index, want := range specs {
		got, ok := dataset.Spec(want.ID)
		if !ok {
			t.Fatalf("spec %q is missing", want.ID)
		}
		if got.Version != want.Version {
			t.Fatalf("spec %q version = %q, want %q", want.ID, got.Version, want.Version)
		}
		_ = index
	}
	if len(dataset.Operators) == 0 || len(dataset.PriceSources) == 0 {
		t.Fatal("operator and price provenance must travel with the dataset")
	}
	for _, operator := range dataset.Operators {
		if operator.CheckedOn == "" || operator.ID == "" {
			t.Fatalf("operator provenance is incomplete: %+v", operator)
		}
	}
}

func TestCompositeIndexMatchesSharedVectors(t *testing.T) {
	dataset := loadDataset(t)
	var expected map[string]*float64
	if err := json.Unmarshal(loadVectors(t, "benchmark.json")["compositeIndex"], &expected); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if len(expected) == 0 {
		t.Fatal("no composite vectors to check")
	}
	for id, want := range expected {
		got, ok := dataset.CompositeIndex(modelByID(t, dataset, id))
		if want == nil {
			if ok {
				t.Fatalf("index(%s) = %v, want undefined", id, got)
			}
			continue
		}
		if !ok || got != *want {
			t.Fatalf("index(%s) = %v,%v want %v", id, got, ok, *want)
		}
	}
}

func TestScoredBenchmarksMatchSharedVectors(t *testing.T) {
	dataset := loadDataset(t)
	var expected map[string][]string
	if err := json.Unmarshal(loadVectors(t, "benchmark.json")["scoredBenchmarks"], &expected); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	for id, want := range expected {
		got := dataset.ScoredBenchmarks(modelByID(t, dataset, id))
		if len(got) != len(want) {
			t.Fatalf("scored(%s) = %v, want %v", id, got, want)
		}
		for index := range want {
			if got[index] != want[index] {
				t.Fatalf("scored(%s) = %v, want %v", id, got, want)
			}
		}
	}
}

func TestTiersMatchSharedVectors(t *testing.T) {
	dataset := loadDataset(t)
	var expected map[string]string
	if err := json.Unmarshal(loadVectors(t, "benchmark.json")["tiers"], &expected); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	for id, want := range expected {
		if got := dataset.AssignTier(modelByID(t, dataset, id)); got != want {
			t.Fatalf("tier(%s) = %q, want %q", id, got, want)
		}
	}
}

func TestBlendedPriceMatchesSharedVectors(t *testing.T) {
	dataset := loadDataset(t)
	var expected map[string]*float64
	if err := json.Unmarshal(loadVectors(t, "benchmark.json")["blendedPrice"], &expected); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	for id, want := range expected {
		got, ok := benchmark.BlendedPrice(modelByID(t, dataset, id).Price, 3, 1)
		if want == nil {
			if ok {
				t.Fatalf("blended(%s) = %v, want undefined", id, got)
			}
			continue
		}
		if !ok || got != *want {
			t.Fatalf("blended(%s) = %v,%v want %v", id, got, ok, *want)
		}
	}
}

func TestPriceRatioMatchesSharedVectors(t *testing.T) {
	dataset := loadDataset(t)
	var expected []struct {
		Candidate string   `json:"candidate"`
		Reference string   `json:"reference"`
		Value     *float64 `json:"value"`
	}
	if err := json.Unmarshal(loadVectors(t, "benchmark.json")["priceRatio"], &expected); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if len(expected) != 2 {
		t.Fatalf("priceRatio vectors = %d, want 2", len(expected))
	}
	for _, vector := range expected {
		got, ok := benchmark.PriceRatio(
			modelByID(t, dataset, vector.Candidate),
			modelByID(t, dataset, vector.Reference), 3, 1,
		)
		if vector.Value == nil {
			if ok {
				t.Fatalf("ratio(%s/%s) = %v, want undefined", vector.Candidate, vector.Reference, got)
			}
			continue
		}
		if !ok || got != *vector.Value {
			t.Fatalf("ratio(%s/%s) = %v,%v want %v", vector.Candidate, vector.Reference, got, ok, *vector.Value)
		}
	}
}

func TestFilterCountsMatchSharedVectors(t *testing.T) {
	dataset := loadDataset(t)
	var expected []struct {
		State map[string]string `json:"state"`
		Count int               `json:"count"`
	}
	if err := json.Unmarshal(loadVectors(t, "benchmark.json")["filterCounts"], &expected); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if len(expected) != 5 {
		t.Fatalf("filter vectors = %d, want 5", len(expected))
	}
	for _, vector := range expected {
		state := benchmark.UrlState{
			Harness: vector.State["harness"],
			Tier:    vector.State["tier"],
		}
		if got := len(benchmark.FilterModels(dataset.Models, state, dataset)); got != vector.Count {
			t.Fatalf("filter(%v) = %d models, want %d", vector.State, got, vector.Count)
		}
	}
}

func TestSubstitutesMatchSharedVector(t *testing.T) {
	dataset := loadDataset(t)
	var expected struct {
		Target  string `json:"target"`
		Harness string `json:"harness"`
		Kind    string `json:"kind"`
		Options []struct {
			ID    string  `json:"id"`
			Tier  string  `json:"tier"`
			Index float64 `json:"index"`
		} `json:"options"`
	}
	if err := json.Unmarshal(loadVectors(t, "benchmark.json")["substitutes"], &expected); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	result := benchmark.SubstitutesFor(modelByID(t, dataset, expected.Target), dataset, expected.Harness)
	if result.Kind != expected.Kind {
		t.Fatalf("substitutes kind = %q, want %q", result.Kind, expected.Kind)
	}
	if len(result.Models) != len(expected.Options) {
		t.Fatalf("substitutes = %d models, want %d", len(result.Models), len(expected.Options))
	}
	for index, want := range expected.Options {
		got := result.Models[index]
		if got.Model.ID != want.ID {
			t.Fatalf("substitute[%d] = %q, want %q (order)", index, got.Model.ID, want.ID)
		}
		if got.Tier != want.Tier {
			t.Fatalf("substitute[%d] tier = %q, want %q", index, got.Tier, want.Tier)
		}
		if got.Index == nil || *got.Index != want.Index {
			t.Fatalf("substitute[%d] index = %v, want %v", index, got.Index, want.Index)
		}
	}
}

func TestInsufficientTargetHasNoSubstitutes(t *testing.T) {
	dataset := loadDataset(t)
	result := benchmark.SubstitutesFor(modelByID(t, dataset, "claude-haiku-4-5"), dataset, "command-code-pro")
	if result.Kind != "insufficient" || len(result.Models) != 0 {
		t.Fatalf("insufficient target must yield no substitutes, got %+v", result)
	}
}
