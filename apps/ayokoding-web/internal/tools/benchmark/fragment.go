package benchmark

// Benchmark fragment model for the htmx filter endpoint and its full-page
// fallback. The handler decodes the query, builds this fragment, and
// renders the coordinated "benchmark-fragment" template: a public rendered
// fragment plus the canonical encoded URL. Unknown scalars recover to
// defaults; nested or unexpected fields mark invalid-filters; an empty
// filter match is the intentional empty state, never a crash.

import "net/url"

// FragmentRow is one rendered comparison row with display strings.
type FragmentRow struct {
	ID        string
	Name      string
	Vendor    string
	Tier      string
	IndexText string
	PriceText string
}

// Fragment is the rendered comparison for one filter state.
type Fragment struct {
	Locale  string
	State   UrlState
	Encoded string
	Invalid bool
	Empty   bool
	Count   int
	Rows    []FragmentRow
	// HarnessOptions, TierOptions, SubOptions, and SubHarnessOptions list
	// the closed filter vocabularies so the form renders visible options
	// instead of free-text boxes.
	HarnessOptions    []Option
	TierOptions       []Option
	SubOptions        []Option
	SubHarnessOptions []Option
}

// Option is one closed-vocabulary select choice: the codec value and its
// visible label.
type Option struct {
	Value string
	Label string
}

// BuildFragment scores the filtered roster in tier order and formats every
// row for the fragment template. The locale selects display formatting.
func BuildFragment(dataset *Dataset, state UrlState, locale string) Fragment {
	encoded := EncodeState(state, dataset.Config.DefaultSubstituteHarness)
	groups := ComputeTierGroups(FilterModels(dataset.Models, state, dataset), dataset)
	fragment := Fragment{
		Locale:            locale,
		State:             state,
		Encoded:           encoded,
		HarnessOptions:    dataset.HarnessOptions(),
		TierOptions:       dataset.TierOptions(),
		SubOptions:        dataset.SubstituteTargetOptions(),
		SubHarnessOptions: dataset.SubstituteHarnessOptions(),
	}
	for _, tier := range dataset.Config.Tiers {
		for _, scored := range groups[tier] {
			fragment.Rows = append(fragment.Rows, FragmentRow{
				ID:        scored.Model.ID,
				Name:      scored.Model.Name,
				Vendor:    scored.Model.Vendor,
				Tier:      scored.Tier,
				IndexText: formatFragmentIndex(scored.Index, locale),
				PriceText: formatFragmentPrice(&scored.Model, dataset, locale),
			})
		}
	}
	fragment.Count = len(fragment.Rows)
	fragment.Empty = len(fragment.Rows) == 0
	return fragment
}

// formatFragmentIndex renders a composite index or the unrated placeholder.
func formatFragmentIndex(index *float64, locale string) string {
	if index == nil {
		return NoRating
	}
	return FormatIndex(*index, locale)
}

// formatFragmentPrice renders the blended API price or the unrated
// placeholder when the model publishes no price.
func formatFragmentPrice(model *Model, dataset *Dataset, locale string) string {
	blended, ok := BlendedPrice(model.Price, dataset.Config.BlendInputShare, dataset.Config.BlendOutputShare)
	if !ok {
		return NoRating
	}
	return FormatUSD(blended, locale)
}

// DecodeFragment decodes one fragment query into its rendered fragment:
// invalid nested or unexpected fields yield the invalid-filters fragment,
// never a crash.
func DecodeFragment(query url.Values, dataset *Dataset, locale string) Fragment {
	state, validity := DecodeState(query, dataset)
	if validity != Valid {
		return Fragment{Locale: locale, Invalid: true}
	}
	return BuildFragment(dataset, state, locale)
}
