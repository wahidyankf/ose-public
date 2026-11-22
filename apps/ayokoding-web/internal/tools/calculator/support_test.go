package calculator_test

import (
	"net/url"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/shareddata"
)

// loadData decodes the shared cost-of-living dataset, FX snapshot, and role
// matrix from the embedded copies the build vendors, so the unit run reads no
// disk.
func loadData(t *testing.T) (calculator.Dataset, calculator.RoleMatrix) {
	t.Helper()
	col, err := shareddata.CostOfLiving()
	if err != nil {
		t.Fatalf("shared cost-of-living data: %v", err)
	}
	fx, err := shareddata.Fx()
	if err != nil {
		t.Fatalf("shared FX data: %v", err)
	}
	dataset, matrix, err := calculator.LoadDataset(col, fx)
	if err != nil {
		t.Fatalf("LoadDataset: %v", err)
	}
	return dataset, matrix
}

func mustParseCalculatorQuery(t *testing.T, encoded string) url.Values {
	t.Helper()
	query, err := url.ParseQuery(encoded)
	if err != nil {
		t.Fatalf("ParseQuery: %v", err)
	}
	return query
}

func findCity(t *testing.T, dataset calculator.Dataset, id string) *calculator.City {
	t.Helper()
	for index := range dataset.Cities {
		if dataset.Cities[index].ID == id {
			return &dataset.Cities[index]
		}
	}
	t.Fatalf("city %q is missing from the shared dataset", id)
	return nil
}

func findCountry(t *testing.T, dataset calculator.Dataset, id string) *calculator.Country {
	t.Helper()
	for index := range dataset.Countries {
		if dataset.Countries[index].ID == id {
			return &dataset.Countries[index]
		}
	}
	t.Fatalf("country %q is missing from the shared dataset", id)
	return nil
}

func defaultHousehold() calculator.Household {
	return calculator.Household{Adults: 1}
}
