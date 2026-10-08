// AI BENCHMARK — URL state. The query string is the single source of truth for the filters and
// the substitute finder's target and harness; unset values are omitted and unknown values are
// dropped, never thrown on. A duplicated parameter resolves to its first value
// (`URLSearchParams.get`).

import { DEFAULT_SUBSTITUTE_HARNESS } from "./data/benchmarks";
import type { HarnessId } from "./data/types";
import { isKnownHarness, isKnownTier, type FilterState } from "./filter";
import { isSubstituteHarness } from "./substitute";

export const PARAM_KEYS = {
  harness: "harness",
  tier: "tier",
  sub: "sub",
  subHarness: "sub-harness",
} as const;

export type UrlState = FilterState & {
  /** Model id of the frontier model the substitute finder is showing. */
  sub?: string;
  /**
   * Harness the substitute finder searches. Unset means {@link DEFAULT_SUBSTITUTE_HARNESS}, which
   * the encoded query leaves out.
   */
  subHarness?: HarnessId;
};

/**
 * Parse the query string. `isKnownSub` decides which substitute targets are valid (the page passes
 * a lookup over the frontier roster); by default none is.
 */
export function decodeState(params: URLSearchParams, isKnownSub: (id: string) => boolean = () => false): UrlState {
  const harness = params.get(PARAM_KEYS.harness);
  const tier = params.get(PARAM_KEYS.tier);
  const sub = params.get(PARAM_KEYS.sub);
  const subHarness = params.get(PARAM_KEYS.subHarness);
  return {
    harness: harness !== null && isKnownHarness(harness) ? harness : undefined,
    tier: tier !== null && isKnownTier(tier) ? tier : undefined,
    sub: sub !== null && isKnownSub(sub) ? sub : undefined,
    subHarness: subHarness !== null && isSubstituteHarness(subHarness) ? subHarness : undefined,
  };
}

export function encodeState(state: UrlState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.harness !== undefined) params.set(PARAM_KEYS.harness, state.harness);
  if (state.tier !== undefined) params.set(PARAM_KEYS.tier, state.tier);
  if (state.sub !== undefined) params.set(PARAM_KEYS.sub, state.sub);
  if (state.subHarness !== undefined && state.subHarness !== DEFAULT_SUBSTITUTE_HARNESS) {
    params.set(PARAM_KEYS.subHarness, state.subHarness);
  }
  return params;
}
