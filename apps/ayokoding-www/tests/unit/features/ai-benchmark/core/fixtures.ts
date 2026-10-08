// Shared fixture builders for the AI benchmark core tests and the Gherkin unit steps.

import { benchmarkSpec, TIER_ANCHORS } from "@/features/ai-benchmark/core/data/benchmarks";
import type { ApiPrice, BenchmarkId, Dataset, Figure, HarnessId, Model } from "@/features/ai-benchmark/core/data/types";

export const SRC = "https://example.test/source";

/** A figure on the pinned version of `benchmark`, unless `version` overrides it. */
export function fig(benchmark: BenchmarkId, value: number, version?: string): Figure {
  return {
    benchmark,
    value,
    version: version ?? benchmarkSpec(benchmark).version,
    operator: "artificial-analysis",
    config: "fixture",
    source: SRC,
  };
}

export function price(input: number, output: number, listedBy: ApiPrice["listedBy"] = "vendor"): ApiPrice {
  return { input, output, source: SRC, listedBy };
}

type ModelExtras = Partial<Omit<Model, "id" | "figures">>;

export function model(id: string, figures: Figure[] = [], extras: ModelExtras = {}): Model {
  return {
    id,
    name: id,
    vendor: "Test",
    line: id,
    releaseDate: "2026-01-01",
    access: "general",
    harnesses: ["claude-code"],
    figures,
    ...extras,
  };
}

/** A model scoring `score` on every composite benchmark. */
export function flat(id: string, score: number, extras: ModelExtras = {}): Model {
  return model(id, [fig("deep-swe", score), fig("terminal-bench", score), fig("swe-atlas-qna", score)], extras);
}

/**
 * An open-weights model exposed only by `harness`. A `score` of `undefined` leaves it with a single
 * figure — too little data to tier.
 */
export function harnessModel(
  harness: HarnessId,
  id: string,
  score: number | undefined,
  extras: ModelExtras = {},
): Model {
  const harnesses: HarnessId[] = [harness];
  return score === undefined
    ? model(id, [fig("deep-swe", 50)], { vendor: "OpenWeights", harnesses, ...extras })
    : flat(id, score, { vendor: "OpenWeights", harnesses, ...extras });
}

export function goModel(id: string, score: number | undefined, extras: ModelExtras = {}): Model {
  return harnessModel("opencode-go", id, score, extras);
}

export function dataset(models: Model[]): Dataset {
  return { lastUpdated: "2026-10-01", models };
}

/** The three tier anchors at flat scores 60 / 55 / 45, under their real ids. */
export function anchors(ultra = 60, planning = 55, execution = 45): Model[] {
  return [
    flat(TIER_ANCHORS.ultra, ultra, { vendor: "Anthropic" }),
    flat(TIER_ANCHORS.planning, planning, { vendor: "OpenAI" }),
    flat(TIER_ANCHORS.execution, execution, { vendor: "OpenAI" }),
  ];
}
