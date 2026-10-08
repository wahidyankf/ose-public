// AI BENCHMARK — roster filtering by harness and tier (intersection). Unknown values never reach
// here: `url-state.ts` drops them first.

import { TIERS } from "./data/benchmarks";
import type { Dataset, HarnessId, Model, Tier } from "./data/types";
import { assignTier } from "./tiers";

export const HARNESS_IDS: readonly HarnessId[] = [
  "claude-code",
  "codex-cli",
  "command-code",
  "command-code-pro",
  "cursor",
  "opencode-go",
  "opencode-zen",
];

export function isKnownHarness(v: string): v is HarnessId {
  return (HARNESS_IDS as readonly string[]).includes(v);
}

export function isKnownTier(v: string): v is Tier {
  return (TIERS as readonly string[]).includes(v);
}

/** Either axis may be unset (= unfiltered). */
export type FilterState = {
  harness?: HarnessId;
  tier?: Tier;
};

/**
 * Models satisfying both filters. Tiers are judged against `full`'s anchors so that narrowing
 * `shown` never changes a model's tier.
 */
export function filterModels(shown: Dataset, state: FilterState, full: Dataset = shown): Model[] {
  return shown.models.filter(
    (m) =>
      (state.harness === undefined || m.harnesses.includes(state.harness)) &&
      (state.tier === undefined || assignTier(m, full) === state.tier),
  );
}
