package calculator

// Calculator fragment model for the htmx input endpoint and its full-page
// fallback. The handler decodes the query, builds this fragment, and
// renders the coordinated "calculator-fragment" template: rendered cost,
// savings, and minimum-role results plus the canonical encoded URL.
// Invalid scalars recover through the codec; nested or unexpected fields
// mark invalid-filters; an engaged baseline no place clears is the empty
// state; dataset failure is a generic tool error with no misleading finite
// estimate. Salary and household input stays transient view and URL state.

import (
	"math"
	"net/url"
	"sort"
	"strconv"
	"strings"
)

// FragmentData is the rendered calculator result for one input state.
type FragmentData struct {
	Locale       string
	State        CalculatorState
	Encoded      string
	Invalid      bool
	Ready        bool
	Empty        bool
	CostText     string
	CostCurrency string
	SavingsText  string
	MinRole      string
	MinRoleID    string
	Qualifying   int
	Hidden       int
	// NeedsCity replaces the estimate block with selection guidance when no
	// city is selected yet, so defaults never show blank money values.
	NeedsCity bool
	// The option lists below expose the closed input vocabularies so the
	// form renders visible selects instead of free-text boxes.
	TabOptions        []Option
	RegionOptions     []Option
	CountryOptions    []Option
	CityOptions       []Option
	AdultOptions      []Option
	KidOptions        []Option
	SchoolTypeOptions []Option
	AreaOptions       []Option
	BaselineOptions   []Option
	RoleOptions       []Option
	CurrencyOptions   []Option
	GrossCurOptions   []Option
}

// Option is one closed-vocabulary select choice: the codec value and its
// visible label.
type Option struct {
	Value string
	Label string
}

// ResolveFragmentBaseline engages one baseline source exactly as the old
// tool does: a blank savings target stays disengaged while an explicit
// zero engages; the reference role needs its city; the salary baseline
// needs a positive gross and its city. Errors disengage the baseline.
func ResolveFragmentBaseline(state CalculatorState, dataset Dataset, matrix RoleMatrix) (baselineUSD float64, ready bool) {
	household := state.Household
	minRole := state.MinRole
	switch minRole.BaselineSource {
	case BaselineSavingsTarget:
		if strings.TrimSpace(minRole.TargetRaw) == "" {
			return 0, false
		}
		// Mirrors parseFloat(targetRaw) || 0: unparseable input counts as
		// zero while an infinite target stays engaged with a bar nothing
		// clears.
		amount, ok := tsParseFloat(minRole.TargetRaw)
		if !ok || math.IsNaN(amount) {
			amount = 0
		}
		if amount < 0 {
			return 0, false
		}
		resolved, err := ResolveBaselineUSD(BaselineSavingsTarget, BaselineInput{
			AmountLocal: amount, DisplayCurrency: minRole.DisplayCurrency,
		}, household, state.SchoolType, state.Area, dataset, matrix)
		if err != nil {
			return 0, false
		}
		return resolved, true
	case BaselineReferenceRole:
		if minRole.RefCityID == "" {
			return 0, false
		}
		resolved, err := ResolveBaselineUSD(BaselineReferenceRole, BaselineInput{
			Role: minRole.RefRole, CityID: minRole.RefCityID,
		}, household, state.SchoolType, state.Area, dataset, matrix)
		if err != nil {
			return 0, false
		}
		return resolved, true
	case BaselineMySalary:
		if minRole.MyGrossMonthly <= 0 || minRole.MySalaryCityID == "" {
			return 0, false
		}
		salaryCity, ok := dataset.CityByID(minRole.MySalaryCityID)
		if !ok {
			return 0, false
		}
		grossUSD := minRole.MyGrossMonthly
		if minRole.MyGrossCurrency != "usd" && salaryCity.Currency != "USD" {
			rate, err := FxToUSD(dataset.Fx, salaryCity.Currency)
			if err != nil {
				return 0, false
			}
			grossUSD = minRole.MyGrossMonthly * rate
		}
		resolved, err := ResolveBaselineUSD(BaselineMySalary, BaselineInput{
			GrossMonthlyUSD: grossUSD, CityID: minRole.MySalaryCityID,
		}, household, state.SchoolType, state.Area, dataset, matrix)
		if err != nil {
			return 0, false
		}
		return resolved, true
	default:
		return 0, false
	}
}

// BuildFragment computes the rendered calculator result for one input
// state: the selected city's cost, its savings at the entered gross, and
// the minimum qualifying role over the scoped cities for the engaged
// baseline. Until a baseline engages the bar is unreachable so nothing
// clears; an engaged baseline nothing clears is the empty state.
func BuildFragment(dataset Dataset, matrix RoleMatrix, state CalculatorState, locale string) FragmentData {
	fragment := FragmentData{
		Locale:            locale,
		State:             state,
		Encoded:           EncodeState(state),
		NeedsCity:         strings.TrimSpace(state.CityID) == "",
		TabOptions:        tabOptions(),
		RegionOptions:     regionOptions(),
		CountryOptions:    dataset.CountryOptions(state.Region, locale),
		CityOptions:       cityOptions(ScopedCities(dataset, state.Region, state.CountryID, state.CityID), locale),
		AdultOptions:      countOptions(1, 2),
		KidOptions:        countOptions(0, 3),
		SchoolTypeOptions: valueOptions([]string{"public", "private"}),
		AreaOptions:       valueOptions([]string{"center", "rural"}),
		BaselineOptions:   valueOptions([]string{BaselineSavingsTarget, BaselineReferenceRole, BaselineMySalary}),
		RoleOptions:       matrix.RoleOptions(locale),
		CurrencyOptions:   dataset.CurrencyOptions(),
		GrossCurOptions:   valueOptions([]string{"local", "usd"}),
	}
	if city, ok := dataset.CityByID(state.CityID); ok {
		// The country's lookup succeeds here by construction: the loader
		// rejects any city with an unknown country. The explicit scan
		// keeps the lookup guarded for the nil checker without adding an
		// unreachable error branch.
		var country Country
		for _, candidate := range dataset.Countries {
			if candidate.ID == city.CountryID {
				country = candidate
				break
			}
		}
		essentials := EssentialsLocal(&city, &country, state.Household, state.SchoolType, state.Area)
		fragment.CostText = FmtCurrency(essentials, city.Currency)
		fragment.CostCurrency = city.Currency
		if state.Gross > 0 {
			if row, err := SavingsRowFor(state.Gross, &city, &country, dataset.Fx, state.Household, state.SchoolType, state.Area); err == nil {
				if _, local, display, err := ToDisplayCurrencies(dataset.Fx, row.EssentialSavings, city.Currency, state.MinRole.DisplayCurrency); err == nil {
					_ = local
					fragment.SavingsText = FmtCurrencyTrailing(display, state.MinRole.DisplayCurrency)
				}
			}
		}
	}
	scope := ScopedCities(dataset, state.Region, state.CountryID, state.CityID)
	baseline, ready := ResolveFragmentBaseline(state, dataset, matrix)
	fragment.Ready = ready
	bar := math.Inf(1)
	if ready {
		bar = baseline
	}
	entries := EnumerateCityRoleEntries(dataset, matrix, state.Household, state.SchoolType, state.Area, scope, bar)
	for _, entry := range entries {
		if entry.Clears {
			fragment.Qualifying++
		} else {
			fragment.Hidden++
		}
	}
	if ready {
		minRank := MinimumQualifyingRank(entries)
		for _, rung := range matrix.Ladder {
			if rung.Rank == minRank {
				fragment.MinRoleID = rung.Role
				if locale == "id" {
					fragment.MinRole = rung.Label.ID
				} else {
					fragment.MinRole = rung.Label.En
				}
				break
			}
		}
		fragment.Empty = fragment.MinRoleID == ""
	}
	return fragment
}

// DecodeFragment decodes one fragment query into its rendered fragment:
// invalid nested or unexpected fields yield the invalid-filters fragment,
// never a crash and never a misleading finite estimate. A city value that
// was selected but reconciled away (unknown or out of scope) keeps the
// fallback behavior; only a missing city selection requests guidance.
func DecodeFragment(query url.Values, dataset Dataset, matrix RoleMatrix, locale string) FragmentData {
	state, validity := DecodeState(query, dataset)
	if validity != Valid {
		return FragmentData{Locale: locale, State: state, Invalid: true}
	}
	fragment := BuildFragment(dataset, matrix, state, locale)
	if raw, ok := firstParam(query, ParamCity); ok && strings.TrimSpace(raw) != "" {
		fragment.NeedsCity = false
	}
	return fragment
}

// tabOptions lists the calculator tabs in stable order.
func tabOptions() []Option {
	return valueOptions([]string{"cost", "savings", "min-role"})
}

// regionOptions lists known regions in stable order.
func regionOptions() []Option {
	regions := make([]string, 0, len(validRegions))
	for region := range validRegions {
		regions = append(regions, region)
	}
	sort.Strings(regions)
	return valueOptions(regions)
}

// countOptions lists an inclusive integer range for household selects.
func countOptions(from, to int) []Option {
	options := make([]Option, 0, to-from+1)
	for value := from; value <= to; value++ {
		options = append(options, Option{Value: strconv.Itoa(value), Label: strconv.Itoa(value)})
	}
	return options
}

// valueOptions lifts raw codec values into self-labeled options.
func valueOptions(values []string) []Option {
	options := make([]Option, 0, len(values))
	for _, value := range values {
		options = append(options, Option{Value: value, Label: value})
	}
	return options
}

// localizedName resolves the visible dataset name for the locale,
// falling back across languages before the raw id.
func localizedName(name LocalizedString, locale string) string {
	if locale == "id" && name.ID != "" {
		return name.ID
	}
	if name.En != "" {
		return name.En
	}
	return name.ID
}

// CountryOptions lists countries with a city in the region scope, or every
// country when no region is selected, with localized labels. A missing
// label falls back to the raw id so no visible option renders blank.
func (d Dataset) CountryOptions(region, locale string) []Option {
	inScope := make(map[string]bool, len(d.Countries))
	if region == "" {
		for _, country := range d.Countries {
			inScope[country.ID] = true
		}
	} else {
		for _, city := range d.Cities {
			if city.Region == region {
				inScope[city.CountryID] = true
			}
		}
	}
	options := make([]Option, 0, len(d.Countries))
	for _, country := range d.Countries {
		if !inScope[country.ID] {
			continue
		}
		options = append(options, Option{Value: country.ID, Label: orID(country.ID, localizedName(country.Name, locale))})
	}
	return options
}

// cityOptions lists scoped cities with localized labels. A missing label
// falls back to the raw id so no visible option renders blank.
func cityOptions(cities []City, locale string) []Option {
	options := make([]Option, 0, len(cities))
	for _, city := range cities {
		options = append(options, Option{Value: city.ID, Label: orID(city.ID, localizedName(city.Name, locale))})
	}
	return options
}

// RoleOptions lists the salary ladder roles with localized labels. A missing
// label falls back to the raw role so no visible option renders blank.
func (m RoleMatrix) RoleOptions(locale string) []Option {
	options := make([]Option, 0, len(m.Ladder))
	for _, rung := range m.Ladder {
		options = append(options, Option{Value: rung.Role, Label: orID(rung.Role, localizedName(rung.Label, locale))})
	}
	return options
}

// orID keeps the visible label non-blank by falling back to the raw value.
func orID(value, label string) string {
	if label == "" {
		return value
	}
	return label
}

// CurrencyOptions lists known FX currencies in stable order.
func (d Dataset) CurrencyOptions() []Option {
	codes := make([]string, 0, len(d.Fx.RatesUSDPerUnit))
	for code := range d.Fx.RatesUSDPerUnit {
		codes = append(codes, code)
	}
	sort.Strings(codes)
	return valueOptions(codes)
}
