import { describe, expect, it } from "vitest";
import {
  ANCHORED_TIERS,
  BENCHMARK_SPECS,
  MIN_SCORED_BENCHMARKS,
  TIER_ANCHORS,
  benchmarkSpec,
} from "@/features/ai-benchmark/core/data/benchmarks";
import { dataset } from "@/features/ai-benchmark/core/data/models";
import { OPERATORS, PRICE_SOURCES } from "@/features/ai-benchmark/core/data/operators";
import { HARNESS_IDS } from "@/features/ai-benchmark/core/filter";
import { isScoredFigure, scoredBenchmarks } from "@/features/ai-benchmark/core/score";
import { assignTier } from "@/features/ai-benchmark/core/tiers";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const models = dataset.models;

describe("dataset metadata", () => {
  it("carries an ISO last-updated date no earlier than any source check", () => {
    expect(dataset.lastUpdated).toMatch(ISO_DATE);
    for (const s of [...OPERATORS, ...PRICE_SOURCES]) {
      expect(s.checkedOn).toMatch(ISO_DATE);
      expect(s.checkedOn <= dataset.lastUpdated).toBe(true);
    }
  });
});

describe("roster invariants", () => {
  it("has unique model ids", () => {
    expect(new Set(models.map((m) => m.id)).size).toBe(models.length);
  });

  it("uses only known harness ids and well-formed release dates", () => {
    for (const m of models) {
      for (const h of m.harnesses) expect(HARNESS_IDS).toContain(h);
      if (m.releaseDate !== undefined) expect(m.releaseDate).toMatch(ISO_DATE);
    }
  });

  it("includes every OpenCode Go model with an identified vendor (29 as of 2026-10-01)", () => {
    expect(models.filter((m) => m.harnesses.includes("opencode-go"))).toHaveLength(29);
  });

  it("explains every limited-access model in a note", () => {
    for (const m of models.filter((x) => x.access === "limited")) expect(m.note).toBeTruthy();
  });
});

describe("figure invariants", () => {
  for (const m of models) {
    it(`${m.id}: figures are pinned-version, in range, from an allowed operator, one per benchmark`, () => {
      for (const f of m.figures) {
        expect(isScoredFigure(f)).toBe(true);
        expect(f.value).toBeGreaterThanOrEqual(0);
        expect(f.value).toBeLessThanOrEqual(100);
        expect(benchmarkSpec(f.benchmark).operatorOrder).toContain(f.operator);
        expect(f.source).toMatch(/^https:\/\//);
        expect(f.config.length).toBeGreaterThan(0);
      }
      const benchmarks = m.figures.map((f) => f.benchmark);
      expect(new Set(benchmarks).size).toBe(benchmarks.length);
    });
  }

  it("covers every composite benchmark somewhere in the roster", () => {
    for (const spec of BENCHMARK_SPECS) {
      expect(models.some((m) => m.figures.some((f) => f.benchmark === spec.id))).toBe(true);
    }
  });
});

describe("price invariants", () => {
  it("has non-negative prices with an https source", () => {
    for (const m of models) {
      if (m.price === undefined) continue;
      expect(m.price.input).toBeGreaterThanOrEqual(0);
      expect(m.price.output).toBeGreaterThanOrEqual(0);
      expect(m.price.source).toMatch(/^https:\/\//);
    }
  });

  it("explains every missing price in a note", () => {
    for (const m of models.filter((x) => x.price === undefined)) expect(m.note).toBeTruthy();
  });

  it("publishes a cost per task only from an operator that scored the model", () => {
    for (const m of models) {
      if (m.costPerTask === undefined) continue;
      expect(m.costPerTask.usd).toBeGreaterThan(0);
      expect(m.figures.some((f) => f.operator === m.costPerTask?.operator)).toBe(true);
    }
  });
});

describe("tier anchor invariants", () => {
  for (const tier of ANCHORED_TIERS) {
    const anchor = models.find((m) => m.id === TIER_ANCHORS[tier]);

    it(`${tier} anchor is a rated, general-access, previous-generation model in its own tier`, () => {
      expect(anchor).toBeDefined();
      if (anchor === undefined) return;
      expect(anchor.access).toBe("general");
      expect(scoredBenchmarks(anchor).length).toBeGreaterThanOrEqual(MIN_SCORED_BENCHMARKS);
      const newer = models.filter(
        (m) => m.vendor === anchor.vendor && (m.releaseDate ?? "") > (anchor.releaseDate ?? "9999"),
      );
      expect(newer.length).toBeGreaterThan(0);
      expect(assignTier(anchor, dataset)).toBe(tier);
    });
  }
});
