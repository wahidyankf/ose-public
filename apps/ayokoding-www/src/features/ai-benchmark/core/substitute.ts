// AI BENCHMARK — substitute finder: which models of a chosen harness (Command Code Pro, Command
// Code, or OpenCode Go) can stand in for a frontier model.

import { FRONTIER_VENDORS, NEAREST_OPTION_COUNT, SUBSTITUTE_HARNESSES } from "./data/benchmarks";
import type { Dataset, HarnessId, Model } from "./data/types";
import { blendedPrice } from "./price";
import { byIndexDesc, compareDesc, scoreModels, tierRank, type ScoredModel } from "./tiers";

/**
 * `matches` — models of the chosen harness in the target's tier or higher;
 * `nearest` — none reaches the tier, so the best-scoring rated models of that harness are offered;
 * `insufficient` — the target itself has too little data to compare.
 */
export type SubstituteResult = {
  kind: "matches" | "nearest" | "insufficient";
  models: ScoredModel[];
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

/** Higher index first; equal index → cheaper first; then id. */
function bySubstitutePreference(a: ScoredModel, b: ScoredModel): number {
  const byIndex = compareDesc(a.index, b.index);
  if (byIndex !== 0) return byIndex;
  // Cheaper first = descending on the negated price; an unpriced model sorts last.
  const pa = blendedPrice(a.model.price);
  const pb = blendedPrice(b.model.price);
  const byPrice = compareDesc(pa === undefined ? undefined : -pa, pb === undefined ? undefined : -pb);
  return byPrice !== 0 ? byPrice : byIndexDesc(a, b);
}

export function substitutesFor(target: Model, full: Dataset, harness: HarnessId): SubstituteResult {
  const scored = scoreModels(full);
  const targetTier = scored.find((s) => s.model.id === target.id)?.tier ?? "insufficient";
  if (targetTier === "insufficient") return { kind: "insufficient", models: [] };

  const rated = scored.filter(
    (s) => s.model.id !== target.id && s.model.harnesses.includes(harness) && s.tier !== "insufficient",
  );
  const matches = rated.filter((s) => tierRank(s.tier) >= tierRank(targetTier)).sort(bySubstitutePreference);
  if (matches.length > 0) return { kind: "matches", models: matches };
  return { kind: "nearest", models: rated.sort(bySubstitutePreference).slice(0, NEAREST_OPTION_COUNT) };
}
