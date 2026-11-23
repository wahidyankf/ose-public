import { describe, expect, it } from "vitest";
import {
  ANCHORED_TIERS,
  BENCHMARK_SPECS,
  BENCHMARK_TIER_ANCHORS,
  HARNESS_IN_HOUSE_LINES,
  MIN_SCORED_BENCHMARKS,
  TIER_ANCHORS,
  benchmarkSpec,
} from "@/features/ai-benchmark/core/data/benchmarks";
import { dataset } from "@/features/ai-benchmark/core/data/models";
import { OPERATORS, PRICE_SOURCES } from "@/features/ai-benchmark/core/data/operators";
import { HARNESS_IDS } from "@/features/ai-benchmark/core/filter";
import { benchmarkScore, isScoredFigure, scoredBenchmarks } from "@/features/ai-benchmark/core/score";
import { assignBenchmarkTier, assignConsensusTier } from "@/features/ai-benchmark/core/tiers";

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

  it("includes every OpenCode Go model with an identified vendor (33 as of 2026-11-14)", () => {
    expect(models.filter((m) => m.harnesses.includes("opencode-go"))).toHaveLength(33);
  });

  it("includes every Command Code model with an identified vendor inside the generation window (95 as of 2026-11-14)", () => {
    expect(models.filter((m) => m.harnesses.includes("command-code"))).toHaveLength(95);
  });

  it("includes every model on Command Code's Pro plan list (86 as of 2026-11-14)", () => {
    expect(models.filter((m) => m.harnesses.includes("command-code-pro"))).toHaveLength(86);
  });

  it("offers every Command Code Pro model in the Command Code catalog", () => {
    for (const m of models.filter((x) => x.harnesses.includes("command-code-pro"))) {
      expect(m.harnesses).toContain("command-code");
    }
  });

  it("drops models older than two years at lastUpdated (anchors exempt)", () => {
    const twoYearsAgo = `${Number(dataset.lastUpdated.slice(0, 4)) - 2}${dataset.lastUpdated.slice(4)}`;
    const exempt = new Set([
      ...Object.values(TIER_ANCHORS),
      ...Object.values(BENCHMARK_TIER_ANCHORS).flatMap(Object.values),
    ]);
    for (const m of models) {
      if (m.releaseDate === undefined) continue;
      if (exempt.has(m.id)) continue;
      expect(m.releaseDate >= twoYearsAgo, `${m.id} older than two years`).toBe(true);
    }
  });

  it("keeps Claude Opus, Claude Fable, GPT-6 Astra, GPT-6.1 Sol, and Fugu Ultra off the Pro plan (as of 2026-11-14)", () => {
    const maxOnly = models.filter(
      (m) => m.harnesses.includes("command-code") && !m.harnesses.includes("command-code-pro"),
    );
    expect(maxOnly.map((m) => m.id).sort()).toEqual(
      [
        "claude-fable-5",
        "claude-fable-5-1",
        "claude-fable-5-2",
        "claude-opus-4-8",
        "claude-opus-5",
        "claude-opus-5-5",
        "fugu-ultra",
        "gpt-6-astra",
        "gpt-6.1-sol",
      ].sort(),
    );
  });

  it("prices a model at the Command Code-listed rate only when it has no vendor price", () => {
    for (const m of models.filter((x) => x.price?.listedBy === "commandcode")) {
      expect(m.harnesses).toContain("command-code");
      expect(m.price?.source).toBe("https://commandcode.ai/models");
    }
  });

  it("includes Cursor Composer 2.5 as a Cursor-only model with Cursor's API price (as of 2026-10-01)", () => {
    const composer = models.find((m) => m.id === "composer-2.5");
    expect(composer).toMatchObject({ vendor: "Cursor", line: "Composer", access: "general", harnesses: ["cursor"] });
    expect(composer?.price).toMatchObject({ input: 0.5, output: 2.5, listedBy: "vendor" });
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

describe("retired composite anchor invariants", () => {
  for (const tier of ANCHORED_TIERS) {
    const anchor = models.find((m) => m.id === TIER_ANCHORS[tier]);

    it(`${tier} composite anchor is a rated, general-access, previous-generation model`, () => {
      expect(anchor).toBeDefined();
      if (anchor === undefined) return;
      expect(anchor.access).toBe("general");
      expect(scoredBenchmarks(anchor).length).toBeGreaterThanOrEqual(MIN_SCORED_BENCHMARKS);
      const newer = models.filter(
        (m) => m.vendor === anchor.vendor && (m.releaseDate ?? "") > (anchor.releaseDate ?? "9999"),
      );
      expect(newer.length).toBeGreaterThan(0);
      // The page no longer tiers by the composite index; the anchor keeps whatever consensus tier
      // its per-benchmark tiers produce, and it must be rated, never insufficient.
      expect(assignConsensusTier(anchor, dataset).tier).not.toBe("insufficient");
    });
  }
});

describe("per-benchmark tier anchor invariants", () => {
  for (const spec of BENCHMARK_SPECS) {
    const tiers = BENCHMARK_TIER_ANCHORS[spec.id];

    it(`${spec.id}: every anchor is a scored, general-access, previous-generation model in its own benchmark tier`, () => {
      for (const tier of ANCHORED_TIERS) {
        const anchor = models.find((m) => m.id === tiers[tier]);
        expect(anchor, `${spec.id}/${tier} anchor`).toBeDefined();
        if (anchor === undefined) continue;
        expect(anchor.access).toBe("general");
        expect(benchmarkScore(anchor, spec.id), `${spec.id}/${tier} scored figure`).toBeDefined();
        const newer = models.filter(
          (m) => m.vendor === anchor.vendor && (m.releaseDate ?? "") > (anchor.releaseDate ?? "9999"),
        );
        expect(newer.length, `${spec.id}/${tier} newer same-vendor model`).toBeGreaterThan(0);
        expect(assignBenchmarkTier(anchor, spec.id, dataset), `${spec.id}/${tier} own tier`).toBe(tier);
      }
    });

    it(`${spec.id}: the ultra floor is above the planning floor, which is above the execution floor`, () => {
      const floors = ANCHORED_TIERS.map((tier) => benchmarkScore(models.find((m) => m.id === tiers[tier])!, spec.id)!);
      expect(floors[0]).toBeGreaterThan(floors[1]!);
      expect(floors[1]).toBeGreaterThan(floors[2]!);
    });
  }
});

describe("in-house model lines of the listed harnesses", () => {
  for (const { harness, vendor, line } of HARNESS_IN_HOUSE_LINES) {
    it(`${harness}: the ${vendor} ${line} line has roster models, each offered in ${harness}`, () => {
      const lineModels = models.filter((m) => m.vendor === vendor && m.line === line);
      expect(lineModels.length, `${vendor} ${line} roster models`).toBeGreaterThan(0);
      for (const m of lineModels) {
        expect(m.harnesses, `${m.id} offered in ${harness}`).toContain(harness);
      }
    });
  }
});
