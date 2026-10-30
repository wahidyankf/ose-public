package benchmark

import (
	"net/url"
	"strconv"
)

// Filters are the comparable benchmark options. P2 fills the full option
// set behind this struct.
type Filters struct {
	UseCase   string
	PriceBand string
	MinScore  float64
}

// ModelResult is one scored model row.
type ModelResult struct {
	Name     string  `json:"name"`
	Score    float64 `json:"score"`
	PriceUSD float64 `json:"price_usd"`
}

// Result is one comparison outcome; Empty marks the no-match state.
type Result struct {
	Models []ModelResult `json:"models"`
	Empty  bool          `json:"empty"`
}

// Engine is the P1H in-memory benchmark double. P2 replaces canned vectors
// with calculations over the shared datasets.
type Engine struct {
	vectors map[string]Result
}

// NewFakeEngine seeds the in-memory double.
func NewFakeEngine(vectors map[string]Result) *Engine {
	return &Engine{vectors: vectors}
}

// key renders the canned-vector lookup key.
func key(f Filters) string {
	return f.UseCase + "|" + f.PriceBand
}

// Score returns the canned vector for known filters, or the empty state.
func (e *Engine) Score(f Filters) Result {
	if result, ok := e.vectors[key(f)]; ok {
		return result
	}
	return Result{Empty: true}
}

// Defaults are the codec fallbacks for invalid filter values.
func Defaults() Filters {
	return Filters{UseCase: "chat", PriceBand: "mid", MinScore: 0}
}

// validOptions enumerates the P1H corpus values. P2 derives these sets from
// the shared datasets instead of listing them here.
var validOptions = map[string]map[string]bool{
	"use-case":   {"chat": true},
	"price-band": {"mid": true, "ultra": true},
}

func validOrDefault(kind, value string) string {
	if validOptions[kind][value] {
		return value
	}
	if kind == "price-band" {
		return Defaults().PriceBand
	}
	return Defaults().UseCase
}

// EncodeFilters serializes supported options into shareable query state.
func EncodeFilters(f Filters) string {
	query := url.Values{}
	query.Set("use-case", f.UseCase)
	query.Set("price-band", f.PriceBand)
	query.Set("min-score", strconv.FormatFloat(f.MinScore, 'f', -1, 64))
	return query.Encode()
}

// DecodeFilters restores options, applying defaults for invalid values.
func DecodeFilters(query url.Values) Filters {
	defs := Defaults()
	filters := Filters{
		UseCase:   validOrDefault("use-case", query.Get("use-case")),
		PriceBand: validOrDefault("price-band", query.Get("price-band")),
	}
	raw := query.Get("min-score")
	if raw == "" {
		return filters
	}
	score, err := strconv.ParseFloat(raw, 64)
	if err != nil || score < 0 || score > 10 {
		filters.MinScore = defs.MinScore
		return filters
	}
	filters.MinScore = score
	return filters
}
