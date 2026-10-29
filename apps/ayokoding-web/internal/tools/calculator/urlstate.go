package calculator

// Calculator fragment query codec ported from the current url-state: the
// URL is the single source of truth, defaults are omitted from encoding,
// unknown values recover through the codec's accepted rules, narrower
// geography wins with backfill, and duplicated parameters resolve to their
// first value. Scalar-only inputs only: nested or unexpected fields yield
// the invalid-filters state. Salary and household input stays transient
// view and URL state, never a log, cookie, or stored server record.

import (
	"math"
	"net/url"
	"strconv"
	"strings"
)

// Query keys accepted on the calculator fragment and page routes.
const (
	ParamTab          = "tab"
	ParamRegion       = "region"
	ParamCountry      = "country"
	ParamCity         = "city"
	ParamAdults       = "adults"
	ParamPreschool    = "preschool"
	ParamSchoolKids   = "schoolkids"
	ParamSchoolType   = "schooltype"
	ParamArea         = "area"
	ParamGross        = "gross"
	ParamBaseline     = "baseline"
	ParamTarget       = "target"
	ParamTargetCur    = "targetcur"
	ParamRefCity      = "refcity"
	ParamRefRole      = "refrole"
	ParamMyGross      = "mygross"
	ParamMySalaryCity = "mysalarycity"
	ParamMyGrossCur   = "mygrosscur"
	ParamDisplayCur   = "displaycur"
)

// Validity is the fragment validity of a decoded calculator state.
type Validity int

const (
	// Valid decodes to usable input state with codec recovery applied.
	Valid Validity = iota
	// InvalidFilters marks a nested/structured value or an unexpected
	// field; the handler renders the inline invalid-filters state.
	InvalidFilters
)

// MinRoleInputs carries the minimum-role tab baseline inputs. Empty
// strings mean unset; TargetRaw keeps a blank field distinct from an
// explicit zero.
type MinRoleInputs struct {
	BaselineSource  string
	TargetRaw       string
	TargetCurrency  string
	RefCityID       string
	RefRole         string
	MyGrossMonthly  float64
	MySalaryCityID  string
	MyGrossCurrency string
	DisplayCurrency string
}

// CalculatorState carries every calculator input with codec defaults.
type CalculatorState struct {
	Tab        string
	Region     string
	CountryID  string
	CityID     string
	Household  Household
	SchoolType string
	Area       string
	Gross      float64
	MinRole    MinRoleInputs
}

// DefaultState returns the calculator defaults from the current codec.
func DefaultState() CalculatorState {
	return CalculatorState{
		Tab:        "cost",
		Household:  Household{Adults: 1},
		SchoolType: "public",
		Area:       "center",
		MinRole: MinRoleInputs{
			BaselineSource:  "savings_target",
			TargetCurrency:  "USD",
			RefRole:         "senior_swe",
			MyGrossCurrency: "local",
			DisplayCurrency: "USD",
		},
	}
}

// invalidParam reports whether a query key is outside the scalar codec.
func invalidParam(key string) bool {
	switch key {
	case ParamTab, ParamRegion, ParamCountry, ParamCity, ParamAdults,
		ParamPreschool, ParamSchoolKids, ParamSchoolType, ParamArea,
		ParamGross, ParamBaseline, ParamTarget, ParamTargetCur,
		ParamRefCity, ParamRefRole, ParamMyGross, ParamMySalaryCity,
		ParamMyGrossCur, ParamDisplayCur:
		return false
	default:
		return true
	}
}

// firstParam resolves a duplicated parameter to its first value.
func firstParam(query url.Values, key string) (string, bool) {
	values, ok := query[key]
	if !ok || len(values) == 0 {
		return "", false
	}
	return values[0], true
}

// encodeCalculatorPair appends one escaped query pair.
func encodeCalculatorPair(parts []string, key, value string) []string {
	return append(parts, key+"="+url.QueryEscape(value))
}

// trimParam normalizes one scalar query value.
func trimParam(value string) string {
	return strings.TrimSpace(value)
}

// Valid tabs, regions, school types, areas, baselines, and currencies.
var (
	validTabs    = map[string]bool{"cost": true, "savings": true, "min-role": true}
	validRegions = map[string]bool{
		"asean": true, "japan": true, "europe": true, "nordics": true,
		"americas": true, "mena": true, "asia": true, "oceania": true, "africa": true,
	}
	validSchoolTypes     = map[string]bool{"public": true, "private": true}
	validAreas           = map[string]bool{"center": true, "rural": true}
	validBaselines       = map[string]bool{"savings_target": true, "reference_role": true, "my_salary": true}
	validGrossCurrencies = map[string]bool{"local": true, "usd": true}
)

// DecodeState parses the query into calculator state with the codec's
// accepted recovery, or invalid-filters for nested/structured values and
// unexpected fields. Duplicated parameters resolve to their first value,
// mirroring URLSearchParams.get in the old codec.
func DecodeState(query url.Values, dataset Dataset) (CalculatorState, Validity) {
	for key := range query {
		if invalidParam(key) {
			return CalculatorState{}, InvalidFilters
		}
	}
	state := DefaultState()
	if raw, ok := firstParam(query, ParamTab); ok {
		if validTabs[raw] {
			state.Tab = raw
		}
	}
	rawCity, _ := firstParam(query, ParamCity)
	rawCountry, _ := firstParam(query, ParamCountry)
	rawRegion, _ := firstParam(query, ParamRegion)
	state.CityID, state.CountryID, state.Region = reconcileRawGeo(trimParam(rawCity), trimParam(rawCountry), trimParam(rawRegion), dataset)
	state.Household = Household{
		Adults:        parseAdults(query),
		PreschoolKids: parseBoundedCount(query, ParamPreschool),
		SchoolKids:    parseBoundedCount(query, ParamSchoolKids),
	}
	if raw, ok := firstParam(query, ParamSchoolType); ok {
		if validSchoolTypes[raw] {
			state.SchoolType = raw
		}
	}
	if raw, ok := firstParam(query, ParamArea); ok {
		if validAreas[raw] {
			state.Area = raw
		}
	}
	state.Gross = parseNonNegNumber(query, ParamGross)
	state.MinRole = MinRoleInputs{
		BaselineSource:  parseBaselineSource(query),
		TargetRaw:       parseTargetRaw(query),
		TargetCurrency:  parseCurrencyCode(query, ParamTargetCur, DefaultState().MinRole.TargetCurrency),
		RefCityID:       parseCityID(query, ParamRefCity, dataset),
		RefRole:         parseRefRole(query),
		MyGrossMonthly:  parseNonNegNumber(query, ParamMyGross),
		MySalaryCityID:  parseCityID(query, ParamMySalaryCity, dataset),
		MyGrossCurrency: parseGrossCurrency(query),
		DisplayCurrency: parseCurrencyCode(query, ParamDisplayCur, DefaultState().MinRole.DisplayCurrency),
	}
	return state, Valid
}

// EncodeState serializes calculator state with defaults omitted and keys
// in codec order.
func EncodeState(state CalculatorState) string {
	defaults := DefaultState()
	var parts []string
	if state.Tab != defaults.Tab {
		parts = encodeCalculatorPair(parts, ParamTab, state.Tab)
	}
	if state.Region != defaults.Region && state.Region != "" {
		parts = encodeCalculatorPair(parts, ParamRegion, state.Region)
	}
	if state.CountryID != defaults.CountryID && state.CountryID != "" {
		parts = encodeCalculatorPair(parts, ParamCountry, state.CountryID)
	}
	if state.CityID != defaults.CityID && state.CityID != "" {
		parts = encodeCalculatorPair(parts, ParamCity, state.CityID)
	}
	if state.Household.Adults != defaults.Household.Adults {
		parts = encodeCalculatorPair(parts, ParamAdults, formatCount(state.Household.Adults))
	}
	if state.Household.PreschoolKids != defaults.Household.PreschoolKids {
		parts = encodeCalculatorPair(parts, ParamPreschool, formatCount(state.Household.PreschoolKids))
	}
	if state.Household.SchoolKids != defaults.Household.SchoolKids {
		parts = encodeCalculatorPair(parts, ParamSchoolKids, formatCount(state.Household.SchoolKids))
	}
	if state.SchoolType != defaults.SchoolType {
		parts = encodeCalculatorPair(parts, ParamSchoolType, state.SchoolType)
	}
	if state.Area != defaults.Area {
		parts = encodeCalculatorPair(parts, ParamArea, state.Area)
	}
	if state.Gross != defaults.Gross {
		parts = encodeCalculatorPair(parts, ParamGross, formatNumber(state.Gross))
	}
	minRole, fallback := state.MinRole, defaults.MinRole
	if minRole.BaselineSource != fallback.BaselineSource {
		parts = encodeCalculatorPair(parts, ParamBaseline, minRole.BaselineSource)
	}
	if minRole.TargetRaw != fallback.TargetRaw {
		parts = encodeCalculatorPair(parts, ParamTarget, minRole.TargetRaw)
	}
	if minRole.TargetCurrency != fallback.TargetCurrency {
		parts = encodeCalculatorPair(parts, ParamTargetCur, minRole.TargetCurrency)
	}
	if minRole.RefCityID != fallback.RefCityID && minRole.RefCityID != "" {
		parts = encodeCalculatorPair(parts, ParamRefCity, minRole.RefCityID)
	}
	if minRole.RefRole != fallback.RefRole {
		parts = encodeCalculatorPair(parts, ParamRefRole, minRole.RefRole)
	}
	if minRole.MyGrossMonthly != fallback.MyGrossMonthly {
		parts = encodeCalculatorPair(parts, ParamMyGross, formatNumber(minRole.MyGrossMonthly))
	}
	if minRole.MySalaryCityID != fallback.MySalaryCityID && minRole.MySalaryCityID != "" {
		parts = encodeCalculatorPair(parts, ParamMySalaryCity, minRole.MySalaryCityID)
	}
	if minRole.MyGrossCurrency != fallback.MyGrossCurrency {
		parts = encodeCalculatorPair(parts, ParamMyGrossCur, minRole.MyGrossCurrency)
	}
	if minRole.DisplayCurrency != fallback.DisplayCurrency {
		parts = encodeCalculatorPair(parts, ParamDisplayCur, minRole.DisplayCurrency)
	}
	return strings.Join(parts, "&")
}

// SanitizeState validates and reconciles a state against the dataset with
// narrower geography winning and backfill applied. Sanitizing twice is
// idempotent.
func SanitizeState(state CalculatorState, dataset Dataset) CalculatorState {
	defaults := DefaultState()
	if !validTabs[state.Tab] {
		state.Tab = defaults.Tab
	}
	if !validSchoolTypes[state.SchoolType] {
		state.SchoolType = defaults.SchoolType
	}
	if !validAreas[state.Area] {
		state.Area = defaults.Area
	}
	if state.Household.Adults != 1 && state.Household.Adults != 2 {
		state.Household.Adults = defaults.Household.Adults
	}
	if state.Household.PreschoolKids < 0 || state.Household.PreschoolKids > 3 {
		state.Household.PreschoolKids = defaults.Household.PreschoolKids
	}
	if state.Household.SchoolKids < 0 || state.Household.SchoolKids > 3 {
		state.Household.SchoolKids = defaults.Household.SchoolKids
	}
	state.CityID, state.CountryID, state.Region = reconcileRawGeo(state.CityID, state.CountryID, state.Region, dataset)
	if math.IsNaN(state.Gross) || math.IsInf(state.Gross, 0) || state.Gross < 0 {
		state.Gross = defaults.Gross
	}
	minRole := state.MinRole
	if !validBaselines[minRole.BaselineSource] {
		minRole.BaselineSource = defaults.MinRole.BaselineSource
	}
	if _, ok := dataset.CityByID(minRole.RefCityID); minRole.RefCityID != "" && !ok {
		minRole.RefCityID = defaults.MinRole.RefCityID
	}
	if strings.TrimSpace(minRole.RefRole) == "" {
		minRole.RefRole = defaults.MinRole.RefRole
	}
	if math.IsNaN(minRole.MyGrossMonthly) || math.IsInf(minRole.MyGrossMonthly, 0) || minRole.MyGrossMonthly < 0 {
		minRole.MyGrossMonthly = defaults.MinRole.MyGrossMonthly
	}
	if _, ok := dataset.CityByID(minRole.MySalaryCityID); minRole.MySalaryCityID != "" && !ok {
		minRole.MySalaryCityID = defaults.MinRole.MySalaryCityID
	}
	if !validGrossCurrencies[minRole.MyGrossCurrency] {
		minRole.MyGrossCurrency = defaults.MinRole.MyGrossCurrency
	}
	if strings.TrimSpace(minRole.TargetCurrency) == "" {
		minRole.TargetCurrency = defaults.MinRole.TargetCurrency
	}
	if strings.TrimSpace(minRole.DisplayCurrency) == "" {
		minRole.DisplayCurrency = defaults.MinRole.DisplayCurrency
	}
	state.MinRole = minRole
	return state
}

// ReconcileGeo applies narrower-wins with backfill over the three geo
// fields. Empty means unset on both sides.
func ReconcileGeo(cityID, countryID, region string, dataset Dataset) (city, country, geoRegion string) {
	return reconcileRawGeo(cityID, countryID, region, dataset)
}

// reconcileRawGeo reconciles raw geo values: the city wins and backfills
// the country and region, else the country wins and backfills the region,
// else the region stands alone. Unknown ids clear that level.
func reconcileRawGeo(cityID, countryID, region string, dataset Dataset) (city, country, geoRegion string) {
	if cityID != "" {
		if found, ok := dataset.CityByID(cityID); ok {
			return cityID, found.CountryID, found.Region
		}
	}
	if countryID != "" {
		if _, ok := dataset.CountryByID(countryID); ok {
			for _, candidate := range dataset.Cities {
				if candidate.CountryID == countryID {
					return "", countryID, candidate.Region
				}
			}
		}
	}
	if validRegions[region] {
		return "", "", region
	}
	return "", "", ""
}

// countryRegion derives a country's region from its first city in source
// order, mirroring the old codec.
func countryRegion(dataset Dataset, countryID string) string {
	for _, city := range dataset.Cities {
		if city.CountryID == countryID {
			return city.Region
		}
	}
	return ""
}

// ApplyRegionChange cascade-clears geography for a region change: a null
// region clears everything, a city still in the region keeps its country,
// else the country keeps only when still in the region.
func ApplyRegionChange(state CalculatorState, region string, dataset Dataset) CalculatorState {
	if region == "" {
		state.Region, state.CountryID, state.CityID = "", "", ""
		return state
	}
	if state.CityID != "" {
		if city, ok := dataset.CityByID(state.CityID); ok && city.Region == region {
			state.Region = region
			return state
		}
	}
	if state.CountryID != "" && countryRegion(dataset, state.CountryID) == region {
		state.Region, state.CityID = region, ""
		return state
	}
	state.Region, state.CountryID, state.CityID = region, "", ""
	return state
}

// ApplyCountryChange cascade-clears and backfills for a country change: a
// null country clears the city, else the region backfills from the country
// and a foreign city clears.
func ApplyCountryChange(state CalculatorState, countryID string, dataset Dataset) CalculatorState {
	if countryID == "" {
		state.CountryID, state.CityID = "", ""
		return state
	}
	state.CountryID = countryID
	state.Region = countryRegion(dataset, countryID)
	if state.CityID != "" {
		if city, ok := dataset.CityByID(state.CityID); !ok || city.CountryID != countryID {
			state.CityID = ""
		}
	}
	return state
}

// ApplyCityChange backfills broader geography for a city change: the
// country and region follow the city, and a null city clears only itself.
func ApplyCityChange(state CalculatorState, cityID string, dataset Dataset) CalculatorState {
	if cityID == "" {
		state.CityID = ""
		return state
	}
	city, ok := dataset.CityByID(cityID)
	if !ok {
		return state
	}
	state.CityID = cityID
	state.CountryID = city.CountryID
	state.Region = city.Region
	return state
}

// ScopedCities lists the cities in scope for the cascading filters with
// narrower geography winning. Empty filters mean no filtering.
func ScopedCities(dataset Dataset, region, countryID, cityID string) []City {
	if cityID != "" {
		for _, city := range dataset.Cities {
			if city.ID == cityID {
				return []City{city}
			}
		}
		return nil
	}
	if countryID != "" {
		var out []City
		for _, city := range dataset.Cities {
			if city.CountryID != countryID {
				continue
			}
			if region == "" || city.Region == region {
				out = append(out, city)
			}
		}
		return out
	}
	if region != "" {
		var out []City
		for _, city := range dataset.Cities {
			if city.Region == region {
				out = append(out, city)
			}
		}
		return out
	}
	return dataset.Cities
}

// parseAdults decodes the adults count with the codec default.
func parseAdults(query url.Values) int {
	raw, ok := firstParam(query, ParamAdults)
	if !ok {
		return DefaultState().Household.Adults
	}
	value, ok := tsParseInt(trimParam(raw))
	if !ok {
		return DefaultState().Household.Adults
	}
	if value == 1 || value == 2 {
		return int(value)
	}
	return DefaultState().Household.Adults
}

// parseBoundedCount decodes a 0-3 child count with the codec default.
func parseBoundedCount(query url.Values, key string) int {
	raw, ok := firstParam(query, key)
	if !ok {
		return 0
	}
	value, ok := tsParseInt(trimParam(raw))
	if !ok {
		return 0
	}
	if value == 0 || value == 1 || value == 2 || value == 3 {
		return int(value)
	}
	return 0
}

// parseNonNegNumber decodes a non-negative finite number; invalid or
// blank input becomes zero.
func parseNonNegNumber(query url.Values, key string) float64 {
	raw, ok := firstParam(query, key)
	if !ok {
		return 0
	}
	value, ok := tsParseFloat(trimParam(raw))
	if !ok || math.IsNaN(value) || math.IsInf(value, 0) || value < 0 {
		return 0
	}
	return value
}

// parseBaselineSource decodes the baseline source with its default.
func parseBaselineSource(query url.Values) string {
	raw, ok := firstParam(query, ParamBaseline)
	if ok && validBaselines[raw] {
		return raw
	}
	return DefaultState().MinRole.BaselineSource
}

// parseTargetRaw keeps the raw target string so a blank field stays
// distinct from an explicit zero.
func parseTargetRaw(query url.Values) string {
	raw, ok := firstParam(query, ParamTarget)
	if !ok {
		return ""
	}
	return raw
}

// parseCurrencyCode keeps a non-empty code or falls back to the default.
func parseCurrencyCode(query url.Values, key, fallback string) string {
	raw, ok := firstParam(query, key)
	if !ok || strings.TrimSpace(raw) == "" {
		return fallback
	}
	return raw
}

// parseRefRole keeps a non-empty role or falls back to the default.
func parseRefRole(query url.Values) string {
	raw, ok := firstParam(query, ParamRefRole)
	if !ok || strings.TrimSpace(raw) == "" {
		return DefaultState().MinRole.RefRole
	}
	return raw
}

// parseGrossCurrency decodes the salary currency with its default.
func parseGrossCurrency(query url.Values) string {
	raw, ok := firstParam(query, ParamMyGrossCur)
	if ok && validGrossCurrencies[raw] {
		return raw
	}
	return DefaultState().MinRole.MyGrossCurrency
}

// parseCityID resolves a city id against the dataset, clearing unknowns.
func parseCityID(query url.Values, key string, dataset Dataset) string {
	raw, ok := firstParam(query, key)
	if !ok {
		return ""
	}
	if _, found := dataset.CityByID(raw); found {
		return raw
	}
	return ""
}

// formatCount formats a household count for encoding, mirroring the old
// runtime's String(n) rendering.
func formatCount(n int) string {
	return strconv.Itoa(n)
}

// formatNumber formats a number for encoding, mirroring the old runtime's
// String(n) rendering: plain digits without grouping, shortest round-trip
// form, exponent padding removed.
func formatNumber(n float64) string {
	if n == math.Trunc(n) && math.Abs(n) < 1e21 {
		return strconv.FormatInt(int64(n), 10)
	}
	return trimExponentPadding(strconv.FormatFloat(n, 'g', -1, 64))
}

// trimExponentPadding removes the padded zero Go adds to short exponents
// so encoded values match the old runtime's rendering.
func trimExponentPadding(text string) string {
	index := strings.IndexByte(text, 'e')
	if index < 0 {
		return text
	}
	prefix, exponent := text[:index+1], text[index+1:]
	sign := ""
	if strings.HasPrefix(exponent, "-") || strings.HasPrefix(exponent, "+") {
		sign, exponent = exponent[:1], exponent[1:]
	}
	exponent = strings.TrimLeft(exponent, "0")
	if exponent == "" {
		exponent = "0"
	}
	return prefix + sign + exponent
}
