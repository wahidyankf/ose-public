package calculator

// Pure cost-of-living calculations ported from the current TypeScript core.
// Every USD conversion routes through FxToUSD; the OECD modified
// equivalence scale drives per-category household scaling exactly as the
// old runtime applies it. No I/O, no side effects, and no household or
// salary record is logged or persisted.

// Household sizes the estimate basis.
type Household struct {
	Adults        int
	PreschoolKids int
	SchoolKids    int
}

// SavingsRow is the computed savings outcome for one city and salary.
type SavingsRow struct {
	CityID                string
	Currency              string
	GrossMonthlyUSD       float64
	NetUSD                float64
	EssentialsUSD         float64
	LifestyleUSD          float64
	EssentialSavings      float64
	AfterLifestyleSavings float64
}

// Area multipliers and sub-linear damping mirror the shared policy.
const (
	AreaCenterMultiplier = 1.0
	AreaRuralMultiplier  = 0.75
	SublinearDamping     = 0.5
)

// Income bands for tax lookup.
const (
	BandLow  = "low"
	BandMid  = "mid"
	BandHigh = "high"
)

// Expense categories with distinct OECD scaling behaviour.
const (
	CategoryHousing    = "housing"
	CategoryFood       = "food"
	CategoryTransport  = "transport"
	CategoryUtilities  = "utilities"
	CategoryHealthcare = "healthcare"
)

// Area multipliers by area id.
var areaMultipliers = map[string]float64{
	"center": AreaCenterMultiplier,
	"rural":  AreaRuralMultiplier,
}

// EquivalisedSize applies the OECD modified equivalence scale: the first
// adult counts 1.0, each additional adult 0.5, each child 0.3.
func EquivalisedSize(household Household) float64 {
	return 1.0 + 0.5*float64(household.Adults-1) + 0.3*float64(household.PreschoolKids+household.SchoolKids)
}

// SubLinear damps housing and utility sharing economies of scale.
func SubLinear(household Household) float64 {
	return 1 + SublinearDamping*(EquivalisedSize(household)-1)
}

// PerCapita scales food and healthcare with equivalised size.
func PerCapita(household Household) float64 {
	return EquivalisedSize(household)
}

// IncomeBand assigns the low, mid, or high tax band.
func IncomeBand(grossMonthlyUSD float64, country *Country) string {
	if grossMonthlyUSD < country.BandThresholdsUSD.LowToMid {
		return BandLow
	}
	if grossMonthlyUSD < country.BandThresholdsUSD.MidToHigh {
		return BandMid
	}
	return BandHigh
}

// EffectiveRateForCity returns the combined federal plus optional
// sub-national effective rate between 0 and 1.
func EffectiveRateForCity(grossMonthlyUSD float64, city *City, country *Country) float64 {
	band := IncomeBand(grossMonthlyUSD, country)
	federal := country.EffectiveRate[band].Amount
	subNational := 0.0
	if city.SubNational != nil {
		subNational = city.SubNational.EffectiveRate[band].Amount
	}
	return federal + subNational
}

// NetUSD returns the net monthly income in USD after combined tax.
// The gross figure is already in USD when it arrives here.
func NetUSD(grossMonthlyUSD float64, city *City, country *Country) float64 {
	return grossMonthlyUSD * (1 - EffectiveRateForCity(grossMonthlyUSD, city, country))
}

// ScaleAmount applies OECD household scaling to one expense category
// amount in local currency: housing scales sub-linearly with the area
// factor, food and healthcare per capita, transport stays flat, and
// utilities scale sub-linearly without an area factor.
func ScaleAmount(amount float64, category string, household Household, area string) float64 {
	sublinear := SubLinear(household)
	perCapita := PerCapita(household)
	switch category {
	case CategoryHousing:
		return amount * sublinear * areaMultipliers[area]
	case CategoryFood:
		return amount * perCapita
	case CategoryTransport:
		return amount
	case CategoryUtilities:
		return amount * sublinear
	case CategoryHealthcare:
		return amount * perCapita
	default:
		return amount
	}
}

// ChildcareLocal totals monthly childcare in local currency: the
// per-preschool-child median with no OECD damping.
func ChildcareLocal(city *City, household Household) float64 {
	return city.ChildcareMedianLocal.Amount * float64(household.PreschoolKids)
}

// ForeignerCanUsePublicSchool reports whether foreign residents can budget
// local-price public school. Only fully open access qualifies.
func ForeignerCanUsePublicSchool(country *Country) bool {
	return country.ForeignerPublicSchool.Access == "open"
}

// EffectiveSchoolType collapses public to private where public schooling is
// not fully open to foreign residents.
func EffectiveSchoolType(country *Country, schoolType string) string {
	if schoolType == "public" && !ForeignerCanUsePublicSchool(country) {
		return "private"
	}
	return schoolType
}

// SchoolLocal totals monthly school cost in local currency per school-age
// child at the effective school type.
func SchoolLocal(city *City, country *Country, household Household, schoolType string) float64 {
	effective := EffectiveSchoolType(country, schoolType)
	if effective == "public" {
		return city.SchoolMedianLocal.Public.Amount * float64(household.SchoolKids)
	}
	return city.SchoolMedianLocal.Private.Amount * float64(household.SchoolKids)
}

// EssentialsLocal totals monthly essentials in local currency: housing,
// food, transport, utilities, healthcare, childcare, and school.
func EssentialsLocal(city *City, country *Country, household Household, schoolType, area string) float64 {
	expenses := city.Expenses
	housing := ScaleAmount(expenses.Housing.Amount, CategoryHousing, household, area)
	food := ScaleAmount(expenses.Food.Amount, CategoryFood, household, area)
	transport := ScaleAmount(expenses.Transport.Amount, CategoryTransport, household, area)
	utilities := ScaleAmount(expenses.Utilities.Amount, CategoryUtilities, household, area)
	healthcare := ScaleAmount(expenses.Healthcare.Amount, CategoryHealthcare, household, area)
	childcare := ChildcareLocal(city, household)
	school := SchoolLocal(city, country, household, schoolType)
	return housing + food + transport + utilities + healthcare + childcare + school
}

// ExpensesLocal totals monthly essentials plus lifestyle in local currency.
// Lifestyle stays flat and is never household-scaled.
func ExpensesLocal(city *City, country *Country, household Household, schoolType, area string) float64 {
	return EssentialsLocal(city, country, household, schoolType, area) + city.Expenses.Lifestyle.Amount
}

// RelocationSunkLocal totals one-time sunk relocation costs in local
// currency: money actually spent, never the liquidity reserve.
func RelocationSunkLocal(city *City) float64 {
	sunk := city.Relocation.SunkCosts
	return sunk.Deposit.Amount + sunk.KeyMoney.Amount + sunk.Moving.Amount + sunk.VisaAdmin.Amount
}

// RelocationSunkUSD converts sunk relocation costs to USD.
func RelocationSunkUSD(city *City, fx FxTable) (float64, error) {
	rate, err := FxToUSD(fx, city.Currency)
	if err != nil {
		return 0, err
	}
	return RelocationSunkLocal(city) * rate, nil
}

// LiquidityReserveLocal reports the cash cushion in local currency.
func LiquidityReserveLocal(city *City) float64 {
	return city.Relocation.LiquidityReserve.CashCushion.Amount
}

// LiquidityReserveUSD converts the cash cushion to USD.
func LiquidityReserveUSD(city *City, fx FxTable) (float64, error) {
	rate, err := FxToUSD(fx, city.Currency)
	if err != nil {
		return 0, err
	}
	return LiquidityReserveLocal(city) * rate, nil
}

// SavingsRowFor computes the full savings row for one city and salary:
// essential savings are net minus essentials in USD, and lifestyle is
// excluded from the ranking key. Relocation figures never enter savings.
func SavingsRowFor(grossMonthlyUSD float64, city *City, country *Country, fx FxTable, household Household, schoolType, area string) (SavingsRow, error) {
	rate, err := FxToUSD(fx, city.Currency)
	if err != nil {
		return SavingsRow{}, err
	}
	net := NetUSD(grossMonthlyUSD, city, country)
	essentialsUSD := EssentialsLocal(city, country, household, schoolType, area) * rate
	lifestyleUSD := city.Expenses.Lifestyle.Amount * rate
	essential := net - essentialsUSD
	afterLifestyle := essential - lifestyleUSD
	return SavingsRow{
		CityID:                city.ID,
		Currency:              city.Currency,
		GrossMonthlyUSD:       grossMonthlyUSD,
		NetUSD:                net,
		EssentialsUSD:         essentialsUSD,
		LifestyleUSD:          lifestyleUSD,
		EssentialSavings:      essential,
		AfterLifestyleSavings: afterLifestyle,
	}, nil
}

// SortByEssentialSavings orders rows by essential savings descending.
func SortByEssentialSavings(rows []SavingsRow) []SavingsRow {
	out := append([]SavingsRow(nil), rows...)
	for i := 1; i < len(out); i++ {
		for j := i; j > 0 && out[j].EssentialSavings > out[j-1].EssentialSavings; j-- {
			out[j], out[j-1] = out[j-1], out[j]
		}
	}
	return out
}
