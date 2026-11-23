package benchmark_test

import (
	"net/url"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/benchmark"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/shareddata"
)

// loadDataset decodes the shared AI benchmark dataset from the embedded copy
// the build vendors, so the unit run reads no disk.
func loadDataset(t *testing.T) *benchmark.Dataset {
	t.Helper()
	raw, err := shareddata.Benchmark()
	if err != nil {
		t.Fatalf("shared benchmark data: %v", err)
	}
	dataset, err := benchmark.LoadDataset(raw)
	if err != nil {
		t.Fatalf("LoadDataset: %v", err)
	}
	return dataset
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
