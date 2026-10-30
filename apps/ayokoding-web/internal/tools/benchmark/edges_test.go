package benchmark_test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/benchmark"
)

func TestComputeTierGroupsCoversRosterInTierOrder(t *testing.T) {
	dataset := loadDataset(t)
	groups := benchmark.ComputeTierGroups(dataset.Models, dataset)
	total := 0
	for _, tier := range []string{"ultra", "planning", "execution", "fast", "insufficient"} {
		group, ok := groups[tier]
		if !ok {
			t.Fatalf("tier group %q is missing", tier)
		}
		total += len(group)
		for index := 1; index < len(group); index++ {
			previous, current := group[index-1].Index, group[index].Index
			if previous == nil && current != nil {
				t.Fatalf("tier %q orders an unrated model before a rated one", tier)
			}
			if previous != nil && current != nil && *previous < *current {
				t.Fatalf("tier %q is not index-descending", tier)
			}
		}
	}
	if total != len(dataset.Models) {
		t.Fatalf("tier groups hold %d models, want %d", total, len(dataset.Models))
	}
	if len(groups["ultra"]) != 9 {
		t.Fatalf("ultra group = %d, want the shared filter count 9", len(groups["ultra"]))
	}
}

func TestFrontierModelsAreSortedFrontierOnly(t *testing.T) {
	dataset := loadDataset(t)
	frontier := benchmark.FrontierModels(dataset.Models, dataset)
	if len(frontier) == 0 {
		t.Fatal("frontier roster is empty")
	}
	previous := ""
	for _, model := range frontier {
		if !dataset.IsFrontier(&model) {
			t.Fatalf("frontier roster leaks %q", model.ID)
		}
		lowered := lowerName(model.Name)
		if lowered < previous {
			t.Fatalf("frontier roster is not display-name ordered at %q", model.Name)
		}
		previous = lowered
	}
}

func lowerName(name string) string {
	lowered := make([]byte, len(name))
	for index := 0; index < len(name); index++ {
		char := name[index]
		if char >= 'A' && char <= 'Z' {
			char += 'a' - 'A'
		}
		lowered[index] = char
	}
	return string(lowered)
}

func TestScoreEdgesReturnUndefined(t *testing.T) {
	dataset := loadDataset(t)
	if _, ok := dataset.Spec("no-such-benchmark"); ok {
		t.Fatal("unknown spec must be missing")
	}
	thin := modelByID(t, dataset, "claude-haiku-4-5")
	if dataset.ScoredFigure(thin, "deep-swe") != nil {
		t.Fatal("thin model must have no scored figure")
	}
	if _, ok := dataset.ScoreOver(thin, []string{"deep-swe"}); ok {
		t.Fatal("thin model must have no score over deep-swe")
	}
	if _, ok := dataset.ScoreOver(thin, nil); ok {
		t.Fatal("empty benchmark list must not score")
	}
	if _, ok := dataset.CompositeIndex(thin); ok {
		t.Fatal("thin model must have no composite index")
	}
	if got := dataset.AssignTier(thin); got != "insufficient" {
		t.Fatalf("thin model tier = %q, want insufficient", got)
	}
	if _, ok := benchmark.BlendedPrice(nil, 3, 1); ok {
		t.Fatal("missing price must not blend")
	}
	unpriced := modelByID(t, dataset, "gemini-4-argon")
	priced := modelByID(t, dataset, "claude-opus-5")
	if _, ok := benchmark.PriceRatio(unpriced, priced, 3, 1); ok {
		t.Fatal("unpriced candidate must not ratio")
	}
	if _, ok := benchmark.PriceRatio(priced, unpriced, 3, 1); ok {
		t.Fatal("unpriced reference must not ratio")
	}
}

func TestDefaultSubHarnessOmitsOnEncode(t *testing.T) {
	dataset := loadDataset(t)
	state, validity := benchmark.DecodeState(mustParseBenchmarkQuery(t, "sub-harness=command-code-pro"), dataset)
	if validity != benchmark.Valid {
		t.Fatal("default sub-harness must decode valid")
	}
	if state.SubHarness != "command-code-pro" {
		t.Fatalf("decoded sub-harness = %q, want the default", state.SubHarness)
	}
	if got := benchmark.EncodeState(state, "command-code-pro"); got != "" {
		t.Fatalf("default sub-harness encodes to %q, want omission", got)
	}
	restored, validity := benchmark.DecodeState(mustParseBenchmarkQuery(t, benchmark.EncodeState(state, "command-code-pro")), dataset)
	if validity != benchmark.Valid || restored.SubHarness != "" {
		t.Fatalf("omitted default restores to unset, got %+v", restored)
	}
}

func TestDatasetValidationRejectsEachDefect(t *testing.T) {
	raw, err := os.ReadFile(filepath.Join(testDataRoot(t), "data", "ai-benchmark.json"))
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}
	var file map[string]json.RawMessage
	if err := json.Unmarshal(raw, &file); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	mutateDataset := func(mutate func(dataset map[string]json.RawMessage)) []byte {
		var dataset map[string]json.RawMessage
		if err := json.Unmarshal(file["dataset"], &dataset); err != nil {
			t.Fatalf("Unmarshal: %v", err)
		}
		mutate(dataset)
		inner, err := json.Marshal(dataset)
		if err != nil {
			t.Fatalf("Marshal: %v", err)
		}
		out := make(map[string]json.RawMessage, len(file))
		for key, value := range file {
			out[key] = value
		}
		out["dataset"] = inner
		encoded, err := json.Marshal(out)
		if err != nil {
			t.Fatalf("Marshal: %v", err)
		}
		return encoded
	}
	mutateBenchmarks := func(mutate func(config map[string]json.RawMessage)) []byte {
		var config map[string]json.RawMessage
		if err := json.Unmarshal(file["benchmarks"], &config); err != nil {
			t.Fatalf("Unmarshal: %v", err)
		}
		mutate(config)
		inner, err := json.Marshal(config)
		if err != nil {
			t.Fatalf("Marshal: %v", err)
		}
		out := make(map[string]json.RawMessage, len(file))
		for key, value := range file {
			out[key] = value
		}
		out["benchmarks"] = inner
		encoded, err := json.Marshal(out)
		if err != nil {
			t.Fatalf("Marshal: %v", err)
		}
		return encoded
	}
	cases := map[string][]byte{
		"missing date": mutateDataset(func(dataset map[string]json.RawMessage) {
			delete(dataset, "lastUpdated")
		}),
		"empty models": mutateDataset(func(dataset map[string]json.RawMessage) {
			dataset["models"] = json.RawMessage(`[]`)
		}),
		"model without id": mutateDataset(func(dataset map[string]json.RawMessage) {
			var models []map[string]json.RawMessage
			if err := json.Unmarshal(dataset["models"], &models); err != nil {
				t.Fatalf("Unmarshal: %v", err)
			}
			delete(models[0], "id")
			encoded, err := json.Marshal(models)
			if err != nil {
				t.Fatalf("Marshal: %v", err)
			}
			dataset["models"] = encoded
		}),
		"empty specs": mutateBenchmarks(func(config map[string]json.RawMessage) {
			config["specs"] = json.RawMessage(`[]`)
		}),
		"empty tiers": mutateBenchmarks(func(config map[string]json.RawMessage) {
			config["tiers"] = json.RawMessage(`[]`)
		}),
		"zero minimum": mutateBenchmarks(func(config map[string]json.RawMessage) {
			config["minScoredBenchmarks"] = json.RawMessage(`0`)
		}),
		"incomplete spec": mutateBenchmarks(func(config map[string]json.RawMessage) {
			config["specs"] = json.RawMessage(`[{"id":"","version":"1","weight":1}]`)
		}),
		"no display names": mutateBenchmarks(func(config map[string]json.RawMessage) {
			delete(config, "harnessDisplayNames")
		}),
	}
	for name, input := range cases {
		if _, err := benchmark.LoadDataset(input); err == nil {
			t.Fatalf("%s must be rejected", name)
		}
	}
}

func syntheticDataset(t *testing.T, anchors map[string]string, nearestCount int) *benchmark.Dataset {
	t.Helper()
	figure := func(id string, value float64) map[string]any {
		return map[string]any{
			"benchmark": id, "version": "1.1", "value": value,
			"operator": "artificial-analysis", "config": "test", "source": "https://example.test",
		}
	}
	model := func(id, vendor string, index float64, harnesses []string, price *map[string]any) map[string]any {
		figures := []map[string]any{figure("deep-swe", index), figure("terminal-bench", index)}
		out := map[string]any{
			"id": id, "name": "Model " + id, "vendor": vendor, "line": "L",
			"access": "general", "harnesses": harnesses, "figures": figures,
		}
		if price != nil {
			out["price"] = *price
		}
		return out
	}
	priced := func(input float64) *map[string]any {
		price := map[string]any{"input": input, "output": input, "source": "https://example.test", "listedBy": "vendor"}
		return &price
	}
	file := map[string]any{
		"dataset": map[string]any{
			"lastUpdated": "2026-10-14",
			"models": []map[string]any{
				model("anchor-ultra", "Anthropic", 60, []string{}, priced(4)),
				model("anchor-planning", "Anthropic", 50, []string{}, priced(4)),
				model("anchor-execution", "Anthropic", 40, []string{}, priced(4)),
				model("target", "Anthropic", 70, []string{}, priced(4)),
				model("mid1", "Other", 45, []string{"h1"}, priced(2)),
				model("mid2", "Other", 45, []string{"h1"}, priced(10)),
				model("mid3", "Other", 45, []string{"h1"}, nil),
				model("mid0", "Other", 45, []string{"h1"}, priced(2)),
			},
		},
		"benchmarks": map[string]any{
			"specs": []map[string]any{
				{"id": "deep-swe", "name": "Deep", "version": "1.1", "weight": 1, "operatorOrder": []string{"artificial-analysis"}, "url": "https://example.test"},
				{"id": "terminal-bench", "name": "Terminal", "version": "1.1", "weight": 1, "operatorOrder": []string{"artificial-analysis"}, "url": "https://example.test"},
				{"id": "swe-atlas-qna", "name": "Atlas", "version": "QnA", "weight": 1, "operatorOrder": []string{"artificial-analysis"}, "url": "https://example.test"},
			},
			"minScoredBenchmarks": 2, "compositeIndexMax": 100,
			"tierAnchors":         anchors,
			"anchoredTiers":       []string{"ultra", "planning", "execution"},
			"tiers":               []string{"ultra", "planning", "execution", "fast", "insufficient"},
			"frontierVendors":     []string{"Anthropic"},
			"harnessInHouseLines": []map[string]any{},
			"substituteHarnesses": []string{"h1"}, "defaultSubstituteHarness": "h1",
			"rosterCatalogHarnesses": []string{"h1"}, "nearestOptionCount": nearestCount,
			"blendInputShare": 3, "blendOutputShare": 1,
			"harnessDisplayNames": map[string]string{"h1": "H1"},
		},
		"operators": []map[string]any{}, "priceSources": []map[string]any{},
	}
	raw, err := json.Marshal(file)
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}
	dataset, err := benchmark.LoadDataset(raw)
	if err != nil {
		t.Fatalf("LoadDataset: %v", err)
	}
	return dataset
}

func TestSubstitutesNearestOrdersByIndexPriceAndID(t *testing.T) {
	dataset := syntheticDataset(t, map[string]string{"ultra": "anchor-ultra", "planning": "anchor-planning", "execution": "anchor-execution"}, 2)
	var target benchmark.Model
	for _, model := range dataset.Models {
		if model.ID == "target" {
			target = model
		}
	}
	result := benchmark.SubstitutesFor(&target, dataset, "h1")
	if result.Kind != "nearest" {
		t.Fatalf("kind = %q, want nearest", result.Kind)
	}
	if len(result.Models) != 2 {
		t.Fatalf("nearest = %d models, want the cap of 2", len(result.Models))
	}
	if result.Models[0].Model.ID != "mid0" || result.Models[1].Model.ID != "mid1" {
		t.Fatalf("nearest order = %q,%q, want the id tiebreak after equal prices",
			result.Models[0].Model.ID, result.Models[1].Model.ID)
	}
	uncapped := syntheticDataset(t, map[string]string{"ultra": "anchor-ultra", "planning": "anchor-planning", "execution": "anchor-execution"}, 4)
	full := benchmark.SubstitutesFor(&target, uncapped, "h1")
	want := []string{"mid0", "mid1", "mid2", "mid3"}
	if len(full.Models) != len(want) {
		t.Fatalf("uncapped nearest = %d models, want %d", len(full.Models), len(want))
	}
	for index, id := range want {
		if full.Models[index].Model.ID != id {
			t.Fatalf("nearest[%d] = %q, want %q", index, full.Models[index].Model.ID, id)
		}
	}
}

func TestMissingAnchorKeyFallsThroughTiers(t *testing.T) {
	dataset := syntheticDataset(t, map[string]string{"planning": "anchor-planning", "execution": "anchor-execution"}, 2)
	var target benchmark.Model
	for _, model := range dataset.Models {
		if model.ID == "target" {
			target = model
		}
	}
	if got := dataset.AssignTier(&target); got != "planning" {
		t.Fatalf("tier with missing ultra anchor key = %q, want planning", got)
	}
}

func TestMissingAnchorFallsThroughTiers(t *testing.T) {
	dataset := syntheticDataset(t, map[string]string{"ultra": "ghost", "planning": "anchor-planning", "execution": "anchor-execution"}, 2)
	var target benchmark.Model
	for _, model := range dataset.Models {
		if model.ID == "target" {
			target = model
		}
	}
	if got := dataset.AssignTier(&target); got != "planning" {
		t.Fatalf("tier with missing ultra anchor = %q, want planning", got)
	}
}

func TestCompareDescCoversEveryOrdering(t *testing.T) {
	one, another, two := 1.0, 1.0, 2.0
	if got := benchmark.CompareDesc(nil, nil); got != 0 {
		t.Fatalf("nil,nil = %d", got)
	}
	if got := benchmark.CompareDesc(nil, &one); got != 1 {
		t.Fatalf("nil,rated = %d", got)
	}
	if got := benchmark.CompareDesc(&one, nil); got != -1 {
		t.Fatalf("rated,nil = %d", got)
	}
	if got := benchmark.CompareDesc(&one, &another); got != 0 {
		t.Fatalf("equal = %d", got)
	}
	if got := benchmark.CompareDesc(&two, &one); got != -1 {
		t.Fatalf("higher first = %d", got)
	}
	if got := benchmark.CompareDesc(&one, &two); got != 1 {
		t.Fatalf("lower first = %d", got)
	}
}

func TestFrontierModelsBreakDisplayTies(t *testing.T) {
	dataset := loadDataset(t)
	models := []benchmark.Model{
		{ID: "b2", Name: "beta", Vendor: "Anthropic"},
		{ID: "b1", Name: "Beta", Vendor: "Anthropic"},
		{ID: "a", Name: "alpha", Vendor: "Anthropic"},
		{ID: "s2", Name: "Same", Vendor: "Anthropic"},
		{ID: "s1", Name: "Same", Vendor: "Anthropic"},
		{ID: "zzz", Name: "zzz", Vendor: "Other"},
	}
	frontier := benchmark.FrontierModels(models, dataset)
	want := []string{"a", "b1", "b2", "s1", "s2"}
	if len(frontier) != len(want) {
		t.Fatalf("frontier = %d models, want %d", len(frontier), len(want))
	}
	for index, id := range want {
		if frontier[index].ID != id {
			t.Fatalf("frontier[%d] = %q, want %q", index, frontier[index].ID, id)
		}
	}
}

func TestScoreOverRejectsUnknownBenchmark(t *testing.T) {
	dataset := loadDataset(t)
	model := modelByID(t, dataset, "claude-opus-5")
	if _, ok := dataset.ScoreOver(model, []string{"no-such-benchmark"}); ok {
		t.Fatal("unknown benchmark must not score")
	}
	if got := benchmark.TierRank("no-such-tier", dataset.Config.Tiers); got != -1 {
		t.Fatalf("unknown tier rank = %d", got)
	}
	if got := benchmark.FormatIndex(-2.5, "en"); got != "-2.5" {
		t.Fatalf("negative index = %q", got)
	}
}

func TestSubstitutesSweepStaysConsistent(t *testing.T) {
	dataset := loadDataset(t)
	frontier := benchmark.FrontierModels(dataset.Models, dataset)
	if len(frontier) == 0 {
		t.Fatal("frontier roster is empty")
	}
	for _, target := range frontier[:10] {
		for _, harness := range dataset.Config.SubstituteHarnesses {
			result := benchmark.SubstitutesFor(&target, dataset, harness)
			targetTier := dataset.AssignTier(&target)
			switch result.Kind {
			case "matches":
				if len(result.Models) == 0 {
					t.Fatal("matches must list models")
				}
				for _, entry := range result.Models {
					if benchmark.TierRank(entry.Tier, dataset.Config.Tiers) < benchmark.TierRank(targetTier, dataset.Config.Tiers) {
						t.Fatalf("match %+v below target tier %q", entry, targetTier)
					}
				}
			case "nearest":
				if len(result.Models) == 0 || len(result.Models) > dataset.Config.NearestOptionCount {
					t.Fatalf("nearest holds %d models", len(result.Models))
				}
			case "insufficient":
				if len(result.Models) != 0 {
					t.Fatal("insufficient must list no models")
				}
			default:
				t.Fatalf("unknown kind %q", result.Kind)
			}
		}
	}
}
