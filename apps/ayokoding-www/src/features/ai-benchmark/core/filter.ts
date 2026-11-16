// AI BENCHMARK — roster filtering by harness and tier (intersection). Unknown values never reach
// here: `url-state.ts` drops them first.

import { BENCHMARK_SPECS, TIERS } from "./data/benchmarks";
import type { BenchmarkId, Dataset, HarnessId, Model, Tier } from "./data/types";
import { assignBenchmarkTier, assignConsensusTier } from "./tiers";

export const HARNESS_IDS: readonly HarnessId[] = [
  "claude-code",
  "codex-cli",
  "command-code",
  "command-code-pro",
  "cursor",
  "muse-code",
  "opencode-go",
  "opencode-zen",
];

export function isKnownHarness(v: string): v is HarnessId {
  return (HARNESS_IDS as readonly string[]).includes(v);
}

export function isKnownTier(v: string): v is Tier {
  return (TIERS as readonly string[]).includes(v);
}

/** The benchmarks the score-basis control offers, in column order. */
export const BENCHMARK_IDS: readonly BenchmarkId[] = BENCHMARK_SPECS.map((s) => s.id);

export function isKnownBenchmark(v: string): v is BenchmarkId {
  return (BENCHMARK_IDS as readonly string[]).includes(v);
}

/** Either axis may be unset (= unfiltered). `benchmark` is the score basis: unset means the consensus tiers. */
export type FilterState = {
  harness?: HarnessId;
  tier?: Tier;
  benchmark?: BenchmarkId;
};

/**
 * Models satisfying both filters. Tiers are judged against `full`'s anchors so that narrowing
 * `shown` never changes a model's tier. When a score basis (`benchmark`) is set, the tier filter
 * means the per-benchmark tier; otherwise it means the consensus tier. The tier menu's
 * "insufficient" option matches the models outside the current view's tiers: consensus
 * `insufficient` models in the Consensus tiers view, `unranked` models in a per-benchmark view.
 */
export function filterModels(shown: Dataset, state: FilterState, full: Dataset = shown): Model[] {
  return shown.models.filter(
    (m) =>
      (state.harness === undefined || m.harnesses.includes(state.harness)) &&
      (state.tier === undefined || tierForFilter(m, state, full) === state.tier),
  );
}

function tierForFilter(m: Model, state: FilterState, full: Dataset): Tier {
  if (state.benchmark === undefined) return assignConsensusTier(m, full).tier;
  const tier = assignBenchmarkTier(m, state.benchmark, full);
  // "unranked" is outside the tier menu; the menu's "insufficient" option selects those models.
  return tier === "unranked" ? "insufficient" : tier;
}
