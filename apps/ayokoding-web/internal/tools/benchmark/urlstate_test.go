package benchmark_test

import (
	"encoding/json"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/benchmark"
)

func TestDecodeBenchmarkURLVectors(t *testing.T) {
	dataset := loadDataset(t)
	var vectors []struct {
		Query string            `json:"query"`
		State map[string]string `json:"state"`
	}
	if err := json.Unmarshal(loadVectors(t, "url-state.json")["benchmark"], &vectors); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if len(vectors) != 5 {
		t.Fatalf("benchmark URL vectors = %d, want 5", len(vectors))
	}
	for _, vector := range vectors {
		state, validity := benchmark.DecodeState(mustParseBenchmarkQuery(t, vector.Query), dataset)
		if validity != benchmark.Valid {
			t.Fatalf("query %q must decode valid", vector.Query)
		}
		want := benchmark.UrlState{
			Harness:    vector.State["harness"],
			Tier:       vector.State["tier"],
			Sub:        vector.State["sub"],
			SubHarness: vector.State["subHarness"],
		}
		// The shared vector omits the sub-harness key when the default
		// harness applies; decoding expresses the same unset state.
		if state != want {
			t.Fatalf("query %q = %+v, want %+v", vector.Query, state, want)
		}
	}
}

func TestBenchmarkURLRoundTripPreservesState(t *testing.T) {
	dataset := loadDataset(t)
	original := benchmark.UrlState{Harness: "cursor", Tier: "planning", Sub: "gpt-5.6-terra", SubHarness: "command-code"}
	restored, validity := benchmark.DecodeState(mustParseBenchmarkQuery(t, benchmark.EncodeState(original, "command-code-pro")), dataset)
	if validity != benchmark.Valid {
		t.Fatal("round trip must decode valid")
	}
	if restored != original {
		t.Fatalf("round trip = %+v, want %+v", restored, original)
	}
}

func TestBenchmarkEncodeOmitsDefaults(t *testing.T) {
	if got := benchmark.EncodeState(benchmark.UrlState{}, "command-code-pro"); got != "" {
		t.Fatalf("empty state encodes to %q, want empty", got)
	}
	if got := benchmark.EncodeState(benchmark.UrlState{Harness: "cursor"}, "command-code-pro"); got != "harness=cursor" {
		t.Fatalf("single option encodes to %q", got)
	}
	state := benchmark.UrlState{SubHarness: "command-code-pro"}
	if got := benchmark.EncodeState(state, "command-code-pro"); got != "" {
		t.Fatalf("default sub-harness encodes to %q, want empty", got)
	}
	full := benchmark.UrlState{Harness: "cursor", Tier: "planning", Sub: "gpt-5.6-terra", SubHarness: "command-code"}
	want := "harness=cursor&tier=planning&sub=gpt-5.6-terra&sub-harness=command-code"
	if got := benchmark.EncodeState(full, "command-code-pro"); got != want {
		t.Fatalf("full state encodes to %q, want %q", got, want)
	}
}

func TestBenchmarkDuplicateParameterUsesFirstValue(t *testing.T) {
	dataset := loadDataset(t)
	state, validity := benchmark.DecodeState(mustParseBenchmarkQuery(t, "harness=cursor&harness=codex-cli&tier=planning&tier=ultra"), dataset)
	if validity != benchmark.Valid {
		t.Fatal("duplicates must decode valid")
	}
	if state.Harness != "cursor" || state.Tier != "planning" {
		t.Fatalf("duplicates resolve to %+v, want first values", state)
	}
}

func TestBenchmarkUnknownScalarRecoversToUnset(t *testing.T) {
	dataset := loadDataset(t)
	state, validity := benchmark.DecodeState(mustParseBenchmarkQuery(t, "harness=nope&tier=nope&sub=nope&sub-harness=nope"), dataset)
	if validity != benchmark.Valid {
		t.Fatal("unknown scalars must decode valid with defaults")
	}
	if state != (benchmark.UrlState{}) {
		t.Fatalf("unknown scalars recover to %+v, want unset", state)
	}
}

func TestBenchmarkNestedOrUnexpectedFieldIsInvalidFilters(t *testing.T) {
	dataset := loadDataset(t)
	for _, query := range []string{
		"harness[cursor]=1",
		"harness[]=cursor",
		"filter=harness:cursor",
		"harness=cursor&debug=1",
		"locale=id",
	} {
		_, validity := benchmark.DecodeState(mustParseBenchmarkQuery(t, query), dataset)
		if validity != benchmark.InvalidFilters {
			t.Fatalf("query %q must yield invalid-filters", query)
		}
	}
}

func TestBenchmarkRosterScopeMatchesVectors(t *testing.T) {
	var expected struct {
		En map[string]string `json:"en"`
		ID map[string]string `json:"id"`
	}
	if err := json.Unmarshal(loadVectors(t, "url-state.json")["benchmarkRosterScope"], &expected); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	dataset := loadDataset(t)
	frontier, catalogs, inHouse := benchmark.RosterScope(dataset, "en")
	if frontier != expected.En["frontier"] || catalogs != expected.En["catalogs"] || inHouse != expected.En["inHouse"] {
		t.Fatalf("en scope = %q/%q/%q, want %v", frontier, catalogs, inHouse, expected.En)
	}
	frontier, catalogs, inHouse = benchmark.RosterScope(dataset, "id")
	if frontier != expected.ID["frontier"] || catalogs != expected.ID["catalogs"] || inHouse != expected.ID["inHouse"] {
		t.Fatalf("id scope = %q/%q/%q, want %v", frontier, catalogs, inHouse, expected.ID)
	}
}

func TestLoadDatasetRejectsInvalidInput(t *testing.T) {
	for _, raw := range []string{
		`not json`,
		`{}`,
		`{"dataset":{"lastUpdated":"2026-10-14","models":[]},"benchmarks":{"specs":[]}}`,
	} {
		if _, err := benchmark.LoadDataset([]byte(raw)); err == nil {
			t.Fatalf("input %q must be rejected", raw)
		}
	}
}

func TestBenchmarkSubTargetMustBeFrontierRosterModel(t *testing.T) {
	dataset := loadDataset(t)
	state, validity := benchmark.DecodeState(mustParseBenchmarkQuery(t, "sub=composer-2.5"), dataset)
	if validity != benchmark.Valid {
		t.Fatal("non-frontier sub must decode valid with the target dropped")
	}
	if state.Sub != "" {
		t.Fatalf("non-frontier sub survives as %q, want unset", state.Sub)
	}
}
