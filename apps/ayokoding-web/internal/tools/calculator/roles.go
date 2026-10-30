package calculator

// Pure role-lookup calculations ported from the current TypeScript core:
// median-based salary ranking, baseline resolution, the rank ladder, and
// the minimum qualifying role. Absolute comparisons stay in USD and
// non-salary comp never enters the savings math.

import (
	"fmt"
	"sort"
)

// Baseline sources for the minimum-role tab.
const (
	BaselineSavingsTarget = "savings_target"
	BaselineReferenceRole = "reference_role"
	BaselineMySalary      = "my_salary"
)

// LadderEntry ranks one role by its best city's essential savings.
type LadderEntry struct {
	Role                    string
	Rank                    int
	Track                   string
	BestCity                City
	BestCountry             Country
	BestEssentialSavingsUSD float64
	P25USD                  float64
	MedianUSD               float64
	P75USD                  float64
	NonSalaryCompUSD        float64
	TotalCompUSD            float64
	Confidence              string
	Clears                  bool
}

// CityRoleEntry pairs every in-scope city with every ladder role. Unlike a
// ladder entry there is no per-role argmax: every qualifying place
// surfaces on its own.
type CityRoleEntry struct {
	City                City
	Country             Country
	Role                string
	Rank                int
	Track               string
	EssentialSavingsUSD float64
	P25USD              float64
	MedianUSD           float64
	P75USD              float64
	NonSalaryCompUSD    float64
	TotalCompUSD        float64
	Confidence          string
	Clears              bool
}

// BaselineInput carries one baseline source's inputs.
type BaselineInput struct {
	GrossMonthlyUSD float64
	CityID          string
	Role            string
	AmountLocal     float64
	DisplayCurrency string
}

// RoleMedianGrossUSD converts the role median to monthly USD.
func RoleMedianGrossUSD(fx FxTable, matrix RoleMatrix, city *City, role string) float64 {
	distribution, ok := matrix.Salaries[city.CountryID][role]
	if !ok {
		return 0
	}
	rate, err := FxToUSD(fx, city.Currency)
	if err != nil {
		return 0
	}
	return distribution.Median.MonthlyGrossLocal * rate
}

// RoleSalaryDistributionUSD converts p25, median, and p75 to USD.
func RoleSalaryDistributionUSD(fx FxTable, matrix RoleMatrix, city *City, role string) (p25, median, p75 float64) {
	distribution := matrix.Salaries[city.CountryID][role]
	rate, err := FxToUSD(fx, city.Currency)
	if err != nil {
		return 0, 0, 0
	}
	return distribution.P25.MonthlyGrossLocal * rate,
		distribution.Median.MonthlyGrossLocal * rate,
		distribution.P75.MonthlyGrossLocal * rate
}

// RoleNonSalaryCompUSD converts annual non-salary comp to USD.
func RoleNonSalaryCompUSD(fx FxTable, matrix RoleMatrix, city *City, role string) float64 {
	distribution, ok := matrix.Salaries[city.CountryID][role]
	if !ok {
		return 0
	}
	rate, err := FxToUSD(fx, city.Currency)
	if err != nil {
		return 0
	}
	return distribution.NonSalaryComp.AnnualLocal * rate
}

// RoleTotalCompUSD totals annual base plus non-salary comp in USD.
// Informational only: never used in ranking.
func RoleTotalCompUSD(fx FxTable, matrix RoleMatrix, city *City, role string) float64 {
	return RoleMedianGrossUSD(fx, matrix, city, role)*12 + RoleNonSalaryCompUSD(fx, matrix, city, role)
}

// CandidateEssentialSavingsUSD ranks one city and role by essential
// savings on the role median, excluding lifestyle.
func CandidateEssentialSavingsUSD(fx FxTable, matrix RoleMatrix, country *Country, city *City, role string, household Household, schoolType, area string) float64 {
	grossUSD := RoleMedianGrossUSD(fx, matrix, city, role)
	row, err := SavingsRowFor(grossUSD, city, country, fx, household, schoolType, area)
	if err != nil {
		return 0
	}
	return row.EssentialSavings
}

// distributionConfidence carries the median salary point confidence.
func distributionConfidence(matrix RoleMatrix, countryID, role string) string {
	if distribution, ok := matrix.Salaries[countryID][role]; ok {
		if distribution.Median.Confidence != "" {
			return distribution.Median.Confidence
		}
	}
	return "high"
}

// BestCityForRole returns the candidate city maximizing essential savings
// for a role. A nil scope means every dataset city is a candidate.
func BestCityForRole(dataset Dataset, matrix RoleMatrix, role string, household Household, schoolType, area string, scope []City) (City, float64, string, error) {
	candidates := scope
	if candidates == nil {
		candidates = dataset.Cities
	}
	var best City
	bestSavings := 0.0
	bestConfidence := "proxy"
	found := false
	for index := range candidates {
		city := candidates[index]
		country, ok := dataset.CountryByID(city.CountryID)
		if !ok {
			continue
		}
		savings := CandidateEssentialSavingsUSD(dataset.Fx, matrix, &country, &city, role, household, schoolType, area)
		if !found || savings > bestSavings {
			best, bestSavings, found = city, savings, true
			bestConfidence = distributionConfidence(matrix, city.CountryID, role)
		}
	}
	if !found {
		return City{}, 0, "", fmt.Errorf("calculator: no candidate city")
	}
	return best, bestSavings, bestConfidence, nil
}

// RankLadder ranks every ladder role by its best city's savings.
func RankLadder(dataset Dataset, matrix RoleMatrix, household Household, schoolType, area string, scope []City) ([]LadderEntry, error) {
	ladder := make([]LadderEntry, 0, len(matrix.Ladder))
	for _, rung := range matrix.Ladder {
		best, savings, confidence, err := BestCityForRole(dataset, matrix, rung.Role, household, schoolType, area, scope)
		if err != nil {
			return nil, err
		}
		// Every ranked city passed its country's lookup to earn its
		// place, so the country's lookup succeeds here by construction.
		bestCountry, _ := dataset.CountryByID(best.CountryID)
		p25, median, p75 := RoleSalaryDistributionUSD(dataset.Fx, matrix, &best, rung.Role)
		ladder = append(ladder, LadderEntry{
			Role:                    rung.Role,
			Rank:                    rung.Rank,
			Track:                   rung.Track,
			BestCity:                best,
			BestCountry:             bestCountry,
			BestEssentialSavingsUSD: savings,
			P25USD:                  p25,
			MedianUSD:               median,
			P75USD:                  p75,
			NonSalaryCompUSD:        RoleNonSalaryCompUSD(dataset.Fx, matrix, &best, rung.Role),
			TotalCompUSD:            RoleTotalCompUSD(dataset.Fx, matrix, &best, rung.Role),
			Confidence:              confidence,
			Clears:                  false,
		})
	}
	return ladder, nil
}

// MinimumRole returns the lowest-rank role whose best essential savings
// clear the baseline, or empty when nothing clears.
func MinimumRole(baselineUSD float64, ladder []LadderEntry) string {
	var best *LadderEntry
	for index := range ladder {
		entry := &ladder[index]
		qualifies := entry.BestEssentialSavingsUSD >= baselineUSD
		entry.Clears = qualifies
		if qualifies && (best == nil || entry.Rank < best.Rank) {
			best = entry
		}
	}
	if best == nil {
		return ""
	}
	return best.Role
}

// MinimumQualifyingRank returns the lowest clearing rank, or -1.
func MinimumQualifyingRank(entries []CityRoleEntry) int {
	minimum := -1
	for _, entry := range entries {
		if entry.Clears && (minimum < 0 || entry.Rank < minimum) {
			minimum = entry.Rank
		}
	}
	return minimum
}

// ResolveBaselineUsd resolves one baseline source to USD: the user's own
// salary-city savings, the reference role's selected-city savings, or a
// typed savings target converted through the FX table. Errors carry no
// input values.
func ResolveBaselineUSD(source string, input BaselineInput, household Household, schoolType, area string, dataset Dataset, matrix RoleMatrix) (float64, error) {
	switch source {
	case BaselineMySalary:
		city, ok := dataset.CityByID(input.CityID)
		if !ok {
			return 0, fmt.Errorf("calculator: unknown salary city")
		}
		country, ok := dataset.CountryByID(city.CountryID)
		if !ok {
			return 0, fmt.Errorf("calculator: unknown salary country")
		}
		row, err := SavingsRowFor(input.GrossMonthlyUSD, &city, &country, dataset.Fx, household, schoolType, area)
		if err != nil {
			return 0, err
		}
		return row.EssentialSavings, nil
	case BaselineReferenceRole:
		city, ok := dataset.CityByID(input.CityID)
		if !ok {
			return 0, fmt.Errorf("calculator: unknown reference city")
		}
		country, ok := dataset.CountryByID(city.CountryID)
		if !ok {
			return 0, fmt.Errorf("calculator: unknown reference country")
		}
		return CandidateEssentialSavingsUSD(dataset.Fx, matrix, &country, &city, input.Role, household, schoolType, area), nil
	default:
		rate, err := FxToUSD(dataset.Fx, input.DisplayCurrency)
		if err != nil {
			return 0, err
		}
		return input.AmountLocal * rate, nil
	}
}

// EnumerateCityRoleEntries pairs every in-scope city with every ladder
// role, flagging each pair against the baseline bar.
func EnumerateCityRoleEntries(dataset Dataset, matrix RoleMatrix, household Household, schoolType, area string, scope []City, baselineUSD float64) []CityRoleEntry {
	cities := scope
	if cities == nil {
		cities = dataset.Cities
	}
	var entries []CityRoleEntry
	for _, city := range cities {
		country, ok := dataset.CountryByID(city.CountryID)
		if !ok {
			continue
		}
		for _, rung := range matrix.Ladder {
			savings := CandidateEssentialSavingsUSD(dataset.Fx, matrix, &country, &city, rung.Role, household, schoolType, area)
			p25, median, p75 := RoleSalaryDistributionUSD(dataset.Fx, matrix, &city, rung.Role)
			entries = append(entries, CityRoleEntry{
				City:                city,
				Country:             country,
				Role:                rung.Role,
				Rank:                rung.Rank,
				Track:               rung.Track,
				EssentialSavingsUSD: savings,
				P25USD:              p25,
				MedianUSD:           median,
				P75USD:              p75,
				NonSalaryCompUSD:    RoleNonSalaryCompUSD(dataset.Fx, matrix, &city, rung.Role),
				TotalCompUSD:        RoleTotalCompUSD(dataset.Fx, matrix, &city, rung.Role),
				Confidence:          distributionConfidence(matrix, city.CountryID, rung.Role),
				Clears:              savings >= baselineUSD,
			})
		}
	}
	return entries
}

// OrderForDisplay lists qualifying roles first by descending rank down to
// the minimum, then the below-minimum roles, also descending.
func OrderForDisplay(ladder []LadderEntry, minRole string) []LadderEntry {
	minRank := -1
	for _, entry := range ladder {
		if entry.Role == minRole {
			minRank = entry.Rank
			break
		}
	}
	withClears := append([]LadderEntry(nil), ladder...)
	for index := range withClears {
		withClears[index].Clears = minRole != "" && withClears[index].Rank >= minRank
	}
	var qualifying, below []LadderEntry
	for _, entry := range withClears {
		if entry.Clears {
			qualifying = append(qualifying, entry)
		} else {
			below = append(below, entry)
		}
	}
	byRankDesc := func(entries []LadderEntry) {
		sort.SliceStable(entries, func(i, j int) bool { return entries[i].Rank > entries[j].Rank })
	}
	byRankDesc(qualifying)
	byRankDesc(below)
	return append(qualifying, below...)
}

// ToDisplayCurrencies converts a USD savings figure to USD, local city
// currency, and the chosen display currency.
func ToDisplayCurrencies(fx FxTable, savingsUSD float64, cityCurrency, displayCurrency string) (usd, localAmount, display float64, err error) {
	cityRate, err := FxToUSD(fx, cityCurrency)
	if err != nil {
		return 0, 0, 0, err
	}
	if cityRate == 0 {
		return 0, 0, 0, fmt.Errorf("calculator: zero city rate")
	}
	displayValue, err := USDToDisplay(fx, savingsUSD, displayCurrency)
	if err != nil {
		return 0, 0, 0, err
	}
	return savingsUSD, savingsUSD / cityRate, displayValue, nil
}
