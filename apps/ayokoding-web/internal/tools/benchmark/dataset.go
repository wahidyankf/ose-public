package benchmark

// Shared benchmark dataset decoded directly from
// libs/ayokoding-data/data/ai-benchmark.json. List order is significant and
// preserved: models, figures, and specs stay in slices in source order so
// scoring, ordering, and reference results match the TypeScript runtime.
// Source dates and provenance travel with the dataset; nothing is refreshed
// here and no input record is logged or persisted.

import (
	"encoding/json"
	"fmt"
)

// Figure is one independently run benchmark result for a model.
type Figure struct {
	Benchmark string  `json:"benchmark"`
	Version   string  `json:"version"`
	Value     float64 `json:"value"`
	Operator  string  `json:"operator"`
	Config    string  `json:"config"`
	Source    string  `json:"source"`
}

// ApiPrice is the standard API price per 1M tokens, USD.
type ApiPrice struct {
	Input    float64 `json:"input"`
	Output   float64 `json:"output"`
	Source   string  `json:"source"`
	ListedBy string  `json:"listedBy"`
	Note     string  `json:"note"`
}

// CostPerTask is the average spend per benchmark task.
type CostPerTask struct {
	USD      float64 `json:"usd"`
	Operator string  `json:"operator"`
	Source   string  `json:"source"`
}

// Model is one roster row in source order.
type Model struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Vendor      string       `json:"vendor"`
	Line        string       `json:"line"`
	ReleaseDate string       `json:"releaseDate"`
	Access      string       `json:"access"`
	Harnesses   []string     `json:"harnesses"`
	Figures     []Figure     `json:"figures"`
	Price       *ApiPrice    `json:"price"`
	CostPerTask *CostPerTask `json:"costPerTask"`
	Note        string       `json:"note"`
}

// BenchSpec pins one composite benchmark: id, version, weight, and the
// operator order the extraction already applied to figure list order.
type BenchSpec struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Version       string   `json:"version"`
	Weight        float64  `json:"weight"`
	OperatorOrder []string `json:"operatorOrder"`
	URL           string   `json:"url"`
}

// Operator records when one independent operator's board was last read.
type Operator struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	ShortName     string `json:"shortName"`
	URL           string `json:"url"`
	CheckedOn     string `json:"checkedOn"`
	SourceUpdated string `json:"sourceUpdated"`
}

// PriceSource records when one pricing page was last read.
type PriceSource struct {
	Name      string `json:"name"`
	URL       string `json:"url"`
	CheckedOn string `json:"checkedOn"`
}

// InHouseLine names a harness vendor's own model line.
type InHouseLine struct {
	Harness string `json:"harness"`
	Vendor  string `json:"vendor"`
	Line    string `json:"line"`
}

// Config carries the methodology constants so page text and scoring cannot
// drift apart. Every value is decoded from the shared JSON.
type Config struct {
	Specs                    []BenchSpec       `json:"specs"`
	MinScoredBenchmarks      int               `json:"minScoredBenchmarks"`
	CompositeIndexMax        float64           `json:"compositeIndexMax"`
	TierAnchors              map[string]string `json:"tierAnchors"`
	AnchoredTiers            []string          `json:"anchoredTiers"`
	Tiers                    []string          `json:"tiers"`
	FrontierVendors          []string          `json:"frontierVendors"`
	HarnessInHouseLines      []InHouseLine     `json:"harnessInHouseLines"`
	SubstituteHarnesses      []string          `json:"substituteHarnesses"`
	DefaultSubstituteHarness string            `json:"defaultSubstituteHarness"`
	RosterCatalogHarnesses   []string          `json:"rosterCatalogHarnesses"`
	NearestOptionCount       int               `json:"nearestOptionCount"`
	BlendInputShare          float64           `json:"blendInputShare"`
	BlendOutputShare         float64           `json:"blendOutputShare"`
}

// HarnessDisplayNames maps harness ids to proper-noun display names.
type HarnessDisplayNames map[string]string

// Dataset is the decoded shared benchmark source: roster in source order,
// methodology config, operator checks, and price-source checks.
type Dataset struct {
	LastUpdated   string
	Models        []Model
	Config        Config
	DisplayNames  HarnessDisplayNames
	Operators     []Operator
	PriceSources  []PriceSource
	specByID      map[string]BenchSpec
	harnessSet    map[string]bool
	tierSet       map[string]bool
	substituteSet map[string]bool
	frontierSet   map[string]bool
	byID          map[string]*Model
}

// benchmarkFile mirrors the ai-benchmark.json envelope.
type benchmarkFile struct {
	Dataset struct {
		LastUpdated string  `json:"lastUpdated"`
		Models      []Model `json:"models"`
	} `json:"dataset"`
	Benchmarks struct {
		Config
		HarnessDisplayNames HarnessDisplayNames `json:"harnessDisplayNames"`
	} `json:"benchmarks"`
	Operators    []Operator    `json:"operators"`
	PriceSources []PriceSource `json:"priceSources"`
}

// LoadDataset decodes and validates the shared benchmark JSON. Order,
// dates, and provenance are preserved; values are never refreshed.
func LoadDataset(data []byte) (*Dataset, error) {
	var file benchmarkFile
	if err := json.Unmarshal(data, &file); err != nil {
		return nil, fmt.Errorf("benchmark: decode dataset: %w", err)
	}
	dataset := &Dataset{
		LastUpdated:  file.Dataset.LastUpdated,
		Models:       file.Dataset.Models,
		Config:       file.Benchmarks.Config,
		DisplayNames: file.Benchmarks.HarnessDisplayNames,
		Operators:    file.Operators,
		PriceSources: file.PriceSources,
	}
	if err := dataset.buildIndexes(); err != nil {
		return nil, err
	}
	return dataset, nil
}

// buildIndexes validates the decoded dataset without reordering it.
func (d *Dataset) buildIndexes() error {
	if d.LastUpdated == "" {
		return fmt.Errorf("benchmark: dataset is missing lastUpdated")
	}
	if len(d.Models) == 0 {
		return fmt.Errorf("benchmark: dataset holds no models")
	}
	if len(d.Config.Specs) == 0 {
		return fmt.Errorf("benchmark: dataset holds no benchmark specs")
	}
	if len(d.Config.Tiers) == 0 {
		return fmt.Errorf("benchmark: dataset holds no tiers")
	}
	if d.Config.MinScoredBenchmarks < 1 {
		return fmt.Errorf("benchmark: dataset holds no minimum scored benchmark count")
	}
	d.specByID = make(map[string]BenchSpec, len(d.Config.Specs))
	for _, spec := range d.Config.Specs {
		if spec.ID == "" || spec.Version == "" || spec.Weight <= 0 {
			return fmt.Errorf("benchmark: dataset holds an incomplete benchmark spec")
		}
		d.specByID[spec.ID] = spec
	}
	d.harnessSet = make(map[string]bool, len(d.DisplayNames))
	for id := range d.DisplayNames {
		d.harnessSet[id] = true
	}
	if len(d.harnessSet) == 0 {
		return fmt.Errorf("benchmark: dataset holds no harness display names")
	}
	d.tierSet = make(map[string]bool, len(d.Config.Tiers))
	for _, tier := range d.Config.Tiers {
		d.tierSet[tier] = true
	}
	d.substituteSet = make(map[string]bool, len(d.Config.SubstituteHarnesses))
	for _, harness := range d.Config.SubstituteHarnesses {
		d.substituteSet[harness] = true
	}
	d.frontierSet = make(map[string]bool, len(d.Config.FrontierVendors))
	for _, vendor := range d.Config.FrontierVendors {
		d.frontierSet[vendor] = true
	}
	d.byID = make(map[string]*Model, len(d.Models))
	for index := range d.Models {
		model := &d.Models[index]
		if model.ID == "" {
			return fmt.Errorf("benchmark: dataset holds a model without an id")
		}
		d.byID[model.ID] = model
	}
	return nil
}
