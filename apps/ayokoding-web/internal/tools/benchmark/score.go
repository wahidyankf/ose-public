package benchmark

// Pure benchmark calculations ported from the current TypeScript core:
// composite scoring over pinned versions, tier assignment against anchors,
// roster filtering, API price arithmetic, the substitute finder, and the
// methodology roster sentence. List order and operator priority are the
// contract: figures stay in extraction order, so the first scored figure
// for a benchmark wins exactly as in the old runtime.

import (
	"sort"
	"strings"
)

// ScoredModel pairs a model with its composite index and tier.
type ScoredModel struct {
	Model Model
	Index *float64
	Tier  string
}

// TierGroups holds the shown models per tier, each ordered by index.
type TierGroups map[string][]ScoredModel

// SubstituteResult is the substitute finder outcome: models of the chosen
// harness in the target's tier or higher (matches), the best-rated models
// when none reaches the tier (nearest), or insufficient when the target
// itself has too little data.
type SubstituteResult struct {
	Kind   string
	Models []ScoredModel
}

// Substitute outcome kinds.
const (
	SubstituteMatches      = "matches"
	SubstituteNearest      = "nearest"
	SubstituteInsufficient = "insufficient"
)

// Spec returns the pinned spec for a benchmark id.
func (d *Dataset) Spec(id string) (BenchSpec, bool) {
	spec, ok := d.specByID[id]
	return spec, ok
}

// IsScoredFigure reports whether a figure runs on the pinned version.
func (d *Dataset) IsScoredFigure(figure Figure) bool {
	spec, ok := d.specByID[figure.Benchmark]
	return ok && figure.Version == spec.Version
}

// ScoredFigure returns the model's scored figure for a benchmark: the
// first figure on the pinned version in extraction order.
func (d *Dataset) ScoredFigure(model *Model, benchmark string) *Figure {
	for index := range model.Figures {
		figure := &model.Figures[index]
		if figure.Benchmark == benchmark && d.IsScoredFigure(*figure) {
			return figure
		}
	}
	return nil
}

// ScoredBenchmarks lists the benchmarks a model has a scored figure for,
// in spec column order.
func (d *Dataset) ScoredBenchmarks(model *Model) []string {
	var out []string
	for _, spec := range d.Config.Specs {
		if d.ScoredFigure(model, spec.ID) != nil {
			out = append(out, spec.ID)
		}
	}
	return out
}

// ScoreOver is the weighted mean of the model's scored figures over
// exactly the given benchmarks, mirroring the old weighted loop order.
func (d *Dataset) ScoreOver(model *Model, benchmarks []string) (float64, bool) {
	if len(benchmarks) == 0 {
		return 0, false
	}
	var weighted, totalWeight float64
	for _, id := range benchmarks {
		figure := d.ScoredFigure(model, id)
		if figure == nil {
			return 0, false
		}
		// A scored figure is always on a pinned spec: IsScoredFigure
		// admits only figures whose benchmark resolves in the spec index.
		spec := d.specByID[id]
		weighted += spec.Weight * figure.Value
		totalWeight += spec.Weight
	}
	return weighted / totalWeight, true
}

// CompositeIndex is the model's composite index over its scored figures,
// defined only with enough scored benchmarks.
func (d *Dataset) CompositeIndex(model *Model) (float64, bool) {
	present := d.ScoredBenchmarks(model)
	if len(present) < d.Config.MinScoredBenchmarks {
		return 0, false
	}
	return d.ScoreOver(model, present)
}

// meetsAnchor reports whether a model's index matches or beats an anchor's.
// False when either side has no index.
func (d *Dataset) meetsAnchor(model, anchor *Model) bool {
	if anchor == nil {
		return false
	}
	mine, okMine := d.CompositeIndex(model)
	theirs, okTheirs := d.CompositeIndex(anchor)
	return okMine && okTheirs && mine >= theirs
}

// anchorOf resolves one anchored tier's model from the full roster.
func (d *Dataset) anchorOf(tier string) *Model {
	id, ok := d.Config.TierAnchors[tier]
	if !ok {
		return nil
	}
	return d.byID[id]
}

// AssignTier places a model in the highest anchored tier whose anchor it
// matches or beats, or fast below every anchor, or insufficient when rated
// on too few benchmarks.
func (d *Dataset) AssignTier(model *Model) string {
	if len(d.ScoredBenchmarks(model)) < d.Config.MinScoredBenchmarks {
		return "insufficient"
	}
	for _, tier := range d.Config.AnchoredTiers {
		if d.meetsAnchor(model, d.anchorOf(tier)) {
			return tier
		}
	}
	return "fast"
}

// ScoreModels scores and tiers every shown model against full's anchors,
// so narrowing the shown roster never moves a model between tiers.
func ScoreModels(shown []Model, full *Dataset) []ScoredModel {
	out := make([]ScoredModel, 0, len(shown))
	for index := range shown {
		model := &shown[index]
		indexValue, ok := full.CompositeIndex(model)
		var indexPtr *float64
		if ok {
			value := indexValue
			indexPtr = &value
		}
		out = append(out, ScoredModel{Model: *model, Index: indexPtr, Tier: full.AssignTier(model)})
	}
	return out
}

// CompareDesc orders indexes descending with undefined last.
func CompareDesc(a, b *float64) int {
	if a == b {
		return 0
	}
	if a == nil {
		return 1
	}
	if b == nil {
		return -1
	}
	switch {
	case *a == *b:
		return 0
	case *b-*a > 0:
		return 1
	default:
		return -1
	}
}

// SortScored orders models by descending index, then ascending id.
func SortScored(models []ScoredModel) {
	sort.SliceStable(models, func(i, j int) bool {
		if diff := CompareDesc(models[i].Index, models[j].Index); diff != 0 {
			return diff < 0
		}
		return models[i].Model.ID < models[j].Model.ID
	})
}

// ComputeTierGroups groups the shown models by tier in tier order with
// each group ordered by descending index.
func ComputeTierGroups(shown []Model, full *Dataset) TierGroups {
	groups := make(TierGroups, len(full.Config.Tiers))
	for _, tier := range full.Config.Tiers {
		groups[tier] = []ScoredModel{}
	}
	for _, scored := range ScoreModels(shown, full) {
		groups[scored.Tier] = append(groups[scored.Tier], scored)
	}
	for _, tier := range full.Config.Tiers {
		SortScored(groups[tier])
	}
	return groups
}

// TierRank ranks tiers from highest to lowest following tier order.
func TierRank(tier string, tiers []string) int {
	for index, name := range tiers {
		if name == tier {
			return len(tiers) - 1 - index
		}
	}
	return -1
}

// BlendedPrice is the USD price per 1M tokens for the configured
// input:output mix.
func BlendedPrice(price *ApiPrice, inputShare, outputShare float64) (float64, bool) {
	if price == nil {
		return 0, false
	}
	return (inputShare*price.Input + outputShare*price.Output) / (inputShare + outputShare), true
}

// PriceRatio expresses the candidate's blended price as a multiple of the
// reference's; undefined when either price is unpublished or free.
func PriceRatio(candidate, reference *Model, inputShare, outputShare float64) (float64, bool) {
	candidatePrice, okCandidate := BlendedPrice(candidate.Price, inputShare, outputShare)
	referencePrice, okReference := BlendedPrice(reference.Price, inputShare, outputShare)
	if !okCandidate || !okReference || referencePrice == 0 {
		return 0, false
	}
	return candidatePrice / referencePrice, true
}

// IsKnownHarness reports whether a harness id is on the roster filters.
func (d *Dataset) IsKnownHarness(value string) bool {
	return d.harnessSet[value]
}

// IsKnownTier reports whether a tier value is a known tier.
func (d *Dataset) IsKnownTier(value string) bool {
	return d.tierSet[value]
}

// Harnesses lists known harness ids in stable order for filter selects.
func (d *Dataset) Harnesses() []string {
	out := make([]string, 0, len(d.harnessSet))
	for id := range d.harnessSet {
		out = append(out, id)
	}
	sort.Strings(out)
	return out
}

// Tiers lists known tiers in config order for filter selects.
func (d *Dataset) Tiers() []string {
	return append([]string(nil), d.Config.Tiers...)
}

// SubstituteHarnesses lists finder harnesses in config order for filter selects.
func (d *Dataset) SubstituteHarnesses() []string {
	return append([]string(nil), d.Config.SubstituteHarnesses...)
}

// FrontierModelsInDisplayOrder lists frontier substitute targets for filter selects.
func (d *Dataset) FrontierModelsInDisplayOrder() []Model {
	return FrontierModels(d.Models, d)
}

// HarnessLabel resolves the proper-noun display name for a harness id,
// falling back to the id itself.
func (d *Dataset) HarnessLabel(id string) string {
	if label, ok := d.DisplayNames[id]; ok && label != "" {
		return label
	}
	return id
}

// HarnessOptions lists known harnesses with display labels for filter selects.
func (d *Dataset) HarnessOptions() []Option {
	harnesses := d.Harnesses()
	options := make([]Option, 0, len(harnesses))
	for _, id := range harnesses {
		options = append(options, Option{Value: id, Label: d.HarnessLabel(id)})
	}
	return options
}

// TierOptions lists known tiers in config order for filter selects.
func (d *Dataset) TierOptions() []Option {
	tiers := d.Tiers()
	options := make([]Option, 0, len(tiers))
	for _, tier := range tiers {
		options = append(options, Option{Value: tier, Label: tier})
	}
	return options
}

// SubstituteTargetOptions lists frontier substitute targets in display order
// for filter selects, labeled by model name.
func (d *Dataset) SubstituteTargetOptions() []Option {
	targets := d.FrontierModelsInDisplayOrder()
	options := make([]Option, 0, len(targets))
	for _, model := range targets {
		options = append(options, Option{Value: model.ID, Label: model.Name})
	}
	return options
}

// SubstituteHarnessOptions lists finder harnesses in config order for filter
// selects, labeled by display name.
func (d *Dataset) SubstituteHarnessOptions() []Option {
	harnesses := d.SubstituteHarnesses()
	options := make([]Option, 0, len(harnesses))
	for _, id := range harnesses {
		options = append(options, Option{Value: id, Label: d.HarnessLabel(id)})
	}
	return options
}

// IsSubstituteHarness reports whether a harness is offered by the finder.
func (d *Dataset) IsSubstituteHarness(value string) bool {
	return d.substituteSet[value]
}

// IsFrontier reports whether a model comes from a frontier vendor.
func (d *Dataset) IsFrontier(model *Model) bool {
	return d.frontierSet[model.Vendor]
}

// FrontierModels lists frontier models sorted by display name. The old
// runtime sorts with an English locale collation; names here are matched
// case-insensitively with a byte-order tiebreak, which orders the current
// ASCII roster identically.
func FrontierModels(models []Model, dataset *Dataset) []Model {
	var frontier []Model
	for _, model := range models {
		if dataset.IsFrontier(&model) {
			frontier = append(frontier, model)
		}
	}
	sort.SliceStable(frontier, func(i, j int) bool {
		lowerI, lowerJ := strings.ToLower(frontier[i].Name), strings.ToLower(frontier[j].Name)
		if lowerI != lowerJ {
			return lowerI < lowerJ
		}
		if frontier[i].Name != frontier[j].Name {
			return frontier[i].Name < frontier[j].Name
		}
		return frontier[i].ID < frontier[j].ID
	})
	return frontier
}

// FilterModels keeps models satisfying both filter axes. Tiers are judged
// against full's anchors so narrowing the shown roster never moves a tier.
func FilterModels(models []Model, state UrlState, full *Dataset) []Model {
	var out []Model
	for index := range models {
		model := &models[index]
		if state.Harness != "" {
			matched := false
			for _, harness := range model.Harnesses {
				if harness == state.Harness {
					matched = true
					break
				}
			}
			if !matched {
				continue
			}
		}
		if state.Tier != "" && full.AssignTier(model) != state.Tier {
			continue
		}
		out = append(out, *model)
	}
	return out
}

// SubstitutesFor finds stand-ins for a frontier target in one harness:
// matches in the target's tier or higher, else the best-rated nearest
// options capped at the configured count.
func SubstitutesFor(target *Model, full *Dataset, harness string) SubstituteResult {
	scored := ScoreModels(full.Models, full)
	var targetTier string
	for _, entry := range scored {
		if entry.Model.ID == target.ID {
			targetTier = entry.Tier
			break
		}
	}
	if targetTier == "" || targetTier == "insufficient" {
		return SubstituteResult{Kind: SubstituteInsufficient}
	}
	var rated []ScoredModel
	for _, entry := range scored {
		if entry.Model.ID == target.ID || entry.Tier == "insufficient" {
			continue
		}
		matched := false
		for _, id := range entry.Model.Harnesses {
			if id == harness {
				matched = true
				break
			}
		}
		if matched {
			rated = append(rated, entry)
		}
	}
	var matches []ScoredModel
	for _, entry := range rated {
		if TierRank(entry.Tier, full.Config.Tiers) >= TierRank(targetTier, full.Config.Tiers) {
			matches = append(matches, entry)
		}
	}
	if len(matches) > 0 {
		sortSubstitute(matches, full)
		return SubstituteResult{Kind: SubstituteMatches, Models: matches}
	}
	sortSubstitute(rated, full)
	if len(rated) > full.Config.NearestOptionCount {
		rated = rated[:full.Config.NearestOptionCount]
	}
	return SubstituteResult{Kind: SubstituteNearest, Models: rated}
}

// sortSubstitute orders by index, then cheaper price, then id.
func sortSubstitute(models []ScoredModel, full *Dataset) {
	inputShare := full.Config.BlendInputShare
	outputShare := full.Config.BlendOutputShare
	sort.SliceStable(models, func(i, j int) bool {
		if diff := CompareDesc(models[i].Index, models[j].Index); diff != 0 {
			return diff < 0
		}
		priceI, _ := BlendedPrice(models[i].Model.Price, inputShare, outputShare)
		priceJ, _ := BlendedPrice(models[j].Model.Price, inputShare, outputShare)
		var negI, negJ *float64
		if models[i].Model.Price != nil {
			value := -priceI
			negI = &value
		}
		if models[j].Model.Price != nil {
			value := -priceJ
			negJ = &value
		}
		// Cheaper first is descending order on the negated price with
		// unpriced models last.
		if diff := CompareDesc(negI, negJ); diff != 0 {
			return diff < 0
		}
		return models[i].Model.ID < models[j].Model.ID
	})
}

// RosterScope renders the methodology roster sentence parameters from the
// shared dataset: the frontier vendors, the catalog harness display names
// joined with the locale's conjunction, and the in-house lines.
func RosterScope(dataset *Dataset, locale string) (frontier, catalogs, inHouse string) {
	frontier = strings.Join(dataset.Config.FrontierVendors, ", ")
	var catalogsList []string
	for _, harness := range dataset.Config.RosterCatalogHarnesses {
		if name, ok := dataset.DisplayNames[harness]; ok {
			catalogsList = append(catalogsList, name)
		}
	}
	conjunction := "and"
	if locale == "id" {
		conjunction = "dan"
	}
	catalogs = strings.Join(catalogsList, " "+conjunction+" ")
	var lines []string
	for _, line := range dataset.Config.HarnessInHouseLines {
		lines = append(lines, line.Vendor+" "+line.Line)
	}
	inHouse = strings.Join(lines, ", ")
	return frontier, catalogs, inHouse
}
