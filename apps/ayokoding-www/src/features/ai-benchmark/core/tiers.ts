// AI BENCHMARK — tier assignment.
//
// Each anchored tier is defined by one previous-generation model (TIER_ANCHORS). A model is placed
// in the highest tier whose anchor's composite index it matches or beats, so a model's tier always
// agrees with its index (and its bar). Anchors are not pinned: an anchor reaches its own tier by
// equality. A rated model below every anchor is `fast`; a model with too few scored benchmarks is
// `insufficient`.

import { ANCHORED_TIERS, MIN_SCORED_BENCHMARKS, TIERS, TIER_ANCHORS } from "./data/benchmarks";
import type { AnchoredTier, Dataset, Model, Tier } from "./data/types";
import { compositeIndex, scoredBenchmarks } from "./score";

/** A model with its composite index and tier — the unit every page section renders. */
export type ScoredModel = {
  model: Model;
  index: number | undefined;
  tier: Tier;
};

export type TierGroups = Record<Tier, ScoredModel[]>;

/** Does `model`'s composite index match or beat `anchor`'s? False when either has no index. */
export function meetsAnchor(model: Model, anchor: Model | undefined): boolean {
  if (anchor === undefined) return false;
  const mine = compositeIndex(model);
  const theirs = compositeIndex(anchor);
  return mine !== undefined && theirs !== undefined && mine >= theirs;
}

function findAnchor(full: Dataset, tier: AnchoredTier): Model | undefined {
  return full.models.find((m) => m.id === TIER_ANCHORS[tier]);
}

/** The tier `model` belongs to, judged against the anchors in `full`. */
export function assignTier(model: Model, full: Dataset): Tier {
  if (scoredBenchmarks(model).length < MIN_SCORED_BENCHMARKS) return "insufficient";
  for (const tier of ANCHORED_TIERS) {
    if (meetsAnchor(model, findAnchor(full, tier))) return tier;
  }
  return "fast";
}

/**
 * Score and tier every model in `shown`. Anchors always come from `full`, so filtering the shown
 * roster never moves a model between tiers.
 */
export function scoreModels(shown: Dataset, full: Dataset = shown): ScoredModel[] {
  return shown.models.map((model) => ({ model, index: compositeIndex(model), tier: assignTier(model, full) }));
}

/** Descending index (unrated last), then ascending id. */
export function byIndexDesc(a: ScoredModel, b: ScoredModel): number {
  const diff = compareDesc(a.index, b.index);
  if (diff !== 0) return diff;
  return a.model.id < b.model.id ? -1 : a.model.id > b.model.id ? 1 : 0;
}

/** Descending numeric order with undefined last. Never NaN, even when both are undefined. */
export function compareDesc(a: number | undefined, b: number | undefined): number {
  if (a === b) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return b - a;
}

/** Group the shown models by tier; each group is ordered by {@link byIndexDesc}. */
export function computeTierGroups(shown: Dataset, full: Dataset = shown): TierGroups {
  const groups = Object.fromEntries(TIERS.map((t) => [t, [] as ScoredModel[]])) as TierGroups;
  for (const s of scoreModels(shown, full)) groups[s.tier].push(s);
  for (const t of TIERS) groups[t].sort(byIndexDesc);
  return groups;
}

/** Each anchored tier's anchor, scored; undefined when the anchor is missing from `full`. */
export function tierAnchors(full: Dataset): Record<AnchoredTier, ScoredModel | undefined> {
  const out = {} as Record<AnchoredTier, ScoredModel | undefined>;
  for (const tier of ANCHORED_TIERS) {
    const anchor = findAnchor(full, tier);
    out[tier] = anchor === undefined ? undefined : { model: anchor, index: compositeIndex(anchor), tier };
  }
  return out;
}

/** Higher is more capable: ultra 4 … insufficient 0. */
export function tierRank(tier: Tier): number {
  return TIERS.length - 1 - TIERS.indexOf(tier);
}
