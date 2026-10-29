package calculator

// Shared cost-of-living dataset decoded directly from
// libs/ayokoding-data/data/cost-of-living.json (countries, cities, role
// matrix) composed with libs/ayokoding-data/data/fx.json. The independent
// FX snapshot date is never moved together with the dataset dates, list
// order is preserved, and absent optional properties stay absent. Nothing
// is refreshed here and no household or salary record is logged or
// persisted.

import (
	"encoding/json"
	"fmt"
)

// LocalizedString holds the English and Indonesian display names.
type LocalizedString struct {
	En string `json:"en"`
	ID string `json:"id"`
}

// Money is a local-currency amount with its source confidence.
type Money struct {
	Amount     float64 `json:"amount"`
	Confidence string  `json:"confidence"`
	Note       string  `json:"note"`
}

// ExpenseCategories holds the per-category monthly medians in local
// currency. Only the used categories drive estimates.
type ExpenseCategories struct {
	Housing    Money `json:"housing"`
	Food       Money `json:"food"`
	Transport  Money `json:"transport"`
	Utilities  Money `json:"utilities"`
	Healthcare Money `json:"healthcare"`
	Lifestyle  Money `json:"lifestyle"`
}

// SchoolMedians holds the monthly per-child medians by school type.
type SchoolMedians struct {
	Public  Money `json:"public"`
	Private Money `json:"private"`
}

// SunkCosts holds the one-time relocation spend in local currency.
type SunkCosts struct {
	Deposit   Money `json:"deposit"`
	KeyMoney  Money `json:"keyMoney"`
	Moving    Money `json:"moving"`
	VisaAdmin Money `json:"visaAdmin"`
}

// Relocation holds the one-time relocation figures in local currency.
type Relocation struct {
	SunkCosts        SunkCosts `json:"sunkCosts"`
	LiquidityReserve struct {
		CashCushion Money `json:"cashCushion"`
	} `json:"liquidityReserve"`
}

// SubNational holds an optional sub-national tax layer.
type SubNational struct {
	Name          LocalizedString  `json:"name"`
	EffectiveRate map[string]Money `json:"effectiveRate"`
}

// ForeignerSchooling records whether foreign residents can use public
// schools on terms close to locals.
type ForeignerSchooling struct {
	Access     string `json:"access"`
	Confidence string `json:"confidence"`
	Note       string `json:"note"`
}

// Country is one tax and schooling jurisdiction.
type Country struct {
	ID                string          `json:"id"`
	Name              LocalizedString `json:"name"`
	BandThresholdsUSD struct {
		LowToMid  float64 `json:"lowToMid"`
		MidToHigh float64 `json:"midToHigh"`
	} `json:"bandThresholdsUsd"`
	EffectiveRate         map[string]Money   `json:"effectiveRate"`
	ForeignerPublicSchool ForeignerSchooling `json:"foreignerPublicSchool"`
	SubNational           *SubNational       `json:"subNational"`
}

// City is one tech-hub city with local-currency medians.
type City struct {
	ID                   string            `json:"id"`
	Name                 LocalizedString   `json:"name"`
	CountryID            string            `json:"countryId"`
	Currency             string            `json:"currency"`
	Region               string            `json:"region"`
	Expenses             ExpenseCategories `json:"expenses"`
	ChildcareMedianLocal Money             `json:"childcareMedianLocal"`
	SchoolMedianLocal    SchoolMedians     `json:"schoolMedianLocal"`
	Relocation           Relocation        `json:"relocation"`
	SubNational          *SubNational      `json:"subNational"`
}

// FxTable maps ISO-4217 codes to the USD value of one unit.
type FxTable struct {
	SnapshotDate    string             `json:"fxSnapshotDate"`
	RatesUSDPerUnit map[string]float64 `json:"ratesUsdPerUnit"`
}

// Dataset composes the cost-of-living snapshot with the independent FX
// snapshot. Cities and countries stay in source order.
type Dataset struct {
	SnapshotDate string
	Fx           FxTable
	Countries    []Country
	Cities       []City
	byCity       map[string]*City
	byCountry    map[string]*Country
}

// SalaryPoint is one distribution point in local currency.
type SalaryPoint struct {
	MonthlyGrossLocal float64 `json:"monthlyGrossLocal"`
	Confidence        string  `json:"confidence"`
	Note              string  `json:"note"`
}

// RoleDistribution holds one country and role salary distribution.
type RoleDistribution struct {
	P25           SalaryPoint `json:"p25"`
	Median        SalaryPoint `json:"median"`
	P75           SalaryPoint `json:"p75"`
	NonSalaryComp struct {
		AnnualLocal float64 `json:"annualLocal"`
		Confidence  string  `json:"confidence"`
		Note        string  `json:"note"`
	} `json:"nonSalaryComp"`
}

// LadderRung is one ranked role on the progression ladder.
type LadderRung struct {
	Role  string          `json:"role"`
	Rank  int             `json:"rank"`
	Track string          `json:"track"`
	Label LocalizedString `json:"label"`
}

// RoleMatrix holds the salary ladder and per-country distributions with
// its own snapshot date.
type RoleMatrix struct {
	SnapshotDate string                                 `json:"snapshotDate"`
	Ladder       []LadderRung                           `json:"ladder"`
	Salaries     map[string]map[string]RoleDistribution `json:"salaries"`
}

// costOfLivingFile mirrors the cost-of-living.json envelope.
type costOfLivingFile struct {
	SnapshotDate string     `json:"snapshotDate"`
	Countries    []Country  `json:"countries"`
	Cities       []City     `json:"cities"`
	RoleMatrix   RoleMatrix `json:"roleMatrix"`
}

// LoadDataset decodes and validates the shared calculator sources,
// composing the dataset with the independent FX snapshot. List order is
// preserved and the FX snapshot date stays independent of the dataset
// dates. Errors carry no decoded input values.
func LoadDataset(costOfLivingData, fxData []byte) (Dataset, RoleMatrix, error) {
	var file costOfLivingFile
	if err := json.Unmarshal(costOfLivingData, &file); err != nil {
		return Dataset{}, RoleMatrix{}, fmt.Errorf("calculator: decode cost-of-living dataset: %w", err)
	}
	var fx FxTable
	if err := json.Unmarshal(fxData, &fx); err != nil {
		return Dataset{}, RoleMatrix{}, fmt.Errorf("calculator: decode fx snapshot: %w", err)
	}
	dataset := Dataset{
		SnapshotDate: file.SnapshotDate,
		Fx:           fx,
		Countries:    file.Countries,
		Cities:       file.Cities,
	}
	if err := dataset.buildIndexes(); err != nil {
		return Dataset{}, RoleMatrix{}, err
	}
	return dataset, file.RoleMatrix, nil
}

// buildIndexes validates the decoded dataset without reordering it.
func (d *Dataset) buildIndexes() error {
	if d.SnapshotDate == "" {
		return fmt.Errorf("calculator: dataset is missing snapshotDate")
	}
	if len(d.Countries) == 0 {
		return fmt.Errorf("calculator: dataset holds no countries")
	}
	if len(d.Cities) == 0 {
		return fmt.Errorf("calculator: dataset holds no cities")
	}
	if d.Fx.SnapshotDate == "" {
		return fmt.Errorf("calculator: fx snapshot is missing fxSnapshotDate")
	}
	if len(d.Fx.RatesUSDPerUnit) == 0 {
		return fmt.Errorf("calculator: fx snapshot holds no rates")
	}
	d.byCity = make(map[string]*City, len(d.Cities))
	for index := range d.Cities {
		city := &d.Cities[index]
		if city.ID == "" || city.CountryID == "" || city.Currency == "" || city.Region == "" {
			return fmt.Errorf("calculator: dataset holds an incomplete city")
		}
		if _, ok := d.Fx.RatesUSDPerUnit[city.Currency]; !ok {
			return fmt.Errorf("calculator: dataset holds a city with an unknown currency")
		}
		d.byCity[city.ID] = city
	}
	d.byCountry = make(map[string]*Country, len(d.Countries))
	for index := range d.Countries {
		country := &d.Countries[index]
		if country.ID == "" {
			return fmt.Errorf("calculator: dataset holds a country without an id")
		}
		if len(country.EffectiveRate) == 0 {
			return fmt.Errorf("calculator: dataset holds a country without an effective rate")
		}
		d.byCountry[country.ID] = country
	}
	for _, city := range d.Cities {
		if _, ok := d.byCountry[city.CountryID]; !ok {
			return fmt.Errorf("calculator: dataset holds a city with an unknown country")
		}
	}
	return nil
}

// CityByID resolves a city by id.
func (d Dataset) CityByID(id string) (City, bool) {
	city, ok := d.byCity[id]
	if !ok {
		return City{}, false
	}
	return *city, true
}

// CountryByID resolves a country by id.
func (d Dataset) CountryByID(id string) (Country, bool) {
	country, ok := d.byCountry[id]
	if !ok {
		return Country{}, false
	}
	return *country, true
}
