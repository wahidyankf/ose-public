package calculator_test

import (
	"encoding/json"
	"math"
	"os"
	"path/filepath"
	"testing"

	"github.com/wahidyankf/ose-public/apps/ayokoding-web/internal/tools/calculator"
)

func TestScaleAmountCoversEveryCategory(t *testing.T) {
	household := calculator.Household{Adults: 2, PreschoolKids: 1, SchoolKids: 2}
	sublinear, perCapita := calculator.SubLinear(household), calculator.PerCapita(household)
	cases := map[string]float64{
		"housing":    100 * sublinear * 1.0,
		"food":       100 * perCapita,
		"transport":  100,
		"utilities":  100 * sublinear,
		"healthcare": 100 * perCapita,
		"unknown":    100,
	}
	for category, want := range cases {
		area := "center"
		if category == "housing" {
			area = "center"
		}
		if got := calculator.ScaleAmount(100, category, household, area); got != want {
			t.Fatalf("scale(%s) = %v, want %v", category, got, want)
		}
	}
	if got := calculator.ScaleAmount(100, "housing", household, "rural"); got != 100*sublinear*0.75 {
		t.Fatalf("rural housing = %v", got)
	}
}

func TestSchoolTypeCollapsesForForeigners(t *testing.T) {
	dataset, _ := loadData(t)
	singapore := findCity(t, dataset, "singapore")
	singaporeCountry := findCountry(t, dataset, singapore.CountryID)
	if calculator.ForeignerCanUsePublicSchool(singaporeCountry) {
		t.Fatal("singapore public school is not fully open to foreigners")
	}
	if got := calculator.EffectiveSchoolType(singaporeCountry, "public"); got != "private" {
		t.Fatalf("singapore effective school = %q, want private", got)
	}
	if got := calculator.EffectiveSchoolType(singaporeCountry, "private"); got != "private" {
		t.Fatalf("singapore private choice = %q, want private", got)
	}
	household := calculator.Household{Adults: 1, SchoolKids: 2}
	public := calculator.SchoolLocal(singapore, singaporeCountry, household, "public")
	private := calculator.SchoolLocal(singapore, singaporeCountry, household, "private")
	if public != private {
		t.Fatalf("collapsed school cost %v != private cost %v", public, private)
	}
	if public != singapore.SchoolMedianLocal.Private.Amount*2 {
		t.Fatalf("school cost = %v, want two private medians", public)
	}
}

func TestSanitizeStateIsIdempotentRecovery(t *testing.T) {
	dataset, _ := loadData(t)
	dirty := calculator.CalculatorState{
		Tab:        "nope",
		Region:     "nope",
		CountryID:  "nope",
		CityID:     "nope",
		Household:  calculator.Household{Adults: 5, PreschoolKids: 9, SchoolKids: -1},
		SchoolType: "nope",
		Area:       "nope",
		Gross:      math.NaN(),
		MinRole: calculator.MinRoleInputs{
			BaselineSource:  "nope",
			TargetCurrency:  "",
			RefCityID:       "nope",
			RefRole:         "",
			MyGrossMonthly:  -1,
			MySalaryCityID:  "nope",
			MyGrossCurrency: "nope",
			DisplayCurrency: " ",
		},
	}
	clean := calculator.SanitizeState(dirty, dataset)
	want := calculator.DefaultState()
	if clean != want {
		t.Fatalf("sanitize = %+v, want defaults %+v", clean, want)
	}
	if again := calculator.SanitizeState(clean, dataset); again != clean {
		t.Fatal("sanitize must be idempotent")
	}
}

func TestNumParseMirrorsJavaScript(t *testing.T) {
	dataset, _ := loadData(t)
	// Leading-prefix floats with trailing garbage, signs, whitespace,
	// exponents, and hex-looking input follow JavaScript parseFloat.
	floats := map[string]float64{
		"gross=8": 8, "gross=8.5": 8.5, "gross=.5": 0.5, "gross=8.": 8,
		"gross=8e2": 800, "gross=8.5e-1": 0.85, "gross=%20%203": 3,
		"gross=%2B4": 4, "gross=2abc": 2, "gross=0x10": 0, "gross=8e": 8,
		"gross=007": 7,
	}
	for query, want := range floats {
		state, _ := decodeCalculatorState(t, dataset, query)
		if state.Gross != want {
			t.Fatalf("%s gross = %v, want %v", query, state.Gross, want)
		}
	}
	// Empty, non-numeric, negative, non-finite, and exponent-only input
	// recovers to zero instead of a misleading finite estimate.
	for _, query := range []string{"gross=", "gross=abc", "gross=-5", "gross=Infinity", "gross=e10", "gross=.", "gross=e", "gross=%20"} {
		state, _ := decodeCalculatorState(t, dataset, query)
		if state.Gross != 0 {
			t.Fatalf("%s gross = %v, want 0", query, state.Gross)
		}
	}
	// Integer fields follow parseInt: leading prefixes parse, the rest
	// falls back to the codec default.
	ints := map[string]int{
		"adults=2": 2, "adults=%20%202": 2, "adults=%2B2": 2,
		"adults=2abc": 2, "adults=0x10": 1, "adults=007": 1, "adults=": 1,
		"adults=abc": 1, "adults=Infinity": 1, "adults=--2": 1, "adults=5": 1,
	}
	for query, want := range ints {
		state, _ := decodeCalculatorState(t, dataset, query)
		if state.Household.Adults != want {
			t.Fatalf("%s adults = %v, want %v", query, state.Household.Adults, want)
		}
	}
}

func TestEncodeFractionalAndLargeNumbers(t *testing.T) {
	dataset, _ := loadData(t)
	state, validity := decodeCalculatorState(t, dataset, "tab=savings&gross=5000.5")
	if validity != calculator.Valid {
		t.Fatal("fractional gross must decode valid")
	}
	if state.Gross != 5000.5 {
		t.Fatalf("gross = %v, want 5000.5", state.Gross)
	}
	if got := calculator.EncodeState(state); got != "tab=savings&gross=5000.5" {
		t.Fatalf("fractional gross encodes to %q", got)
	}
	huge, validity := decodeCalculatorState(t, dataset, "tab=savings&gross=1e21")
	if validity != calculator.Valid {
		t.Fatal("large gross must decode valid")
	}
	// The old URLSearchParams encoding percent-encodes the plus sign.
	if got := calculator.EncodeState(huge); got != "tab=savings&gross=1e%2B21" {
		t.Fatalf("large gross encodes to %q", got)
	}
	restored, validity := decodeCalculatorState(t, dataset, calculator.EncodeState(huge))
	if validity != calculator.Valid || restored.Gross != huge.Gross {
		t.Fatalf("large gross restores to %+v", restored)
	}
}

func TestRelocationAndLiquidityAreConsistent(t *testing.T) {
	dataset, _ := loadData(t)
	jakarta := findCity(t, dataset, "jakarta")
	sunk, err := calculator.RelocationSunkUSD(jakarta, dataset.Fx)
	if err != nil {
		t.Fatalf("RelocationSunkUSD: %v", err)
	}
	rate, err := calculator.FxToUSD(dataset.Fx, jakarta.Currency)
	if err != nil {
		t.Fatalf("FxToUSD: %v", err)
	}
	if sunk != calculator.RelocationSunkLocal(jakarta)*rate {
		t.Fatal("sunk USD must equal local sunk converted at the city rate")
	}
	reserve, err := calculator.LiquidityReserveUSD(jakarta, dataset.Fx)
	if err != nil {
		t.Fatalf("LiquidityReserveUSD: %v", err)
	}
	if reserve != calculator.LiquidityReserveLocal(jakarta)*rate {
		t.Fatal("reserve USD must equal the local cushion converted at the city rate")
	}
	unknown := *jakarta
	unknown.Currency = "XXX"
	if _, err := calculator.RelocationSunkUSD(&unknown, dataset.Fx); err == nil {
		t.Fatal("unknown currency must error instead of a non-finite figure")
	}
	if _, err := calculator.LiquidityReserveUSD(&unknown, dataset.Fx); err == nil {
		t.Fatal("unknown currency must error instead of a non-finite figure")
	}
	if _, err := calculator.FxToUSD(dataset.Fx, "XXX"); err == nil {
		t.Fatal("unknown currency must error")
	}
	if _, err := calculator.USDToDisplay(dataset.Fx, 100, "XXX"); err == nil {
		t.Fatal("unknown display currency must error")
	}
}

func TestToDisplayCurrenciesConvertsBothSides(t *testing.T) {
	dataset, _ := loadData(t)
	usd, local, display, err := calculator.ToDisplayCurrencies(dataset.Fx, 1000, "IDR", "IDR")
	if err != nil {
		t.Fatalf("ToDisplayCurrencies: %v", err)
	}
	if usd != 1000 {
		t.Fatalf("usd = %v, want 1000", usd)
	}
	rate, _ := calculator.FxToUSD(dataset.Fx, "IDR")
	if local != 1000/rate || display != 1000/rate {
		t.Fatalf("local/display = %v/%v, want %v", local, display, 1000/rate)
	}
	if _, _, _, err := calculator.ToDisplayCurrencies(dataset.Fx, 1000, "XXX", "USD"); err == nil {
		t.Fatal("unknown city currency must error")
	}
}

func TestRoleDistributionsAndTotals(t *testing.T) {
	dataset, matrix := loadData(t)
	singapore := findCity(t, dataset, "singapore")
	p25, median, p75 := calculator.RoleSalaryDistributionUSD(dataset.Fx, matrix, singapore, "senior_swe")
	if !(p25 <= median && median <= p75 && median > 0) {
		t.Fatalf("distribution = %v/%v/%v", p25, median, p75)
	}
	nonSalary := calculator.RoleNonSalaryCompUSD(dataset.Fx, matrix, singapore, "senior_swe")
	if nonSalary < 0 {
		t.Fatalf("non-salary comp = %v", nonSalary)
	}
	total := calculator.RoleTotalCompUSD(dataset.Fx, matrix, singapore, "senior_swe")
	if total != median*12+nonSalary {
		t.Fatalf("total comp = %v, want annual base plus non-salary", total)
	}
	if got := calculator.RoleMedianGrossUSD(dataset.Fx, matrix, singapore, "no-such-role"); got != 0 {
		t.Fatalf("unknown role median = %v, want 0", got)
	}
}

func TestRankLadderAndBestCity(t *testing.T) {
	dataset, matrix := loadData(t)
	ladder, err := calculator.RankLadder(dataset, matrix, defaultHousehold(), "public", "center", nil)
	if err != nil {
		t.Fatalf("RankLadder: %v", err)
	}
	if len(ladder) != len(matrix.Ladder) {
		t.Fatalf("ladder = %d roles, want %d", len(ladder), len(matrix.Ladder))
	}
	for _, entry := range ladder {
		if entry.BestCity.ID == "" || entry.BestCountry.ID == "" {
			t.Fatalf("ladder entry %+v misses its best place", entry)
		}
	}
	europe := calculator.ScopedCities(dataset, "europe", "", "")
	scoped, err := calculator.RankLadder(dataset, matrix, defaultHousehold(), "public", "center", europe)
	if err != nil {
		t.Fatalf("RankLadder scoped: %v", err)
	}
	for _, entry := range scoped {
		if entry.BestCity.Region != "europe" {
			t.Fatalf("scoped ladder leaks %+v", entry.BestCity)
		}
	}
	if _, _, _, err := calculator.BestCityForRole(dataset, matrix, "swe_1", defaultHousehold(), "public", "center", []calculator.City{}); err == nil {
		t.Fatal("empty scope must error")
	}
}

func TestEnumerateOrderAndMinimumRank(t *testing.T) {
	dataset, matrix := loadData(t)
	ladder, err := calculator.RankLadder(dataset, matrix, defaultHousehold(), "public", "center", nil)
	if err != nil {
		t.Fatalf("RankLadder: %v", err)
	}
	minRole := calculator.MinimumRole(8000, ladder)
	if minRole == "" {
		t.Fatal("baseline 8000 must qualify a role")
	}
	entries := calculator.EnumerateCityRoleEntries(dataset, matrix, defaultHousehold(), "public", "center", nil, 8000)
	if len(entries) != len(dataset.Cities)*len(matrix.Ladder) {
		t.Fatalf("entries = %d, want every city-role pair", len(entries))
	}
	if got := calculator.MinimumQualifyingRank(entries); got <= 0 {
		t.Fatalf("minimum rank = %d", got)
	}
	ordered := calculator.OrderForDisplay(ladder, minRole)
	if len(ordered) != len(ladder) {
		t.Fatalf("ordered = %d, want %d", len(ordered), len(ladder))
	}
	seenBelow := false
	for _, entry := range ordered {
		if !entry.Clears {
			seenBelow = true
		} else if seenBelow {
			t.Fatal("qualifying roles must lead the display order")
		}
	}
	if got := calculator.MinimumQualifyingRank(nil); got != -1 {
		t.Fatalf("empty entries rank = %d, want -1", got)
	}
}

func TestResolveBaselineSources(t *testing.T) {
	dataset, matrix := loadData(t)
	household := defaultHousehold()
	mine, err := calculator.ResolveBaselineUSD("my_salary", calculator.BaselineInput{GrossMonthlyUSD: 6000, CityID: "jakarta"}, household, "public", "center", dataset, matrix)
	if err != nil {
		t.Fatalf("my_salary: %v", err)
	}
	other, err := calculator.ResolveBaselineUSD("my_salary", calculator.BaselineInput{GrossMonthlyUSD: 6000, CityID: "san-francisco"}, household, "public", "center", dataset, matrix)
	if err != nil {
		t.Fatalf("my_salary: %v", err)
	}
	if mine == other {
		t.Fatal("the salary city must move the baseline")
	}
	reference, err := calculator.ResolveBaselineUSD("reference_role", calculator.BaselineInput{Role: "senior_swe", CityID: "berlin"}, household, "public", "center", dataset, matrix)
	if err != nil {
		t.Fatalf("reference_role: %v", err)
	}
	if !isFinite(reference) {
		t.Fatalf("reference baseline = %v", reference)
	}
	target, err := calculator.ResolveBaselineUSD("savings_target", calculator.BaselineInput{AmountLocal: 1000, DisplayCurrency: "USD"}, household, "public", "center", dataset, matrix)
	if err != nil {
		t.Fatalf("savings_target: %v", err)
	}
	if target != 1000 {
		t.Fatalf("usd target = %v, want 1000", target)
	}
	if _, err := calculator.ResolveBaselineUSD("my_salary", calculator.BaselineInput{CityID: "nope"}, household, "public", "center", dataset, matrix); err == nil {
		t.Fatal("unknown salary city must error")
	}
	if _, err := calculator.ResolveBaselineUSD("reference_role", calculator.BaselineInput{Role: "senior_swe", CityID: "nope"}, household, "public", "center", dataset, matrix); err == nil {
		t.Fatal("unknown reference city must error")
	}
	if _, err := calculator.ResolveBaselineUSD("savings_target", calculator.BaselineInput{AmountLocal: 1, DisplayCurrency: "XXX"}, household, "public", "center", dataset, matrix); err == nil {
		t.Fatal("unknown display currency must error")
	}
}

func isFinite(n float64) bool {
	return !math.IsNaN(n) && !math.IsInf(n, 0)
}

func TestSortByEssentialSavingsOrdersDescending(t *testing.T) {
	rows := []calculator.SavingsRow{{CityID: "a", EssentialSavings: 1}, {CityID: "b", EssentialSavings: 3}, {CityID: "c", EssentialSavings: 2}}
	ordered := calculator.SortByEssentialSavings(rows)
	if ordered[0].CityID != "b" || ordered[1].CityID != "c" || ordered[2].CityID != "a" {
		t.Fatalf("ordered = %+v", ordered)
	}
	if rows[0].CityID != "a" {
		t.Fatal("sorting must not mutate the input")
	}
}

func TestCalculatorDatasetValidationRejectsEachDefect(t *testing.T) {
	root := testDataRoot(t)
	colRaw, err := os.ReadFile(filepath.Join(root, "data", "cost-of-living.json"))
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}
	fxRaw, err := os.ReadFile(filepath.Join(root, "data", "fx.json"))
	if err != nil {
		t.Fatalf("ReadFile: %v", err)
	}
	var col map[string]json.RawMessage
	if err := json.Unmarshal(colRaw, &col); err != nil {
		t.Fatalf("Unmarshal: %v", err)
	}
	remarshalCol := func(mutated map[string]json.RawMessage) []byte {
		out, err := json.Marshal(mutated)
		if err != nil {
			t.Fatalf("Marshal: %v", err)
		}
		return out
	}
	cloneCol := func() map[string]json.RawMessage {
		out := make(map[string]json.RawMessage, len(col))
		for key, value := range col {
			out[key] = value
		}
		return out
	}
	mutateCities := func(mutate func(cities []map[string]json.RawMessage)) []byte {
		out := cloneCol()
		var cities []map[string]json.RawMessage
		if err := json.Unmarshal(out["cities"], &cities); err != nil {
			t.Fatalf("Unmarshal: %v", err)
		}
		mutate(cities)
		encoded, err := json.Marshal(cities)
		if err != nil {
			t.Fatalf("Marshal: %v", err)
		}
		out["cities"] = encoded
		return remarshalCol(out)
	}
	mutateCountries := func(mutate func(countries []map[string]json.RawMessage)) []byte {
		out := cloneCol()
		var countries []map[string]json.RawMessage
		if err := json.Unmarshal(out["countries"], &countries); err != nil {
			t.Fatalf("Unmarshal: %v", err)
		}
		mutate(countries)
		encoded, err := json.Marshal(countries)
		if err != nil {
			t.Fatalf("Marshal: %v", err)
		}
		out["countries"] = encoded
		return remarshalCol(out)
	}
	mutateFx := func(mutate func(fx map[string]json.RawMessage)) []byte {
		var fx map[string]json.RawMessage
		if err := json.Unmarshal(fxRaw, &fx); err != nil {
			t.Fatalf("Unmarshal: %v", err)
		}
		mutate(fx)
		encoded, err := json.Marshal(fx)
		if err != nil {
			t.Fatalf("Marshal: %v", err)
		}
		return encoded
	}
	cases := map[string]struct {
		col []byte
		fx  []byte
	}{
		"bad json":     {col: []byte(`{`), fx: fxRaw},
		"bad fx":       {col: colRaw, fx: []byte(`{`)},
		"missing date": {col: remarshalCol(func() map[string]json.RawMessage { out := cloneCol(); delete(out, "snapshotDate"); return out }()), fx: fxRaw},
		"empty cities": {col: remarshalCol(func() map[string]json.RawMessage {
			out := cloneCol()
			out["cities"] = json.RawMessage(`[]`)
			return out
		}()), fx: fxRaw},
		"empty countries": {col: remarshalCol(func() map[string]json.RawMessage {
			out := cloneCol()
			out["countries"] = json.RawMessage(`[]`)
			return out
		}()), fx: fxRaw},
		"missing fx date":      {col: colRaw, fx: mutateFx(func(fx map[string]json.RawMessage) { delete(fx, "fxSnapshotDate") })},
		"empty fx rates":       {col: colRaw, fx: mutateFx(func(fx map[string]json.RawMessage) { fx["ratesUsdPerUnit"] = json.RawMessage(`{}`) })},
		"incomplete city":      {col: mutateCities(func(cities []map[string]json.RawMessage) { delete(cities[0], "currency") }), fx: fxRaw},
		"unknown currency":     {col: mutateCities(func(cities []map[string]json.RawMessage) { cities[0]["currency"] = json.RawMessage(`"XXX"`) }), fx: fxRaw},
		"country without id":   {col: mutateCountries(func(countries []map[string]json.RawMessage) { delete(countries[0], "id") }), fx: fxRaw},
		"country without rate": {col: mutateCountries(func(countries []map[string]json.RawMessage) { delete(countries[0], "effectiveRate") }), fx: fxRaw},
		"city unknown country": {col: mutateCities(func(cities []map[string]json.RawMessage) { cities[0]["countryId"] = json.RawMessage(`"xx"`) }), fx: fxRaw},
	}
	for name, input := range cases {
		if _, _, err := calculator.LoadDataset(input.col, input.fx); err == nil {
			t.Fatalf("%s must be rejected", name)
		}
	}
}

func TestReconcileGeoDirectContract(t *testing.T) {
	dataset, _ := loadData(t)
	city, country, region := calculator.ReconcileGeo("jakarta", "jp", "europe", dataset)
	if city != "jakarta" || country != "id" || region != "asean" {
		t.Fatalf("city wins, got %q/%q/%q", city, country, region)
	}
	city, country, region = calculator.ReconcileGeo("", "jp", "europe", dataset)
	if city != "" || country != "jp" || region != "japan" {
		t.Fatalf("country wins, got %q/%q/%q", city, country, region)
	}
	city, country, region = calculator.ReconcileGeo("", "", "japan", dataset)
	if city != "" || country != "" || region != "japan" {
		t.Fatalf("region stands, got %q/%q/%q", city, country, region)
	}
	city, country, region = calculator.ReconcileGeo("", "nope", "nope", dataset)
	if city != "" || country != "" || region != "" {
		t.Fatalf("unknowns clear, got %q/%q/%q", city, country, region)
	}
}

func TestApplyChangesCoverEveryCascade(t *testing.T) {
	dataset, _ := loadData(t)
	withCity, _ := decodeCalculatorState(t, dataset, "city=tokyo")
	kept := calculator.ApplyRegionChange(withCity, "japan", dataset)
	if kept.CityID != "tokyo" || kept.CountryID != "jp" || kept.Region != "japan" {
		t.Fatalf("belonging city survives, got %+v", kept)
	}
	moved := calculator.ApplyRegionChange(withCity, "europe", dataset)
	if moved.CityID != "" || moved.CountryID != "" || moved.Region != "europe" {
		t.Fatalf("foreign city clears, got %+v", moved)
	}
	countryOnly, _ := decodeCalculatorState(t, dataset, "country=jp")
	narrowed := calculator.ApplyRegionChange(countryOnly, "japan", dataset)
	if narrowed.CityID != "" || narrowed.CountryID != "jp" || narrowed.Region != "japan" {
		t.Fatalf("belonging country keeps, got %+v", narrowed)
	}
	cleared := calculator.ApplyRegionChange(countryOnly, "europe", dataset)
	if cleared.CountryID != "" || cleared.CityID != "" {
		t.Fatalf("foreign country clears, got %+v", cleared)
	}
	emptied := calculator.ApplyRegionChange(withCity, "", dataset)
	if emptied.Region != "" || emptied.CountryID != "" || emptied.CityID != "" {
		t.Fatalf("null region clears, got %+v", emptied)
	}
	nulled := calculator.ApplyCountryChange(withCity, "", dataset)
	if nulled.CountryID != "" || nulled.CityID != "" {
		t.Fatalf("null country clears, got %+v", nulled)
	}
	ghost, _ := decodeCalculatorState(t, dataset, "city=tokyo&country=jp")
	ghost.CityID = "nope"
	unknown := calculator.ApplyCountryChange(ghost, "jp", dataset)
	if unknown.CityID != "" || unknown.Region != "japan" {
		t.Fatalf("unknown city clears, got %+v", unknown)
	}
	empty := calculator.ApplyCityChange(withCity, "", dataset)
	if empty.CityID != "" {
		t.Fatalf("null city clears, got %+v", empty)
	}
	keptCity := calculator.ApplyCityChange(calculator.DefaultState(), "nope", dataset)
	if keptCity.CityID != "" {
		t.Fatalf("unknown city keeps state, got %+v", keptCity)
	}
	abroad := calculator.ApplyCountryChange(withCity, "xx", dataset)
	if abroad.Region != "" {
		t.Fatalf("unknown country yields no region, got %+v", abroad)
	}
}

func TestScopedCitiesCoverEveryScope(t *testing.T) {
	dataset, _ := loadData(t)
	japan := calculator.ScopedCities(dataset, "", "jp", "")
	if len(japan) == 0 {
		t.Fatal("country scope must hold cities")
	}
	for _, city := range japan {
		if city.CountryID != "jp" {
			t.Fatalf("country scope leaks %+v", city)
		}
	}
	mismatch := calculator.ScopedCities(dataset, "europe", "jp", "")
	if len(mismatch) != 0 {
		t.Fatalf("country-region mismatch = %+v, want none", mismatch)
	}
	if cities := calculator.ScopedCities(dataset, "", "", "nope"); cities != nil {
		t.Fatalf("unknown city scope = %+v, want none", cities)
	}
}

func TestParseRefRoleAndEmptyQuery(t *testing.T) {
	dataset, _ := loadData(t)
	empty, validity := decodeCalculatorState(t, dataset, "")
	if validity != calculator.Valid {
		t.Fatal("empty query must decode valid")
	}
	if empty != calculator.DefaultState() {
		t.Fatalf("empty query = %+v, want defaults", empty)
	}
	blank, _ := decodeCalculatorState(t, dataset, "refrole=")
	if blank.MinRole.RefRole != "senior_swe" {
		t.Fatalf("blank refrole = %q, want the default", blank.MinRole.RefRole)
	}
	staff, _ := decodeCalculatorState(t, dataset, "refrole=staff_swe")
	if staff.MinRole.RefRole != "staff_swe" {
		t.Fatalf("refrole = %q", staff.MinRole.RefRole)
	}
	valid, _ := decodeCalculatorState(t, dataset, "country=jp&region=nope")
	if valid.CountryID != "jp" || valid.Region != "japan" {
		t.Fatalf("country backfills region, got %+v", valid)
	}
}

func TestExpensesAndSyntheticErrors(t *testing.T) {
	dataset, _ := loadData(t)
	jakarta := findCity(t, dataset, "jakarta")
	country := findCountry(t, dataset, jakarta.CountryID)
	household := calculator.Household{Adults: 1}
	if got := calculator.ExpensesLocal(jakarta, country, household, "public", "center"); got !=
		calculator.EssentialsLocal(jakarta, country, household, "public", "center")+jakarta.Expenses.Lifestyle.Amount {
		t.Fatalf("expenses = %v", got)
	}
	unknown := &calculator.City{ID: "x", CountryID: "sg", Currency: "XXX"}
	if _, err := calculator.SavingsRowFor(1000, unknown, country, dataset.Fx, household, "public", "center"); err == nil {
		t.Fatal("unknown currency must error instead of a non-finite row")
	}
	if got := calculator.RoleMedianGrossUSD(dataset.Fx, loadMatrix(t), unknown, "swe_1"); got != 0 {
		t.Fatalf("unknown currency median = %v, want 0", got)
	}
	if _, _, _, err := calculator.ToDisplayCurrencies(calculator.FxTable{RatesUSDPerUnit: map[string]float64{"USD": 0}}, 100, "USD", "USD"); err == nil {
		t.Fatal("zero city rate must error")
	}
}

func loadMatrix(t *testing.T) calculator.RoleMatrix {
	t.Helper()
	_, matrix := loadData(t)
	return matrix
}

func TestBestCityUnknownRoleAndBadScope(t *testing.T) {
	dataset, matrix := loadData(t)
	best, savings, confidence, err := calculator.BestCityForRole(dataset, matrix, "no-such-role", defaultHousehold(), "public", "center", nil)
	if err != nil {
		t.Fatalf("BestCityForRole: %v", err)
	}
	if best.ID == "" || confidence == "" {
		t.Fatalf("best = %+v/%v/%q", best, savings, confidence)
	}
	ladder, err := calculator.RankLadder(dataset, matrix, defaultHousehold(), "public", "center", []calculator.City{{ID: "x", CountryID: "xx"}})
	if err == nil || ladder != nil {
		t.Fatal("rank over an empty scope must error")
	}
	if entries := calculator.EnumerateCityRoleEntries(dataset, matrix, defaultHousehold(), "public", "center", []calculator.City{{ID: "x", CountryID: "xx"}}, 0); len(entries) != 0 {
		t.Fatalf("entries over bad scope = %d, want none", len(entries))
	}
}

func TestResolveFragmentBaselineErrorPaths(t *testing.T) {
	dataset, matrix := loadData(t)
	reference := calculator.CalculatorState{MinRole: calculator.MinRoleInputs{BaselineSource: "reference_role", RefCityID: "nope"}}
	if _, ready := calculator.ResolveFragmentBaseline(reference, dataset, matrix); ready {
		t.Fatal("unknown reference city disengages")
	}
	unsetReference := calculator.CalculatorState{MinRole: calculator.MinRoleInputs{BaselineSource: "reference_role"}}
	if _, ready := calculator.ResolveFragmentBaseline(unsetReference, dataset, matrix); ready {
		t.Fatal("unset reference city disengages")
	}
	display := calculator.CalculatorState{MinRole: calculator.MinRoleInputs{BaselineSource: "savings_target", TargetRaw: "100", DisplayCurrency: "XXX"}}
	if _, ready := calculator.ResolveFragmentBaseline(display, dataset, matrix); ready {
		t.Fatal("unknown display currency disengages")
	}
	salary := calculator.CalculatorState{MinRole: calculator.MinRoleInputs{BaselineSource: "my_salary", MyGrossMonthly: 100, MySalaryCityID: "nope"}}
	if _, ready := calculator.ResolveFragmentBaseline(salary, dataset, matrix); ready {
		t.Fatal("unknown salary city disengages")
	}
	unknown := calculator.CalculatorState{MinRole: calculator.MinRoleInputs{BaselineSource: "nope"}}
	if _, ready := calculator.ResolveFragmentBaseline(unknown, dataset, matrix); ready {
		t.Fatal("unknown baseline source disengages")
	}
}

func TestCalculatorFragmentIdLocaleAndValidDecode(t *testing.T) {
	dataset, matrix := loadData(t)
	state, _ := decodeCalculatorState(t, dataset, "tab=min-role&target=0")
	fragment := calculator.BuildFragment(dataset, matrix, state, "id")
	if !fragment.Ready || fragment.MinRoleID == "" {
		t.Fatalf("id fragment = %+v", fragment)
	}
	decoded := calculator.DecodeFragment(mustParseCalculatorQuery(t, "region=asean&country=id&city=jakarta"), dataset, matrix, "en")
	if decoded.Invalid || decoded.CostText == "" {
		t.Fatalf("valid decode = %+v", decoded)
	}
}

func TestCalculatorFragmentBaselineAmounts(t *testing.T) {
	dataset, matrix := loadData(t)
	garbage, _ := decodeCalculatorState(t, dataset, "tab=min-role&target=abc")
	if fragment := calculator.BuildFragment(dataset, matrix, garbage, "en"); !fragment.Ready {
		t.Fatal("unparseable target counts as zero and engages")
	}
	negative, _ := decodeCalculatorState(t, dataset, "tab=min-role&target=-5")
	if fragment := calculator.BuildFragment(dataset, matrix, negative, "en"); fragment.Ready {
		t.Fatal("negative target disengages")
	}
	localSalary := calculator.CalculatorState{MinRole: calculator.MinRoleInputs{
		BaselineSource: "my_salary", MyGrossMonthly: 5000000, MySalaryCityID: "jakarta",
	}}
	if _, ready := calculator.ResolveFragmentBaseline(localSalary, dataset, matrix); !ready {
		t.Fatal("local-currency salary converts through the salary city rate")
	}
}

func TestCalculatorCodecRemainingBranches(t *testing.T) {
	dataset, _ := loadData(t)
	bounded, _ := decodeCalculatorState(t, dataset, "preschool=abc&schoolkids=xyz")
	if bounded.Household.PreschoolKids != 0 || bounded.Household.SchoolKids != 0 {
		t.Fatalf("unparseable counts recover to %+v", bounded.Household)
	}
	negativeAdult, _ := decodeCalculatorState(t, dataset, "adults=-3")
	if negativeAdult.Household.Adults != 1 {
		t.Fatalf("negative adults recover to %v", negativeAdult.Household.Adults)
	}
	negativeGross, _ := decodeCalculatorState(t, dataset, "gross=-Infinity")
	if negativeGross.Gross != 0 {
		t.Fatalf("negative infinity gross = %v, want 0", negativeGross.Gross)
	}
	bom, _ := decodeCalculatorState(t, dataset, "gross=%EF%BB%BF8&adults=%E2%80%8B2")
	if bom.Gross != 8 || bom.Household.Adults != 2 {
		t.Fatalf("unicode whitespace skips to %+v/%v", bom.Household, bom.Gross)
	}
	tiny, _ := decodeCalculatorState(t, dataset, "gross=1e-7")
	if encoded := calculator.EncodeState(tiny); encoded != "gross=1e-7" {
		t.Fatalf("tiny gross encodes to %q", encoded)
	}
	unknownRef, _ := decodeCalculatorState(t, dataset, "refcity=nope&mysalarycity=nope")
	if unknownRef.MinRole.RefCityID != "" || unknownRef.MinRole.MySalaryCityID != "" {
		t.Fatalf("unknown ref cities clear to %+v", unknownRef.MinRole)
	}
	staff, _ := decodeCalculatorState(t, dataset, "refrole=staff_swe")
	if got := calculator.EncodeState(staff); got != "refrole=staff_swe" {
		t.Fatalf("non-default refrole encodes to %q", got)
	}
	if _, _, _, err := calculator.ToDisplayCurrencies(dataset.Fx, 100, "USD", "XXX"); err == nil {
		t.Fatal("unknown display currency must error")
	}
	unknownCity := &calculator.City{ID: "x", CountryID: "sg", Currency: "XXX"}
	p25, median, p75 := calculator.RoleSalaryDistributionUSD(dataset.Fx, loadMatrix(t), unknownCity, "swe_1")
	if p25 != 0 || median != 0 || p75 != 0 {
		t.Fatalf("unknown currency distribution = %v/%v/%v", p25, median, p75)
	}
	if got := calculator.RoleNonSalaryCompUSD(dataset.Fx, loadMatrix(t), findCity(t, dataset, "singapore"), "no-such-role"); got != 0 {
		t.Fatalf("unknown role comp = %v, want 0", got)
	}
	if got := calculator.RoleNonSalaryCompUSD(dataset.Fx, loadMatrix(t), unknownCity, "swe_1"); got != 0 {
		t.Fatalf("unknown currency comp = %v, want 0", got)
	}
	if got := calculator.CandidateEssentialSavingsUSD(dataset.Fx, loadMatrix(t), findCountry(t, dataset, "sg"), unknownCity, "swe_1", defaultHousehold(), "public", "center"); got != 0 {
		t.Fatalf("unknown currency savings = %v, want 0", got)
	}
}
