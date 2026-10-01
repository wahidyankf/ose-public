// AI BENCHMARK — composite index.
//
//   scoreOver(m, B)   = Σ weight(b) × value(m, b) ÷ Σ weight(b), over b ∈ B — raw percentages, no
//                       roster normalization, so a model's score never moves when others are added
//   compositeIndex(m) = scoreOver(m, every benchmark m has a scored figure for), defined only when
//                       that is at least MIN_SCORED_BENCHMARKS benchmarks
//
// A figure is scored only when it is on the benchmark's pinned version.

import { BENCHMARK_SPECS, MIN_SCORED_BENCHMARKS, benchmarkSpec } from "./data/benchmarks";
import type { BenchmarkId, Figure, Model } from "./data/types";

/** Is this figure on the pinned version of its benchmark? */
export function isScoredFigure(f: Figure): boolean {
  return f.version === benchmarkSpec(f.benchmark).version;
}

/** The model's scored figure for a benchmark, if it has one. */
export function scoredFigure(model: Model, benchmark: BenchmarkId): Figure | undefined {
  return model.figures.find((f) => f.benchmark === benchmark && isScoredFigure(f));
}

/** The benchmarks the model has a scored figure for, in column order. */
export function scoredBenchmarks(model: Model): BenchmarkId[] {
  return BENCHMARK_SPECS.filter((s) => scoredFigure(model, s.id) !== undefined).map((s) => s.id);
}

/**
 * The weighted mean of the model's scored figures over exactly `benchmarks`. Undefined when the
 * list is empty or the model lacks a scored figure for any of them.
 */
export function scoreOver(model: Model, benchmarks: readonly BenchmarkId[]): number | undefined {
  if (benchmarks.length === 0) return undefined;
  let weighted = 0;
  let totalWeight = 0;
  for (const b of benchmarks) {
    const f = scoredFigure(model, b);
    if (f === undefined) return undefined;
    const w = benchmarkSpec(b).weight;
    weighted += w * f.value;
    totalWeight += w;
  }
  return weighted / totalWeight;
}

/** The model's composite index, or undefined when it has too few scored benchmarks. */
export function compositeIndex(model: Model): number | undefined {
  const present = scoredBenchmarks(model);
  return present.length < MIN_SCORED_BENCHMARKS ? undefined : scoreOver(model, present);
}
