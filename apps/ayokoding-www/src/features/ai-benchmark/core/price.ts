// AI BENCHMARK — API price arithmetic. One standard API price per model; no subscriptions.

import { BLEND_INPUT_SHARE, BLEND_OUTPUT_SHARE } from "./data/benchmarks";
import type { ApiPrice, Model } from "./data/types";

/** USD per 1M tokens for a 3:1 input:output mix — the single number used to compare prices. */
export function blendedPrice(price: ApiPrice | undefined): number | undefined {
  if (price === undefined) return undefined;
  return (
    (BLEND_INPUT_SHARE * price.input + BLEND_OUTPUT_SHARE * price.output) / (BLEND_INPUT_SHARE + BLEND_OUTPUT_SHARE)
  );
}

/**
 * The candidate's blended price as a multiple of the reference's (0.25 = a quarter of the price).
 * Undefined when either price is unpublished or the reference is free.
 */
export function priceRatio(candidate: Model, reference: Model): number | undefined {
  const c = blendedPrice(candidate.price);
  const r = blendedPrice(reference.price);
  if (c === undefined || r === undefined || r === 0) return undefined;
  return c / r;
}
