// P1D characterization at the unit level: the ai-benchmark evaluated exports must survive the
// same JSON decode path the library's published file takes, with no file read. The checks against
// the real checked-in files run in tests/integration.
import { describe, expect, it } from "vitest";
import { OPERATORS, PRICE_SOURCES } from "@/features/ai-benchmark/core/data/operators";
import { dataset } from "@/features/ai-benchmark/core/data/models";
import { DEFAULT_SUBSTITUTE_HARNESS } from "@/features/ai-benchmark/core/data/benchmarks";
import { decodeState, encodeState } from "@/features/ai-benchmark/core/url-state";

/**
 * In-memory double of `libs/ayokoding-data/data/ai-benchmark.json`. The site's exports are
 * serialized and parsed back, which is the decode path the published file takes.
 */
const publishedDouble = JSON.parse(JSON.stringify({ dataset, operators: OPERATORS, priceSources: PRICE_SOURCES })) as {
  dataset: typeof dataset;
  operators: unknown;
  priceSources: unknown;
};

// @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: The site decodes the same dataset values the library publishes
describe("evaluated exports equal the shared JSON", () => {
  it("carries the same models in the same order", () => {
    expect(publishedDouble.dataset.models.map((m) => m.id)).toEqual(dataset.models.map((m) => m.id));
    expect(publishedDouble.dataset).toEqual(dataset);
  });

  it("carries the same operators and price sources", () => {
    expect(publishedDouble.operators).toEqual(OPERATORS);
    expect(publishedDouble.priceSources).toEqual(PRICE_SOURCES);
  });
});

describe("codec duplicates and defaults match the shared vectors", () => {
  it("resolves a duplicated filter parameter to its first value", () => {
    expect(decodeState(new URLSearchParams("harness=cursor&harness=codex-cli")).harness).toBe("cursor");
  });

  it("omits the default substitute harness so the common URL stays short", () => {
    expect(encodeState({ subHarness: DEFAULT_SUBSTITUTE_HARNESS }).toString()).toBe("");
  });
});
