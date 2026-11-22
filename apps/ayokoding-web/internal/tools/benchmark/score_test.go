package benchmark_test

import (
	"strings"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/benchmark"
)

func pricedModel(id string, input, output float64) *benchmark.Model {
	return &benchmark.Model{
		ID:    id,
		Price: &benchmark.ApiPrice{Input: input, Output: output},
	}
}

func TestPriceRatioDividesBlendedPrices(t *testing.T) {
	candidate := pricedModel("candidate", 2.0, 8.0)
	reference := pricedModel("reference", 1.0, 4.0)
	ratio, ok := benchmark.PriceRatio(candidate, reference, 0.75, 0.25)
	if !ok {
		t.Fatal("PriceRatio of two published prices must be defined")
	}
	want := ((0.75*2.0 + 0.25*8.0) / 1.0) / ((0.75*1.0 + 0.25*4.0) / 1.0)
	if ratio != want {
		t.Fatalf("PriceRatio = %v, want %v", ratio, want)
	}
}

func TestPriceRatioUndefinedWithoutPublishedPrices(t *testing.T) {
	priced := pricedModel("priced", 1.0, 4.0)
	unpriced := &benchmark.Model{ID: "unpriced"}
	for name, pair := range map[string][2]*benchmark.Model{
		"candidate unpriced": {unpriced, priced},
		"reference unpriced": {priced, unpriced},
	} {
		if _, ok := benchmark.PriceRatio(pair[0], pair[1], 0.75, 0.25); ok {
			t.Fatalf("PriceRatio %s must be undefined", name)
		}
	}
	free := pricedModel("free", 0.0, 0.0)
	if _, ok := benchmark.PriceRatio(pricedModel("paid", 1.0, 1.0), free, 0.5, 0.5); ok {
		t.Fatal("PriceRatio against a free reference must be undefined")
	}
}

func TestRosterScopeJoinsSharedDataset(t *testing.T) {
	dataset := loadDataset(t)
	frontier, catalogs, inHouse := benchmark.RosterScope(dataset, "en")
	if frontier == "" {
		t.Fatal("frontier roster must not be empty")
	}
	if want := strings.Join(dataset.Config.FrontierVendors, ", "); frontier != want {
		t.Fatalf("frontier = %q, want %q", frontier, want)
	}
	idFrontier, idCatalogs, idInHouse := benchmark.RosterScope(dataset, "id")
	if idFrontier != frontier || idInHouse != inHouse {
		t.Fatal("locale must change only the catalog conjunction")
	}
	if catalogs == "" || idCatalogs == "" {
		t.Fatal("catalog roster must not be empty")
	}
	if !strings.Contains(catalogs, " and ") {
		t.Fatalf("english catalogs = %q, want the ' and ' conjunction", catalogs)
	}
	if !strings.Contains(idCatalogs, " dan ") {
		t.Fatalf("indonesian catalogs = %q, want the ' dan ' conjunction", idCatalogs)
	}
}
