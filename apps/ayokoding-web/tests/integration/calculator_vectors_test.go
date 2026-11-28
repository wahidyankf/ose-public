package integration_test

import (
	"encoding/json"
	"net/url"
	"os"
	"path/filepath"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
)

func calculatorDataRoot(t *testing.T) string {
	t.Helper()
	root := filepath.Join("..", "..", "..", "..", "libs", "ayokoding-data")
	if _, err := os.Stat(filepath.Join(root, "data", "cost-of-living.json")); err != nil {
		t.Fatalf("shared data is missing: %v", err)
	}
	return root
}

func calculatorData(t *testing.T) (calculator.Dataset, calculator.RoleMatrix) {
	t.Helper()
	root := calculatorDataRoot(t)
	col, err := os.ReadFile(filepath.Join(root, "data", "cost-of-living.json"))
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}
	fx, err := os.ReadFile(filepath.Join(root, "data", "fx.json"))
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}
	dataset, matrix, err := calculator.LoadDataset(col, fx)
	if err != nil {
		t.Fatalf("LoadDataset: %v", err)
	}
	return dataset, matrix
}

func calculatorVectors(t *testing.T, name string) map[string]json.RawMessage {
	t.Helper()
	raw, err := os.ReadFile(filepath.Join(calculatorDataRoot(t), "test-vectors", name))
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}
	var vectors map[string]json.RawMessage
	if err := json.Unmarshal(raw, &vectors); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	return vectors
}

func calculatorQuery(t *testing.T, encoded string) url.Values {
	t.Helper()
	query, err := url.ParseQuery(encoded)
	if err != nil {
		t.Fatalf("ParseQuery: %v", err)
	}
	return query
}

func calculatorCity(t *testing.T, dataset calculator.Dataset, id string) *calculator.City {
	t.Helper()
	for index := range dataset.Cities {
		if dataset.Cities[index].ID == id {
			return &dataset.Cities[index]
		}
	}
	t.Fatalf("city %q is missing from the shared dataset", id)
	return nil
}

func calculatorCountry(t *testing.T, dataset calculator.Dataset, id string) *calculator.Country {
	t.Helper()
	for index := range dataset.Countries {
		if dataset.Countries[index].ID == id {
			return &dataset.Countries[index]
		}
	}
	t.Fatalf("country %q is missing from the shared dataset", id)
	return nil
}

func calculatorHousehold() calculator.Household {
	return calculator.Household{Adults: 1}
}

func TestLoadDatasetPreservesSnapshotDates(t *testing.T) {
	dataset, matrix := calculatorData(t)
	if dataset.SnapshotDate != "2026-07-30" {
		t.Fatalf("snapshotDate = %q, want the shared cost-of-living date", dataset.SnapshotDate)
	}
	if dataset.Fx.SnapshotDate != "2026-07-29" {
		t.Fatalf("fxSnapshotDate = %q, want the independent FX date", dataset.Fx.SnapshotDate)
	}
	if dataset.SnapshotDate == dataset.Fx.SnapshotDate {
		t.Fatal("the FX snapshot date must stay independent of the dataset date")
	}
	if matrix.SnapshotDate == "" {
		t.Fatal("the role matrix must carry its own snapshot date")
	}
	if len(dataset.Cities) == 0 || len(dataset.Countries) == 0 || len(matrix.Ladder) == 0 {
		t.Fatal("dataset, countries, or ladder is empty")
	}
}

func TestEssentialsLocalMatchesSharedVectors(t *testing.T) {
	dataset, _ := calculatorData(t)
	var vectors []struct {
		City      string `json:"city"`
		Household struct {
			Adults        int `json:"adults"`
			PreschoolKids int `json:"preschoolKids"`
			SchoolKids    int `json:"schoolKids"`
		} `json:"household"`
		SchoolType string  `json:"schoolType"`
		Area       string  `json:"area"`
		Value      float64 `json:"value"`
	}
	if err := json.Unmarshal(calculatorVectors(t, "calculator.json")["essentialsLocal"], &vectors); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if len(vectors) != 3 {
		t.Fatalf("essentials vectors = %d, want 3", len(vectors))
	}
	for _, vector := range vectors {
		city := calculatorCity(t, dataset, vector.City)
		country := calculatorCountry(t, dataset, city.CountryID)
		household := calculator.Household{
			Adults:        vector.Household.Adults,
			PreschoolKids: vector.Household.PreschoolKids,
			SchoolKids:    vector.Household.SchoolKids,
		}
		if got := calculator.EssentialsLocal(city, country, household, vector.SchoolType, vector.Area); got != vector.Value {
			t.Fatalf("essentials(%s) = %v, want %v", vector.City, got, vector.Value)
		}
	}
}

func TestNetUSDMatchesSharedVectors(t *testing.T) {
	dataset, _ := calculatorData(t)
	var vectors []struct {
		City            string  `json:"city"`
		GrossMonthlyUSD float64 `json:"grossMonthlyUsd"`
		Value           float64 `json:"value"`
	}
	if err := json.Unmarshal(calculatorVectors(t, "calculator.json")["netUsd"], &vectors); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if len(vectors) != 3 {
		t.Fatalf("net vectors = %d, want 3", len(vectors))
	}
	for _, vector := range vectors {
		city := calculatorCity(t, dataset, vector.City)
		country := calculatorCountry(t, dataset, city.CountryID)
		if got := calculator.NetUSD(vector.GrossMonthlyUSD, city, country); got != vector.Value {
			t.Fatalf("net(%s) = %v, want %v", vector.City, got, vector.Value)
		}
	}
}

// TestSavingsRowMatchesSharedVectors compares exact float64 values, so it guards the arithmetic order as well as the
// figures. Regression: on arm64 the compiler fused the savings products with their subtractions (FMSUBD/FNMSUBD),
// moving EssentialSavings one ulp from the vector (846.3808 against 846.3807999999999). The calculator now rounds
// each product through mulRounded; do not inline it or replace it with a fused expression.
func TestSavingsRowMatchesSharedVectors(t *testing.T) {
	dataset, _ := calculatorData(t)
	var vectors []struct {
		City            string  `json:"city"`
		GrossMonthlyUSD float64 `json:"grossMonthlyUsd"`
		Household       struct {
			Adults        int `json:"adults"`
			PreschoolKids int `json:"preschoolKids"`
			SchoolKids    int `json:"schoolKids"`
		} `json:"household"`
		SchoolType string `json:"schoolType"`
		Area       string `json:"area"`
		Row        struct {
			CityID                string  `json:"cityId"`
			Currency              string  `json:"currency"`
			GrossMonthlyUSD       float64 `json:"grossMonthlyUsd"`
			NetUSD                float64 `json:"netUsd"`
			EssentialsUSD         float64 `json:"essentialsUsd"`
			LifestyleUSD          float64 `json:"lifestyleUsd"`
			EssentialSavings      float64 `json:"essentialSavings"`
			AfterLifestyleSavings float64 `json:"afterLifestyleSavings"`
		} `json:"row"`
	}
	if err := json.Unmarshal(calculatorVectors(t, "calculator.json")["savingsRow"], &vectors); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if len(vectors) != 3 {
		t.Fatalf("savings vectors = %d, want 3", len(vectors))
	}
	for _, vector := range vectors {
		city := calculatorCity(t, dataset, vector.City)
		country := calculatorCountry(t, dataset, city.CountryID)
		household := calculator.Household{
			Adults:        vector.Household.Adults,
			PreschoolKids: vector.Household.PreschoolKids,
			SchoolKids:    vector.Household.SchoolKids,
		}
		row, err := calculator.SavingsRowFor(vector.GrossMonthlyUSD, city, country, dataset.Fx, household, vector.SchoolType, vector.Area)
		if err != nil {
			t.Fatalf("SavingsRowFor(%s): %v", vector.City, err)
		}
		want := vector.Row
		if row.CityID != want.CityID || row.Currency != want.Currency ||
			row.GrossMonthlyUSD != want.GrossMonthlyUSD || row.NetUSD != want.NetUSD ||
			row.EssentialsUSD != want.EssentialsUSD || row.LifestyleUSD != want.LifestyleUSD ||
			row.EssentialSavings != want.EssentialSavings || row.AfterLifestyleSavings != want.AfterLifestyleSavings {
			t.Fatalf("savings(%s) = %+v, want %+v", vector.City, row, want)
		}
	}
}

func TestMinimumRoleMatchesSharedVectors(t *testing.T) {
	dataset, matrix := calculatorData(t)
	var vectors []struct {
		BaselineUSD float64 `json:"baselineUsd"`
		Role        *string `json:"role"`
	}
	if err := json.Unmarshal(calculatorVectors(t, "calculator.json")["minimumRole"], &vectors); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if len(vectors) != 5 {
		t.Fatalf("minimum-role vectors = %d, want 5", len(vectors))
	}
	ladder, err := calculator.RankLadder(dataset, matrix, calculatorHousehold(), "public", "center", nil)
	if err != nil {
		t.Fatalf("RankLadder: %v", err)
	}
	for _, vector := range vectors {
		got := calculator.MinimumRole(vector.BaselineUSD, ladder)
		if vector.Role == nil {
			if got != "" {
				t.Fatalf("minimumRole(%v) = %q, want no qualifying role", vector.BaselineUSD, got)
			}
			continue
		}
		if got != *vector.Role {
			t.Fatalf("minimumRole(%v) = %q, want %q", vector.BaselineUSD, got, *vector.Role)
		}
	}
}

func TestFormatMatchesSharedVectors(t *testing.T) {
	var format struct {
		FmtNum      [][2]json.RawMessage `json:"fmtNum"`
		FmtCurrency [][2]json.RawMessage `json:"fmtCurrency"`
	}
	raw := calculatorVectors(t, "calculator.json")["format"]
	var formatRaw struct {
		FmtNum      [][]json.RawMessage `json:"fmtNum"`
		FmtCurrency [][]json.RawMessage `json:"fmtCurrency"`
	}
	if err := json.Unmarshal(raw, &formatRaw); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	_ = format
	for _, pair := range formatRaw.FmtNum {
		var input float64
		var want string
		if err := json.Unmarshal(pair[0], &input); err != nil {
			t.Fatalf("Unmarshal: %v", err)
		}
		if err := json.Unmarshal(pair[1], &want); err != nil {
			t.Fatalf("Unmarshal: %v", err)
		}
		if got := calculator.FmtNum(input); got != want {
			t.Fatalf("FmtNum(%v) = %q, want %q", input, got, want)
		}
	}
	for _, pair := range formatRaw.FmtCurrency {
		var input float64
		var want string
		if err := json.Unmarshal(pair[0], &input); err != nil {
			t.Fatalf("Unmarshal: %v", err)
		}
		if err := json.Unmarshal(pair[1], &want); err != nil {
			t.Fatalf("Unmarshal: %v", err)
		}
		if got := calculator.FmtCurrency(input, ""); got != want {
			t.Fatalf("FmtCurrency(%v) = %q, want %q", input, got, want)
		}
	}
}

func TestRoleMedianGrossUSDMatchesSharedVectors(t *testing.T) {
	dataset, matrix := calculatorData(t)
	var vectors []struct {
		City  string  `json:"city"`
		Role  string  `json:"role"`
		Value float64 `json:"value"`
	}
	if err := json.Unmarshal(calculatorVectors(t, "calculator.json")["roleMedianGrossUsd"], &vectors); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if len(vectors) != 3 {
		t.Fatalf("median vectors = %d, want 3", len(vectors))
	}
	for _, vector := range vectors {
		city := calculatorCity(t, dataset, vector.City)
		if got := calculator.RoleMedianGrossUSD(dataset.Fx, matrix, city, vector.Role); got != vector.Value {
			t.Fatalf("median(%s/%s) = %v, want %v", vector.City, vector.Role, got, vector.Value)
		}
	}
}

func TestPolicyConstantsDriveScaling(t *testing.T) {
	household := calculator.Household{Adults: 2, PreschoolKids: 1, SchoolKids: 2}
	// Equivalised size: 1 + 0.5*(2-1) + 0.3*(1+2) = 2.4.
	if got := calculator.PerCapita(household); got != 2.4 {
		t.Fatalf("PerCapita = %v, want 2.4", got)
	}
	// Sub-linear damping: 1 + 0.5*(2.4-1) = 1.7.
	if got := calculator.SubLinear(household); got != 1.7 {
		t.Fatalf("SubLinear = %v, want 1.7", got)
	}
	center := calculator.ScaleAmount(100, "housing", household, "center")
	rural := calculator.ScaleAmount(100, "housing", household, "rural")
	if rural != center*0.75 {
		t.Fatalf("rural housing = %v, want 0.75 of center %v", rural, center)
	}
}

func TestDualCurrencyMatchesSharedVectors(t *testing.T) {
	var vectors []struct {
		LocalAmount   float64 `json:"localAmount"`
		LocalCurrency string  `json:"localCurrency"`
		USDAmount     float64 `json:"usdAmount"`
		Text          string  `json:"text"`
	}
	if err := json.Unmarshal(calculatorVectors(t, "calculator.json")["dualCurrency"], &vectors); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	if len(vectors) != 2 {
		t.Fatalf("dual-currency vectors = %d, want 2", len(vectors))
	}
	for _, vector := range vectors {
		if got := calculator.FmtDualCurrency(vector.LocalAmount, vector.LocalCurrency, vector.USDAmount); got != vector.Text {
			t.Fatalf("FmtDualCurrency = %q, want %q", got, vector.Text)
		}
	}
}

func TestDecodeCalculatorURLVectors(t *testing.T) {
	dataset, _ := calculatorData(t)
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
	if err := json.Unmarshal(calculatorVectors(t, "url-state.json")["calculator"], &vectors); err != nil {
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
		state, validity := calculatorDecodeState(t, dataset, vector.Query)
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
func calculatorDecodeState(t *testing.T, dataset calculator.Dataset, encoded string) (calculator.CalculatorState, calculator.Validity) {
	t.Helper()
	return calculator.DecodeState(calculatorQuery(t, encoded), dataset)
}
