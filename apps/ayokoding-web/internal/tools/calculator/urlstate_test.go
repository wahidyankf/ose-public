package calculator_test

import (
	"encoding/json"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
)

func decodeCalculatorState(t *testing.T, dataset calculator.Dataset, encoded string) (calculator.CalculatorState, calculator.Validity) {
	t.Helper()
	return calculator.DecodeState(mustParseCalculatorQuery(t, encoded), dataset)
}

func TestDecodeCalculatorURLVectors(t *testing.T) {
	dataset, _ := loadData(t)
	var vectors []struct {
		Query string `json:"query"`
		State struct {
			Tab       string  `json:"tab"`
			Region    *string `json:"region"`
			CountryID *string `json:"countryId"`
			CityID    *string `json:"cityId"`
			Household struct {
				Adults        int `json:"adults"`
				PreschoolKids int `json:"preschoolKids"`
				SchoolKids    int `json:"schoolKids"`
			} `json:"household"`
			SchoolType string  `json:"schoolType"`
			Area       string  `json:"area"`
			Gross      float64 `json:"gross"`
			MinRole    struct {
				BaselineSource  string  `json:"baselineSource"`
				TargetRaw       string  `json:"targetRaw"`
				TargetCurrency  string  `json:"targetCurrency"`
				RefCityID       *string `json:"refCityId"`
				RefRole         string  `json:"refRole"`
				MyGrossMonthly  float64 `json:"myGrossMonthly"`
				MySalaryCityID  *string `json:"mySalaryCityId"`
				MyGrossCurrency string  `json:"myGrossCurrency"`
				DisplayCurrency string  `json:"displayCurrency"`
			} `json:"minRole"`
		} `json:"state"`
	}
	if err := json.Unmarshal(loadVectors(t, "url-state.json")["calculator"], &vectors); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if len(vectors) != 5 {
		t.Fatalf("calculator URL vectors = %d, want 5", len(vectors))
	}
	deref := func(value *string) string {
		if value == nil {
			return ""
		}
		return *value
	}
	for _, vector := range vectors {
		state, validity := decodeCalculatorState(t, dataset, vector.Query)
		if validity != calculator.Valid {
			t.Fatalf("query %q must decode valid", vector.Query)
		}
		want := calculator.CalculatorState{
			Tab:        vector.State.Tab,
			Region:     deref(vector.State.Region),
			CountryID:  deref(vector.State.CountryID),
			CityID:     deref(vector.State.CityID),
			Household:  calculator.Household{Adults: vector.State.Household.Adults, PreschoolKids: vector.State.Household.PreschoolKids, SchoolKids: vector.State.Household.SchoolKids},
			SchoolType: vector.State.SchoolType,
			Area:       vector.State.Area,
			Gross:      vector.State.Gross,
			MinRole: calculator.MinRoleInputs{
				BaselineSource:  vector.State.MinRole.BaselineSource,
				TargetRaw:       vector.State.MinRole.TargetRaw,
				TargetCurrency:  vector.State.MinRole.TargetCurrency,
				RefCityID:       deref(vector.State.MinRole.RefCityID),
				RefRole:         vector.State.MinRole.RefRole,
				MyGrossMonthly:  vector.State.MinRole.MyGrossMonthly,
				MySalaryCityID:  deref(vector.State.MinRole.MySalaryCityID),
				MyGrossCurrency: vector.State.MinRole.MyGrossCurrency,
				DisplayCurrency: vector.State.MinRole.DisplayCurrency,
			},
		}
		if state != want {
			t.Fatalf("query %q\n got %+v\nwant %+v", vector.Query, state, want)
		}
	}
}

func TestCalculatorURLRoundTripPreservesInputs(t *testing.T) {
	dataset, _ := loadData(t)
	original, validity := decodeCalculatorState(t, dataset, "region=asean&country=id&city=jakarta&adults=2&preschool=1&schoolkids=2&schooltype=private&area=rural")
	if validity != calculator.Valid {
		t.Fatal("fixture query must decode valid")
	}
	restored, validity := decodeCalculatorState(t, dataset, calculator.EncodeState(original))
	if validity != calculator.Valid {
		t.Fatal("round trip must decode valid")
	}
	if restored != original {
		t.Fatalf("round trip = %+v, want %+v", restored, original)
	}
}

func TestCalculatorEncodeOmitsDefaults(t *testing.T) {
	if got := calculator.EncodeState(calculator.DefaultState()); got != "" {
		t.Fatalf("default state encodes to %q, want empty", got)
	}
	dataset, _ := loadData(t)
	state, _ := decodeCalculatorState(t, dataset, "tab=savings&gross=8000")
	if got := calculator.EncodeState(state); got != "tab=savings&gross=8000" {
		t.Fatalf("savings state encodes to %q", got)
	}
	minRole, _ := decodeCalculatorState(t, dataset, "tab=min-role&baseline=my_salary&target=0&targetcur=EUR&refcity=singapore&mygross=5000&mysalarycity=jakarta&mygrosscur=usd&displaycur=IDR")
	want := "tab=min-role&baseline=my_salary&target=0&targetcur=EUR&refcity=singapore&mygross=5000&mysalarycity=jakarta&mygrosscur=usd&displaycur=IDR"
	if got := calculator.EncodeState(minRole); got != want {
		t.Fatalf("min-role state encodes to %q, want %q", got, want)
	}
}

func TestCalculatorBlankTargetStaysDistinctFromExplicitZero(t *testing.T) {
	dataset, _ := loadData(t)
	blank, _ := decodeCalculatorState(t, dataset, "tab=min-role")
	if blank.MinRole.TargetRaw != "" {
		t.Fatalf("absent target = %q, want blank", blank.MinRole.TargetRaw)
	}
	explicit, _ := decodeCalculatorState(t, dataset, "tab=min-role&target=0")
	if explicit.MinRole.TargetRaw != "0" {
		t.Fatalf("explicit zero target = %q, want \"0\"", explicit.MinRole.TargetRaw)
	}
	if got := calculator.EncodeState(blank); got == "tab=min-role&target=" {
		t.Fatal("blank target must be omitted from encoding")
	}
	encoded := calculator.EncodeState(explicit)
	restored, _ := decodeCalculatorState(t, dataset, encoded)
	if restored.MinRole.TargetRaw != "0" {
		t.Fatalf("encoded zero target restores to %q", restored.MinRole.TargetRaw)
	}
}

func TestCalculatorInvalidInputsUseCodecRecovery(t *testing.T) {
	dataset, _ := loadData(t)
	state, validity := decodeCalculatorState(t, dataset, "tab=nope&region=nope&country=nope&city=nope&adults=5&preschool=9&schoolkids=-1&schooltype=nope&area=nope&gross=abc&baseline=nope&mygrosscur=nope&displaycur=")
	if validity != calculator.Valid {
		t.Fatal("invalid scalars must decode valid with recovery")
	}
	want := calculator.DefaultState()
	if state != want {
		t.Fatalf("invalid inputs recover to %+v, want defaults %+v", state, want)
	}
}

func TestCalculatorDuplicateParameterUsesFirstValue(t *testing.T) {
	dataset, _ := loadData(t)
	state, validity := decodeCalculatorState(t, dataset, "adults=2&adults=1&gross=8000&gross=1&tab=savings&tab=cost")
	if validity != calculator.Valid {
		t.Fatal("duplicates must decode valid")
	}
	if state.Household.Adults != 2 || state.Gross != 8000 || state.Tab != "savings" {
		t.Fatalf("duplicates resolve to %+v, want first values", state)
	}
}

func TestCalculatorNestedOrUnexpectedFieldIsInvalidFilters(t *testing.T) {
	dataset, _ := loadData(t)
	for _, query := range []string{
		"tab=cost&city[jakarta]=1",
		"tab[]=cost",
		"household.adults=2",
		"tab=cost&debug=1",
		"salary=5000",
	} {
		_, validity := decodeCalculatorState(t, dataset, query)
		if validity != calculator.InvalidFilters {
			t.Fatalf("query %q must yield invalid-filters", query)
		}
	}
}

func TestCalculatorGeographyChangeRemovesIncompatibleCity(t *testing.T) {
	dataset, _ := loadData(t)
	// Narrower wins: an explicit city backfills its country and region.
	state, _ := decodeCalculatorState(t, dataset, "city=jakarta&region=europe")
	if state.CityID != "jakarta" || state.CountryID != "id" || state.Region != "asean" {
		t.Fatalf("city wins with backfill, got %+v", state)
	}
	// An unknown city clears the city while the country still backfills.
	state, _ = decodeCalculatorState(t, dataset, "country=jp&city=nope")
	if state.CityID != "" || state.CountryID != "jp" || state.Region != "japan" {
		t.Fatalf("unknown city clears with country backfill, got %+v", state)
	}
	// Region-only scope keeps the region and clears narrower fields.
	changed := calculator.ApplyRegionChange(calculator.DefaultState(), "japan", dataset)
	if changed.Region != "japan" || changed.CountryID != "" || changed.CityID != "" {
		t.Fatalf("region change = %+v", changed)
	}
	// City change backfills broader geography.
	jakarta, _ := decodeCalculatorState(t, dataset, "city=jakarta")
	_ = jakarta
	moved := calculator.ApplyCityChange(calculator.DefaultState(), "tokyo", dataset)
	if moved.CityID != "tokyo" || moved.CountryID != "jp" || moved.Region != "japan" {
		t.Fatalf("city change backfill = %+v", moved)
	}
	// Country change keeps a city that still belongs, else clears it.
	kept := calculator.ApplyCountryChange(moved, "jp", dataset)
	if kept.CityID != "tokyo" {
		t.Fatalf("country change must keep a belonging city, got %+v", kept)
	}
	cleared := calculator.ApplyCountryChange(moved, "id", dataset)
	if cleared.CityID != "" || cleared.CountryID != "id" || cleared.Region != "asean" {
		t.Fatalf("country change must clear a foreign city, got %+v", cleared)
	}
}

func TestCalculatorScopedCitiesFollowNarrowerWins(t *testing.T) {
	dataset, _ := loadData(t)
	all := calculator.ScopedCities(dataset, "", "", "")
	if len(all) != len(dataset.Cities) {
		t.Fatalf("unfiltered scope = %d cities, want %d", len(all), len(dataset.Cities))
	}
	jakarta := calculator.ScopedCities(dataset, "europe", "id", "jakarta")
	if len(jakarta) != 1 || jakarta[0].ID != "jakarta" {
		t.Fatalf("city scope = %+v, want only jakarta", jakarta)
	}
	japan := calculator.ScopedCities(dataset, "japan", "", "")
	for _, city := range japan {
		if city.Region != "japan" {
			t.Fatalf("region scope leaks %+v", city)
		}
	}
	if len(japan) == 0 {
		t.Fatal("japan scope must hold cities")
	}
}
