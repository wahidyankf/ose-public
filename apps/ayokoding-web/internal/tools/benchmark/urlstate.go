package benchmark

// Benchmark fragment query codec ported from the current url-state: the
// query string is the single source of truth, unset values are omitted,
// unknown scalar values recover to unset, and duplicated parameters resolve
// to their first value. Scalar-only filters only: nested or unexpected
// fields yield the invalid-filters state instead of a crash. Route locale
// stays mount-owned; no locale field is read here.

import (
	"net/url"
	"strings"
)

// Query keys accepted on the benchmark fragment and page routes.
const (
	ParamHarness    = "harness"
	ParamTier       = "tier"
	ParamSub        = "sub"
	ParamSubHarness = "sub-harness"
)

// Validity is the fragment validity of a decoded benchmark state.
type Validity int

const (
	// Valid decodes to usable filter state with codec defaults applied.
	Valid Validity = iota
	// InvalidFilters marks a nested/structured value or an unexpected
	// field; the handler renders the inline invalid-filters state.
	InvalidFilters
)

// UrlState carries the comparable benchmark options. Empty means unset.
type UrlState struct {
	Harness    string
	Tier       string
	Sub        string
	SubHarness string
}

// firstValue resolves a duplicated parameter to its first value, mirroring
// URLSearchParams.get in the old codec.
func firstValue(query url.Values, key string) (string, bool) {
	values, ok := query[key]
	if !ok || len(values) == 0 {
		return "", false
	}
	return values[0], true
}

// DecodeState parses the query into filter state. Unknown scalar values
// recover to unset; nested/structured values or unexpected fields mark the
// whole state invalid-filters. Sub targets are valid only for frontier
// models present in the dataset. Duplicated parameters resolve to their
// first value, mirroring URLSearchParams.get in the old codec.
func DecodeState(query url.Values, dataset *Dataset) (UrlState, Validity) {
	for key := range query {
		if invalidKey(key) {
			return UrlState{}, InvalidFilters
		}
	}
	var state UrlState
	if raw, ok := firstValue(query, ParamHarness); ok && dataset.IsKnownHarness(raw) {
		state.Harness = raw
	}
	if raw, ok := firstValue(query, ParamTier); ok && dataset.IsKnownTier(raw) {
		state.Tier = raw
	}
	if raw, ok := firstValue(query, ParamSub); ok && knownSub(dataset, raw) {
		state.Sub = raw
	}
	if raw, ok := firstValue(query, ParamSubHarness); ok && dataset.IsSubstituteHarness(raw) {
		state.SubHarness = raw
	}
	return state, Valid
}

// EncodeState serializes filter state into shareable query state with
// defaults omitted and keys in codec order.
func EncodeState(state UrlState, defaultSubHarness string) string {
	var parts []string
	if state.Harness != "" {
		parts = encodePair(parts, ParamHarness, state.Harness)
	}
	if state.Tier != "" {
		parts = encodePair(parts, ParamTier, state.Tier)
	}
	if state.Sub != "" {
		parts = encodePair(parts, ParamSub, state.Sub)
	}
	if state.SubHarness != "" && state.SubHarness != defaultSubHarness {
		parts = encodePair(parts, ParamSubHarness, state.SubHarness)
	}
	return strings.Join(parts, "&")
}

// invalidKey reports whether a query key is outside the scalar codec.
func invalidKey(key string) bool {
	switch key {
	case ParamHarness, ParamTier, ParamSub, ParamSubHarness:
		return false
	default:
		return true
	}
}

// encodePair appends one escaped query pair.
func encodePair(parts []string, key, value string) []string {
	return append(parts, key+"="+url.QueryEscape(value))
}

// knownSub reports whether a substitute target is a frontier roster model.
func knownSub(dataset *Dataset, id string) bool {
	model, ok := dataset.byID[id]
	if !ok {
		return false
	}
	return dataset.IsFrontier(model)
}
