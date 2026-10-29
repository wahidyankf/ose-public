// P1D characterization: the ai-benchmark evaluated exports must be reproducible
// byte-for-byte from the neutral JSON in libs/ayokoding-data, and the representative
// results/codecs below must keep matching the checked-in shared test vectors.
// At RED these fail on the missing shared-data artifacts; at GREEN they prove
// old/new data equality and unchanged behavior.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  ANCHORED_TIERS,
  BENCHMARK_SPECS,
  BLEND_INPUT_SHARE,
  BLEND_OUTPUT_SHARE,
  DEFAULT_SUBSTITUTE_HARNESS,
  FRONTIER_VENDORS,
  HARNESS_DISPLAY_NAMES,
  HARNESS_IN_HOUSE_LINES,
  METHOD_EXAMPLE,
  MIN_SCORED_BENCHMARKS,
  NEAREST_OPTION_COUNT,
  ROSTER_CATALOG_HARNESSES,
  SUBSTITUTE_HARNESSES,
  TIER_ANCHORS,
  TIERS,
  COMPOSITE_INDEX_MAX,
} from "@/features/ai-benchmark/core/data/benchmarks";
import { dataset } from "@/features/ai-benchmark/core/data/models";
import { OPERATORS, PRICE_SOURCES } from "@/features/ai-benchmark/core/data/operators";
import type { Model } from "@/features/ai-benchmark/core/data/types";
import { compositeIndex, scoredBenchmarks } from "@/features/ai-benchmark/core/score";
import { blendedPrice, priceRatio } from "@/features/ai-benchmark/core/price";
import { assignTier } from "@/features/ai-benchmark/core/tiers";
import { filterModels, type FilterState } from "@/features/ai-benchmark/core/filter";
import { substitutesFor } from "@/features/ai-benchmark/core/substitute";
import type { HarnessId } from "@/features/ai-benchmark/core/data/types";
import { encodeState, decodeState } from "@/features/ai-benchmark/core/url-state";
import { rosterScopeParams } from "@/features/ai-benchmark/core/data/benchmarks";

const LIB = path.resolve(import.meta.dirname, "../../../../../../../../libs/ayokoding-data");
const dataPath = path.join(LIB, "data", "ai-benchmark.json");
const benchmarkVectorsPath = path.join(LIB, "test-vectors", "benchmark.json");
const urlVectorsPath = path.join(LIB, "test-vectors", "url-state.json");
const provenancePath = path.join(LIB, "provenance.md");

function mustReadJson(file: string): unknown {
  expect(existsSync(file), `shared artifact missing: ${file}`).toBe(true);
  return JSON.parse(readFileSync(file, "utf8"));
}

const byId = (id: string): Model => dataset.models.find((m) => m.id === id) as Model;

describe("shared ai-benchmark artifact presence", () => {
  it("publishes the neutral dataset JSON", () => {
    expect(existsSync(dataPath), `missing ${dataPath}`).toBe(true);
  });

  it("publishes the shared benchmark and url-state vectors", () => {
    expect(existsSync(benchmarkVectorsPath), `missing ${benchmarkVectorsPath}`).toBe(true);
    expect(existsSync(urlVectorsPath), `missing ${urlVectorsPath}`).toBe(true);
  });

  it("records the dataset date and sourcing provenance", () => {
    expect(existsSync(provenancePath), `missing ${provenancePath}`).toBe(true);
    const provenance = readFileSync(provenancePath, "utf8");
    expect(provenance).toContain(dataset.lastUpdated);
    expect(provenance).toContain("data/ai-benchmark.json");
  });
});

describe("evaluated exports equal the shared JSON", () => {
  it("carries the same models in the same order", () => {
    const json = mustReadJson(dataPath) as { dataset: typeof dataset };
    expect(json.dataset.models.map((m) => m.id)).toEqual(dataset.models.map((m) => m.id));
    expect(json.dataset).toEqual(dataset);
  });

  it("carries the same scoring configuration", () => {
    const json = mustReadJson(dataPath) as Record<string, Record<string, unknown>>;
    expect(json["benchmarks"]).toEqual({
      specs: BENCHMARK_SPECS,
      minScoredBenchmarks: MIN_SCORED_BENCHMARKS,
      compositeIndexMax: COMPOSITE_INDEX_MAX,
      tierAnchors: TIER_ANCHORS,
      anchoredTiers: ANCHORED_TIERS,
      tiers: TIERS,
      frontierVendors: FRONTIER_VENDORS,
      harnessInHouseLines: HARNESS_IN_HOUSE_LINES,
      substituteHarnesses: SUBSTITUTE_HARNESSES,
      defaultSubstituteHarness: DEFAULT_SUBSTITUTE_HARNESS,
      rosterCatalogHarnesses: ROSTER_CATALOG_HARNESSES,
      nearestOptionCount: NEAREST_OPTION_COUNT,
      methodExample: METHOD_EXAMPLE,
      harnessDisplayNames: HARNESS_DISPLAY_NAMES,
      blendInputShare: BLEND_INPUT_SHARE,
      blendOutputShare: BLEND_OUTPUT_SHARE,
    });
  });

  it("carries the same operators and price sources", () => {
    const json = mustReadJson(dataPath) as { operators: unknown; priceSources: unknown };
    expect(json.operators).toEqual(OPERATORS);
    expect(json.priceSources).toEqual(PRICE_SOURCES);
  });

  it("keeps absent optional fields absent in the JSON", () => {
    const json = mustReadJson(dataPath) as { dataset: typeof dataset };
    for (const [index, model] of dataset.models.entries()) {
      const jsonModel = json.dataset.models[index] as unknown as Record<string, unknown>;
      for (const key of ["price", "costPerTask", "note", "releaseDate"] as const) {
        if ((model as unknown as Record<string, unknown>)[key] === undefined) {
          expect(jsonModel, `${model.id} must not gain ${key}`).not.toHaveProperty(key);
        }
      }
    }
  });
});

describe("representative scoring results match the shared vectors", () => {
  it("reproduces every shared vector case", () => {
    const vectors = mustReadJson(benchmarkVectorsPath) as {
      compositeIndex: Record<string, number | null>;
      scoredBenchmarks: Record<string, string[]>;
      tiers: Record<string, string>;
      blendedPrice: Record<string, number | null>;
      priceRatio: { candidate: string; reference: string; value: number | null }[];
      filterCounts: { state: FilterState; count: number }[];
      substitutes: {
        target: string;
        harness: HarnessId;
        kind: string;
        options: { id: string; tier: string; index: number | null }[];
      };
    };
    for (const [id, expected] of Object.entries(vectors.compositeIndex)) {
      expect(compositeIndex(byId(id)) ?? null, `compositeIndex ${id}`).toBe(expected);
    }
    for (const [id, expected] of Object.entries(vectors.scoredBenchmarks)) {
      expect(scoredBenchmarks(byId(id)), `scoredBenchmarks ${id}`).toEqual(expected);
    }
    for (const [id, expected] of Object.entries(vectors.tiers)) {
      expect(assignTier(byId(id), dataset), `tier ${id}`).toBe(expected);
    }
    for (const [id, expected] of Object.entries(vectors.blendedPrice)) {
      expect(blendedPrice(byId(id).price) ?? null, `blendedPrice ${id}`).toBe(expected);
    }
    for (const { candidate, reference, value } of vectors.priceRatio) {
      expect(priceRatio(byId(candidate), byId(reference)) ?? null, `priceRatio ${candidate}/${reference}`).toBe(value);
    }
    for (const { state, count } of vectors.filterCounts) {
      expect(filterModels(dataset, state), `filterModels ${JSON.stringify(state)}`).toHaveLength(count);
    }
    const { target, harness, kind, options } = vectors.substitutes;
    expect(target).toBe(METHOD_EXAMPLE.indexModel);
    const result = substitutesFor(byId(target), dataset, harness);
    expect(result.kind).toBe(kind);
    expect(
      result.models.map((s) => ({ id: s.model.id, tier: s.tier, index: s.index ?? null })),
      `substitutesFor ${target} in ${harness}`,
    ).toEqual(options);
  });

  it("keeps the roster scope wording from the defining constants", () => {
    const vectors = mustReadJson(urlVectorsPath) as {
      benchmarkRosterScope: { en: Record<string, string>; id: Record<string, string> };
    };
    expect(rosterScopeParams("en")).toEqual(vectors.benchmarkRosterScope.en);
    expect(rosterScopeParams("id")).toEqual(vectors.benchmarkRosterScope.id);
  });
});

describe("codec duplicates and defaults match the shared vectors", () => {
  it("resolves a duplicated filter parameter to its first value", () => {
    expect(decodeState(new URLSearchParams("harness=cursor&harness=codex-cli")).harness).toBe("cursor");
  });

  it("omits the default substitute harness so the common URL stays short", () => {
    expect(encodeState({ subHarness: DEFAULT_SUBSTITUTE_HARNESS }).toString()).toBe("");
  });

  it("round-trips every shared benchmark url-state vector", () => {
    const vectors = mustReadJson(urlVectorsPath) as {
      benchmark: { query: string; state: Record<string, string | undefined> }[];
    };
    const knownSub = (id: string) => dataset.models.some((m) => m.id === id);
    for (const { query, state } of vectors.benchmark) {
      expect(decodeState(new URLSearchParams(query), knownSub)).toEqual(state);
      expect(encodeState(state as never).toString()).toBe(query);
    }
  });
});
