// AI BENCHMARK — scored figures.
//
// A figure is scored only when it is on the benchmark's pinned version. Raw percentages only —
// no normalization, no weighting, no averaging. The consensus tier (in `tiers.ts`) is the mode
// of a model's per-benchmark tiers.

import { BENCHMARK_SPECS, benchmarkSpec } from "./data/benchmarks";
import type { BenchmarkId, Figure, Model } from "./data/types";

/** Is this figure on the pinned version of its benchmark? */
export function isScoredFigure(f: Figure): boolean {
  return f.version === benchmarkSpec(f.benchmark).version;
}

/** The model's scored figure for a benchmark, if it has one. */
export function scoredFigure(model: Model, benchmark: BenchmarkId): Figure | undefined {
  return model.figures.find((f) => f.benchmark === benchmark && isScoredFigure(f));
}

/**
 * The model's raw scored figure value for one benchmark — the pinned version's operator figure
 * with no normalization and no weighting. Undefined when the model has no scored figure there.
 */
export function benchmarkScore(model: Model, benchmark: BenchmarkId): number | undefined {
  return scoredFigure(model, benchmark)?.value;
}

/** The benchmarks the model has a scored figure for, in column order. */
export function scoredBenchmarks(model: Model): BenchmarkId[] {
  return BENCHMARK_SPECS.filter((s) => scoredFigure(model, s.id) !== undefined).map((s) => s.id);
}
