package calculator

import (
	"net/url"
	"strconv"
)

// Inputs are the supported calculator options. P2 fills the full geography,
// household, schooling, and income set behind this struct.
type Inputs struct {
	City    string
	Role    string
	Mode    string
	Workers int
}

// Estimate is one cost-of-living outcome; Empty marks the fallback state.
type Estimate struct {
	MonthlyCostUSD float64 `json:"monthly_cost_usd"`
	MonthlySaving  float64 `json:"monthly_saving"`
	MinRole        string  `json:"min_role"`
	Empty          bool    `json:"empty"`
}

// Engine is the P1H in-memory calculator double. P2 replaces canned vectors
// with calculations over the shared datasets.
type Engine struct {
	vectors map[string]Estimate
}

// NewFakeEngine seeds the in-memory double.
func NewFakeEngine(vectors map[string]Estimate) *Engine {
	return &Engine{vectors: vectors}
}

// key renders the canned-vector lookup key.
func key(in Inputs) string {
	return in.City + "|" + in.Role + "|" + in.Mode + "|" + strconv.Itoa(in.Workers)
}

// Compute returns the canned vector for known inputs, or the fallback state.
func (e *Engine) Compute(in Inputs) Estimate {
	if estimate, ok := e.vectors[key(in)]; ok {
		return estimate
	}
	return Estimate{Empty: true}
}

// Defaults are the codec fallbacks for invalid inputs.
func Defaults() Inputs {
	return Inputs{City: "jakarta", Role: "mid", Mode: "standard", Workers: 1}
}

// validOptions enumerates the P1H corpus values. P2 derives these sets from
// the shared datasets instead of listing them here.
var validOptions = map[string]map[string]bool{
	"city": {"jakarta": true},
	"role": {"mid": true},
	"mode": {"standard": true},
}

func validOrDefault(kind, value, fallback string) string {
	if validOptions[kind][value] {
		return value
	}
	return fallback
}

// EncodeInputs serializes supported options into shareable query state.
func EncodeInputs(in Inputs) string {
	query := url.Values{}
	query.Set("city", in.City)
	query.Set("role", in.Role)
	query.Set("mode", in.Mode)
	query.Set("workers", strconv.Itoa(in.Workers))
	return query.Encode()
}

// DecodeInputs restores options, applying the codec recovery rules: unknown
// cities fall back with an empty estimate, other invalid fields reset.
func DecodeInputs(query url.Values) Inputs {
	defs := Defaults()
	inputs := Inputs{
		City: validOrDefault("city", query.Get("city"), ""),
		Role: validOrDefault("role", query.Get("role"), defs.Role),
		Mode: validOrDefault("mode", query.Get("mode"), defs.Mode),
	}
	raw := query.Get("workers")
	workers, err := strconv.Atoi(raw)
	if err != nil || workers < 0 || workers > 20 {
		workers = defs.Workers
	}
	inputs.Workers = workers
	return inputs
}

// KnownCity reports whether the codec accepts a city selection.
func KnownCity(city string) bool {
	return validOptions["city"][city]
}
