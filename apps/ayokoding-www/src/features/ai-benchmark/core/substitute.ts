// AI BENCHMARK — substitute finder: which models of a chosen harness (Command Code Pro, Command
// Code, or OpenCode Go) can stand in for a frontier model. Substitutes are judged on consensus
// tiers: same tier or higher, ordered by consensus tier rank, then consensus strength.

import { FRONTIER_VENDORS, NEAREST_OPTION_COUNT, SUBSTITUTE_HARNESSES } from "./data/benchmarks";
import type { Dataset, HarnessId, Model } from "./data/types";
import { byConsensusDesc, scoreModels, tierRank, type ConsensusModel } from "./tiers";

/**
 * `matches` — models of the chosen harness in the target's tier or higher;
 * `nearest` — none reaches the tier, so the best consensus-rated models of that harness are offered;
 * `insufficient` — the target itself has too little data to compare, or its benchmarks agree on
 * no tier.
 */
export type SubstituteResult = {
  kind: "matches" | "nearest" | "insufficient";
  models: ConsensusModel[];
};

/** Is `v` one of the harnesses the finder offers? Narrower than `isKnownHarness`. */
export function isSubstituteHarness(v: string): v is HarnessId {
  return (SUBSTITUTE_HARNESSES as readonly string[]).includes(v);
}

export function isFrontier(model: Model): boolean {
  return FRONTIER_VENDORS.includes(model.vendor);
}

/** Frontier models, sorted by display name — the finder's choices. */
export function frontierModels(dataset: Dataset): Model[] {
  return dataset.models.filter(isFrontier).sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export function substitutesFor(target: Model, full: Dataset, harness: HarnessId): SubstituteResult {
  const scored = scoreModels(full);
  const targetTier = scored.find((s) => s.model.id === target.id)?.tier ?? "insufficient";
  // A target with no consensus tier cannot be compared, like an insufficient-data target.
  if (targetTier === "insufficient" || targetTier === "no-consensus") return { kind: "insufficient", models: [] };

  const rated = scored.filter(
    (s) =>
      s.model.id !== target.id &&
      s.model.harnesses.includes(harness) &&
      s.tier !== "insufficient" &&
      s.tier !== "no-consensus",
  );
  const matches = rated.filter((s) => tierRank(s.tier) >= tierRank(targetTier)).sort(byConsensusDesc);
  if (matches.length > 0) return { kind: "matches", models: matches };
  return { kind: "nearest", models: [...rated].sort(byConsensusDesc).slice(0, NEAREST_OPTION_COUNT) };
}
