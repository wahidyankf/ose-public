// Shared fixture builders for the AI benchmark core tests and the Gherkin unit steps.

import { BENCHMARK_TIER_ANCHORS, benchmarkSpec, TIER_ANCHORS } from "@/features/ai-benchmark/core/data/benchmarks";
import type {
  ApiPrice,
  BenchmarkId,
  BenchmarkTier,
  Dataset,
  Figure,
  HarnessId,
  Model,
} from "@/features/ai-benchmark/core/data/types";

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

/** The three per-benchmark tier anchors on `benchmark` at raw scores ultra / planning / execution. */
export function benchmarkAnchors(benchmark: BenchmarkId, ultra = 60, planning = 55, execution = 45): Model[] {
  const ids = BENCHMARK_TIER_ANCHORS[benchmark];
  return [
    model(ids.ultra, [fig(benchmark, ultra)]),
    model(ids.planning, [fig(benchmark, planning)]),
    model(ids.execution, [fig(benchmark, execution)]),
  ];
}

/** Raw score that lands the matching per-benchmark tier against the default 60 / 55 / 45 anchors. */
const TIER_SCORE: Record<Exclude<BenchmarkTier, "unranked">, number> = {
  ultra: 70,
  planning: 57,
  execution: 46,
  fast: 10,
};

/**
 * A model holding the given tier on each benchmark, in BENCHMARK_SPECS order
 * (deep-swe, terminal-bench, swe-atlas-qna, frontiercode-aa); "unranked" leaves that benchmark
 * without a figure. "insufficient" is not a per-benchmark tier and is rejected by the types.
 */
export function tiered(
  id: string,
  deepSwe: Exclude<BenchmarkTier, "unranked"> | "unranked",
  terminalBench: Exclude<BenchmarkTier, "unranked"> | "unranked",
  sweAtlas: Exclude<BenchmarkTier, "unranked"> | "unranked",
  frontierCode: Exclude<BenchmarkTier, "unranked"> | "unranked",
  extras: ModelExtras = {},
): Model {
  const entries: [BenchmarkId, Exclude<BenchmarkTier, "unranked"> | "unranked"][] = [
    ["deep-swe", deepSwe],
    ["terminal-bench", terminalBench],
    ["swe-atlas-qna", sweAtlas],
    ["frontiercode-aa", frontierCode],
  ];
  return model(
    id,
    entries.flatMap(([b, tier]) => (tier === "unranked" ? [] : [fig(b, TIER_SCORE[tier])])),
    extras,
  );
}

/**
 * The per-benchmark tier anchors on all four benchmarks. One model per anchor id — an id that
 * anchors several benchmarks carries a figure on each of them, mirroring the real dataset where
 * anchor models have multiple scored figures.
 */
export function quadAnchors(ultra = 60, planning = 55, execution = 45): Model[] {
  const byId = new Map<string, Figure[]>();
  for (const benchmark of Object.keys(BENCHMARK_TIER_ANCHORS) as BenchmarkId[]) {
    const floors = { ultra, planning, execution } as const;
    for (const tier of Object.keys(floors) as (keyof typeof floors)[]) {
      const id = BENCHMARK_TIER_ANCHORS[benchmark][tier];
      byId.set(id, [...(byId.get(id) ?? []), fig(benchmark, floors[tier])]);
    }
  }
  return [...byId.entries()].map(([id, figures]) => model(id, figures));
}

/** A consensus-planning model (planning on three benchmarks, execution on the fourth). */
export function planningModel(id: string, extras: ModelExtras = {}): Model {
  return tiered(id, "planning", "planning", "planning", "execution", extras);
}
