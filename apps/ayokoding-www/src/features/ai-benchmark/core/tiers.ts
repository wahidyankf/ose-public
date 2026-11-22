// AI BENCHMARK — consensus tiers.
//
// Each benchmark's tier is assigned independently (highest per-benchmark tier whose anchor's raw
// score the model matches or beats). A model's consensus tier is the mode of its per-benchmark
// tiers: the tier it holds on the most benchmarks, when at least half of its tiered benchmarks
// agree on it. Ties go to the highest tied tier (ultra > planning > execution > fast). A model
// tiered on fewer than MIN_SCORED_BENCHMARKS benchmarks has insufficient data and no consensus
// count; a model rated on at least that many whose modal tier holds fewer than half of them
// has no consensus tier either. No average or composite score is computed anywhere.

import { ANCHORED_TIERS, BENCHMARK_SPECS, BENCHMARK_TIER_ANCHORS, MIN_SCORED_BENCHMARKS } from "./data/benchmarks";
import type { AnchoredTier, BenchmarkId, BenchmarkTier, Dataset, Model, Tier } from "./data/types";
import { benchmarkScore } from "./score";

/** A model with its consensus tier — the unit every consensus page section renders. */
export type ConsensusModel = {
  model: Model;
  tier: Tier;
  /** Benchmarks holding the modal tier; 0 when the model has insufficient data. */
  agreeing: number;
  /** Benchmarks where the model holds a tier. */
  considered: number;
  /** agreeing / considered; 0 when the model has insufficient data. */
  share: number;
};

export type TierGroups = Record<Tier, ConsensusModel[]>;

/**
 * Every consensus outcome in display order: the rated tiers first, then the models whose
 * benchmarks do not agree on one tier, then the models with too little data to tier.
 */
export const CONSENSUS_ORDER: readonly Tier[] = [
  "ultra",
  "planning",
  "execution",
  "fast",
  "no-consensus",
  "insufficient",
];

const TIER_RANK: Record<Tier, number> = {
  ultra: 5,
  planning: 4,
  execution: 3,
  fast: 2,
  "no-consensus": 1,
  insufficient: 0,
};

/**
 * The consensus tier `model` belongs to: the mode of its per-benchmark tiers, ties going to the
 * highest tied tier, shown only when the modal tier holds at least half of the model's tiered
 * benchmarks. A model below half has no consensus tier; a model tiered on fewer than
 * MIN_SCORED_BENCHMARKS benchmarks has insufficient data. Anchors always come from `full`, so
 * filtering the shown roster never moves a model between tiers.
 */
export function assignConsensusTier(model: Model, full: Dataset): ConsensusModel {
  const held: Exclude<BenchmarkTier, "unranked">[] = [];
  for (const spec of BENCHMARK_SPECS) {
    const tier = assignBenchmarkTier(model, spec.id, full);
    if (tier !== "unranked") held.push(tier);
  }
  const considered = held.length;
  if (considered < MIN_SCORED_BENCHMARKS) return { model, tier: "insufficient", agreeing: 0, considered, share: 0 };
  const counts = new Map<Exclude<BenchmarkTier, "unranked">, number>();
  for (const tier of held) counts.set(tier, (counts.get(tier) ?? 0) + 1);
  let best: Exclude<BenchmarkTier, "unranked"> = "fast";
  let bestCount = -1;
  for (const [tier, count] of counts) {
    if (count > bestCount || (count === bestCount && tierRank(tier) > tierRank(best))) {
      best = tier;
      bestCount = count;
    }
  }
  const share = bestCount / considered;
  if (share < 0.5) return { model, tier: "no-consensus", agreeing: bestCount, considered, share };
  return { model, tier: best, agreeing: bestCount, considered, share };
}

/** Score every model in `shown` with its consensus tier. */
export function scoreModels(shown: Dataset, full: Dataset = shown): ConsensusModel[] {
  return shown.models.map((model) => assignConsensusTier(model, full));
}

/** Consensus tier rank desc, then agreeing desc, then considered desc, then ascending id. */
export function byConsensusDesc(a: ConsensusModel, b: ConsensusModel): number {
  const byTier = tierRank(b.tier) - tierRank(a.tier);
  if (byTier !== 0) return byTier;
  if (a.agreeing !== b.agreeing) return b.agreeing - a.agreeing;
  if (a.considered !== b.considered) return b.considered - a.considered;
  return a.model.id < b.model.id ? -1 : a.model.id > b.model.id ? 1 : 0;
}

/** Group the shown models by consensus tier; each group is ordered by {@link byConsensusDesc}. */
export function computeTierGroups(shown: Dataset, full: Dataset = shown): TierGroups {
  const groups = Object.fromEntries(CONSENSUS_ORDER.map((t) => [t, [] as ConsensusModel[]])) as TierGroups;
  for (const s of scoreModels(shown, full)) groups[s.tier].push(s);
  for (const t of CONSENSUS_ORDER) groups[t].sort(byConsensusDesc);
  return groups;
}

/** Higher is more capable: ultra 5 … no-consensus 1, insufficient 0. */
export function tierRank(tier: Tier): number {
  return TIER_RANK[tier];
}

/** One model with its tier on the active view — the unit the data table renders. */
export type TableRow = {
  model: Model;
  /** The active view's tier: the consensus tier, or the per-benchmark tier (`unranked` included). */
  tier: Tier | "unranked";
  agreeing: number;
  considered: number;
  share: number;
};

function activeRank(tier: TableRow["tier"]): number {
  return tier === "unranked" ? -1 : tierRank(tier);
}

/** Highest active tier first, then agreeing desc, then considered desc, then ascending id. */
export function tableOrder(a: TableRow, b: TableRow): number {
  const byTier = activeRank(b.tier) - activeRank(a.tier);
  if (byTier !== 0) return byTier;
  if (a.agreeing !== b.agreeing) return b.agreeing - a.agreeing;
  if (a.considered !== b.considered) return b.considered - a.considered;
  return a.model.id < b.model.id ? -1 : a.model.id > b.model.id ? 1 : 0;
}

/**
 * Every shown model with the active view's tier, in table order. The tier filter's "insufficient"
 * option matches the models outside the current view's tiers: consensus `insufficient` models in
 * the Consensus tiers view, `unranked` models in a per-benchmark view.
 */
export function tableRows(shown: Dataset, benchmark: BenchmarkId | undefined, full: Dataset = shown): TableRow[] {
  return scoreModels(shown, full)
    .map((s): TableRow => {
      const tier =
        benchmark === undefined ? s.tier : (assignBenchmarkTier(s.model, benchmark, full) as TableRow["tier"]);
      return { model: s.model, tier, agreeing: s.agreeing, considered: s.considered, share: s.share };
    })
    .sort(tableOrder);
}

/** One model with its raw score on the chosen benchmark — the unit the per-benchmark list renders. */
export type BenchmarkRow = {
  model: Model;
  score: number;
};

/** Descending raw score, then ascending id. */
export function byBenchmarkScoreDesc(a: BenchmarkRow, b: BenchmarkRow): number {
  if (a.score !== b.score) return b.score - a.score;
  return a.model.id < b.model.id ? -1 : a.model.id > b.model.id ? 1 : 0;
}

/**
 * Split `models` into the ranked list (those with a scored figure on `benchmark`, highest raw
 * score first) and the unranked rest. Figures on any other version do not count.
 */
export function rankBenchmarkModels(
  models: readonly Model[],
  benchmark: BenchmarkId,
): { ranked: BenchmarkRow[]; unranked: Model[] } {
  const ranked: BenchmarkRow[] = [];
  const unranked: Model[] = [];
  for (const model of models) {
    const score = benchmarkScore(model, benchmark);
    if (score === undefined) unranked.push(model);
    else ranked.push({ model, score });
  }
  ranked.sort(byBenchmarkScoreDesc);
  return { ranked, unranked };
}

/** Does `model`'s raw score on `benchmark` match or beat `anchor`'s? False when either is unscored. */
export function meetsBenchmarkAnchor(model: Model, anchor: Model | undefined, benchmark: BenchmarkId): boolean {
  if (anchor === undefined) return false;
  const mine = benchmarkScore(model, benchmark);
  const theirs = benchmarkScore(anchor, benchmark);
  return mine !== undefined && theirs !== undefined && mine >= theirs;
}

function findBenchmarkAnchor(full: Dataset, benchmark: BenchmarkId, tier: AnchoredTier): Model | undefined {
  return full.models.find((m) => m.id === BENCHMARK_TIER_ANCHORS[benchmark][tier]);
}

/**
 * The tier `model` belongs to on one benchmark: the highest anchored tier whose anchor's raw
 * score on that benchmark it matches or beats. Below every anchor is `fast`; with no scored
 * figure there the model is `unranked`, outside the tiers.
 */
export function assignBenchmarkTier(model: Model, benchmark: BenchmarkId, full: Dataset): BenchmarkTier {
  if (benchmarkScore(model, benchmark) === undefined) return "unranked";
  for (const tier of ANCHORED_TIERS) {
    if (meetsBenchmarkAnchor(model, findBenchmarkAnchor(full, benchmark, tier), benchmark)) return tier;
  }
  return "fast";
}

/** One model with its raw score and per-benchmark tier — the unit the per-benchmark sections render. */
export type BenchmarkTierRow = BenchmarkRow & { tier: Exclude<BenchmarkTier, "unranked"> };

/** The rated per-benchmark tiers in display order: ultra, planning, execution, fast. */
export type BenchmarkTierGroups = Record<Exclude<BenchmarkTier, "unranked">, BenchmarkTierRow[]>;

/**
 * Group the shown models by per-benchmark tier, plus the unranked rest. Anchors always come from
 * `full`, so filtering the shown roster never moves a model between tiers. Each group is ordered
 * by descending raw score (ties by ascending id), so concatenating the groups in display order
 * reproduces the {@link rankBenchmarkModels} order.
 */
export function computeBenchmarkTierGroups(
  shown: Dataset,
  benchmark: BenchmarkId,
  full: Dataset = shown,
): { groups: BenchmarkTierGroups; unranked: Model[] } {
  const groups: BenchmarkTierGroups = { ultra: [], planning: [], execution: [], fast: [] };
  const unranked: Model[] = [];
  for (const model of shown.models) {
    const score = benchmarkScore(model, benchmark);
    if (score === undefined) {
      unranked.push(model);
      continue;
    }
    const tier = assignBenchmarkTier(model, benchmark, full);
    if (tier === "unranked") {
      unranked.push(model);
      continue;
    }
    groups[tier].push({ model, score, tier });
  }
  for (const tier of Object.keys(groups) as (keyof BenchmarkTierGroups)[]) {
    groups[tier].sort(byBenchmarkScoreDesc);
  }
  return { groups, unranked };
}

/** Each anchored tier's per-benchmark anchor, scored; undefined when the anchor is missing or unscored. */
export function benchmarkTierAnchors(
  full: Dataset,
  benchmark: BenchmarkId,
): Record<AnchoredTier, BenchmarkTierRow | undefined> {
  const out = {} as Record<AnchoredTier, BenchmarkTierRow | undefined>;
  for (const tier of ANCHORED_TIERS) {
    const anchor = findBenchmarkAnchor(full, benchmark, tier);
    const score = anchor === undefined ? undefined : benchmarkScore(anchor, benchmark);
    out[tier] = anchor === undefined || score === undefined ? undefined : { model: anchor, score, tier };
  }
  return out;
}
