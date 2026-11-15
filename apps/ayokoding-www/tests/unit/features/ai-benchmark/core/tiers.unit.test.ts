import { describe, expect, it } from "vitest";
import { BENCHMARK_TIER_ANCHORS, TIER_ANCHORS } from "@/features/ai-benchmark/core/data/benchmarks";
import type { BenchmarkId } from "@/features/ai-benchmark/core/data/types";
import {
  assignBenchmarkTier,
  assignTier,
  benchmarkTierAnchors,
  compareDesc,
  computeBenchmarkTierGroups,
  computeTierGroups,
  meetsAnchor,
  meetsBenchmarkAnchor,
  rankBenchmarkModels,
  scoreModels,
  tierAnchors,
  tierRank,
} from "@/features/ai-benchmark/core/tiers";
import { anchors, benchmarkAnchors, dataset, fig, flat, model } from "./fixtures";

describe("meetsAnchor", () => {
  it("compares composite indices, even when the two cover different benchmarks", () => {
    const anchor = model("a", [fig("deep-swe", 70), fig("terminal-bench", 20)]);
    // Behind the anchor on DeepSWE + Terminal-Bench (44 vs 45), but index 52.67 vs 45 → met.
    const ahead = model("m", [fig("deep-swe", 66), fig("terminal-bench", 22), fig("swe-atlas-qna", 70)]);
    expect(meetsAnchor(ahead, anchor)).toBe(true);
    // Ahead on the shared two (46 vs 45), but index 34 vs 45 → not met.
    const behind = model("m", [fig("deep-swe", 66), fig("terminal-bench", 26), fig("swe-atlas-qna", 10)]);
    expect(meetsAnchor(behind, anchor)).toBe(false);
  });

  it("is met on equality", () => {
    expect(meetsAnchor(flat("m", 50), flat("a", 50))).toBe(true);
  });

  it("is not met when the model's index is lower", () => {
    expect(meetsAnchor(flat("m", 49.99), flat("a", 50))).toBe(false);
  });

  it("is not met when either model has no index", () => {
    expect(meetsAnchor(model("m", [fig("deep-swe", 99)]), flat("a", 1))).toBe(false);
    expect(meetsAnchor(flat("m", 99), model("a", [fig("terminal-bench", 1)]))).toBe(false);
  });

  it("is not met when the anchor is missing from the roster", () => {
    expect(meetsAnchor(flat("m", 99), undefined)).toBe(false);
  });
});

describe("assignTier", () => {
  const roster = dataset(anchors());

  it.each([
    [61, "ultra"],
    [60, "ultra"],
    [57, "planning"],
    [55, "planning"],
    [50, "execution"],
    [45, "execution"],
    [30, "fast"],
  ])("places a model scoring %d everywhere in %s", (score, tier) => {
    expect(assignTier(flat("m", score), roster)).toBe(tier);
  });

  it("marks a model with fewer than two scored benchmarks insufficient", () => {
    expect(assignTier(model("m", [fig("deep-swe", 99)]), roster)).toBe("insufficient");
  });

  it("places every anchor in the tier it defines without pinning", () => {
    expect(assignTier(roster.models[0]!, roster)).toBe("ultra");
    expect(assignTier(roster.models[1]!, roster)).toBe("planning");
    expect(assignTier(roster.models[2]!, roster)).toBe("execution");
  });

  it("falls through to fast when no anchor is in the roster", () => {
    expect(assignTier(flat("m", 99), dataset([]))).toBe("fast");
  });
});

describe("scoreModels", () => {
  it("scores the shown models against the full roster's anchors", () => {
    const full = dataset([...anchors(), flat("m", 57)]);
    const shown = dataset([full.models[3]!]);
    expect(scoreModels(shown, full)).toEqual([{ model: full.models[3], index: 57, tier: "planning" }]);
  });

  it("defaults the full roster to the shown roster", () => {
    expect(scoreModels(dataset(anchors()))[0]?.tier).toBe("ultra");
  });
});

describe("computeTierGroups", () => {
  it("puts every model in exactly one group, ordered by index then id", () => {
    const full = dataset([
      ...anchors(),
      flat("b", 57),
      flat("a", 57),
      flat("z", 20),
      model("thin", [fig("deep-swe", 90)]),
      model("bare"),
    ]);
    const groups = computeTierGroups(full);
    expect(groups.ultra.map((s) => s.model.id)).toEqual([TIER_ANCHORS.ultra]);
    expect(groups.planning.map((s) => s.model.id)).toEqual(["a", "b", TIER_ANCHORS.planning]);
    expect(groups.execution.map((s) => s.model.id)).toEqual([TIER_ANCHORS.execution]);
    expect(groups.fast.map((s) => s.model.id)).toEqual(["z"]);
    expect(groups.insufficient.map((s) => s.model.id)).toEqual(["bare", "thin"]);
    const total = Object.values(groups).reduce((n, g) => n + g.length, 0);
    expect(total).toBe(full.models.length);
  });
});

describe("rankBenchmarkModels", () => {
  it("orders models by raw score from highest to lowest", () => {
    const models = [
      model("low", [fig("deep-swe", 60)]),
      model("high", [fig("deep-swe", 80)]),
      model("mid", [fig("deep-swe", 70)]),
    ];
    const { ranked, unranked } = rankBenchmarkModels(models, "deep-swe");
    expect(ranked.map((r) => r.model.id)).toEqual(["high", "mid", "low"]);
    expect(ranked.map((r) => r.score)).toEqual([80, 70, 60]);
    expect(unranked).toEqual([]);
  });

  it("breaks score ties by ascending model id", () => {
    const models = [model("b", [fig("deep-swe", 70)]), model("a", [fig("deep-swe", 70)])];
    expect(rankBenchmarkModels(models, "deep-swe").ranked.map((r) => r.model.id)).toEqual(["a", "b"]);
  });

  it("leaves models without a scored figure for the benchmark unranked", () => {
    const models = [
      model("scored", [fig("deep-swe", 70)]),
      model("wrong-version", [fig("deep-swe", 90, "0.9")]),
      model("other-benchmark", [fig("terminal-bench", 80)]),
      model("bare"),
    ];
    const { ranked, unranked } = rankBenchmarkModels(models, "deep-swe");
    expect(ranked.map((r) => r.model.id)).toEqual(["scored"]);
    expect(unranked.map((m) => m.id)).toEqual(["wrong-version", "other-benchmark", "bare"]);
  });
});

describe("tierAnchors", () => {
  it("returns each anchor with its own index", () => {
    const a = tierAnchors(dataset(anchors()));
    expect(a.ultra?.model.id).toBe(TIER_ANCHORS.ultra);
    expect(a.ultra?.index).toBe(60);
    expect(a.planning?.index).toBe(55);
    expect(a.execution?.index).toBe(45);
  });

  it("returns undefined for an anchor missing from the roster", () => {
    expect(tierAnchors(dataset([])).ultra).toBeUndefined();
  });
});

describe("meetsBenchmarkAnchor", () => {
  it("compares raw scores on that benchmark only", () => {
    const anchor = model("a", [fig("deep-swe", 55), fig("terminal-bench", 99)]);
    expect(meetsBenchmarkAnchor(model("above", [fig("deep-swe", 60)]), anchor, "deep-swe")).toBe(true);
    // Ahead on Terminal-Bench but behind on DeepSWE: not met.
    expect(
      meetsBenchmarkAnchor(model("below", [fig("deep-swe", 50), fig("terminal-bench", 99)]), anchor, "deep-swe"),
    ).toBe(false);
  });

  it("is met on equality", () => {
    const anchor = model("a", [fig("deep-swe", 55)]);
    expect(meetsBenchmarkAnchor(model("m", [fig("deep-swe", 55)]), anchor, "deep-swe")).toBe(true);
  });

  it("is not met when either model lacks a scored figure on the benchmark", () => {
    expect(meetsBenchmarkAnchor(model("m", []), model("a", [fig("deep-swe", 55)]), "deep-swe")).toBe(false);
    expect(meetsBenchmarkAnchor(model("m", [fig("deep-swe", 99)]), model("a", []), "deep-swe")).toBe(false);
    // A wrongly versioned figure does not count.
    expect(
      meetsBenchmarkAnchor(model("m", [fig("deep-swe", 99, "0.9")]), model("a", [fig("deep-swe", 55)]), "deep-swe"),
    ).toBe(false);
  });

  it("is not met when the anchor is missing from the roster", () => {
    expect(meetsBenchmarkAnchor(model("m", [fig("deep-swe", 99)]), undefined, "deep-swe")).toBe(false);
  });
});

describe("assignBenchmarkTier", () => {
  const roster = dataset(benchmarkAnchors("deep-swe"));

  it.each([
    [61, "ultra"],
    [60, "ultra"],
    [57, "planning"],
    [55, "planning"],
    [50, "execution"],
    [45, "execution"],
    [30, "fast"],
  ])("places a model scoring %d on DeepSWE in %s", (score, tier) => {
    expect(assignBenchmarkTier(model("m", [fig("deep-swe", score as number)]), "deep-swe", roster)).toBe(tier);
  });

  it("marks a model with no scored figure on the benchmark unranked", () => {
    expect(assignBenchmarkTier(model("m", [fig("terminal-bench", 99)]), "deep-swe", roster)).toBe("unranked");
    expect(assignBenchmarkTier(model("m", [fig("deep-swe", 99, "0.9")]), "deep-swe", roster)).toBe("unranked");
    expect(assignBenchmarkTier(model("m", []), "deep-swe", roster)).toBe("unranked");
  });

  it("places every benchmark anchor in the tier it defines without pinning", () => {
    expect(assignBenchmarkTier(roster.models[0]!, "deep-swe", roster)).toBe("ultra");
    expect(assignBenchmarkTier(roster.models[1]!, "deep-swe", roster)).toBe("planning");
    expect(assignBenchmarkTier(roster.models[2]!, "deep-swe", roster)).toBe("execution");
  });

  it("falls through to fast when no anchor is in the roster", () => {
    expect(assignBenchmarkTier(model("m", [fig("deep-swe", 99)]), "deep-swe", dataset([]))).toBe("fast");
  });

  it("judges each benchmark against its own anchors", () => {
    const both = dataset([
      ...benchmarkAnchors("deep-swe", 60, 55, 45),
      ...benchmarkAnchors("frontiercode-aa", 30, 20, 10),
    ]);
    const m = model("m", [fig("deep-swe", 40), fig("frontiercode-aa", 25)]);
    // Below the DeepSWE execution floor but above the FrontierCode-AA planning floor.
    expect(assignBenchmarkTier(m, "deep-swe", both)).toBe("fast");
    expect(assignBenchmarkTier(m, "frontiercode-aa", both)).toBe("planning");
  });
});

describe("computeBenchmarkTierGroups", () => {
  it("groups models by benchmark tier, each ordered by raw score then id, plus the unranked rest", () => {
    const full = dataset([
      ...benchmarkAnchors("deep-swe"),
      model("b", [fig("deep-swe", 57)]),
      model("a", [fig("deep-swe", 57)]),
      model("z", [fig("deep-swe", 20)]),
      model("wrong-version", [fig("deep-swe", 90, "0.9")]),
      model("bare"),
    ]);
    const { groups, unranked } = computeBenchmarkTierGroups(full, "deep-swe");
    expect(groups.ultra.map((r) => r.model.id)).toEqual([BENCHMARK_TIER_ANCHORS["deep-swe"].ultra]);
    expect(groups.planning.map((r) => r.model.id)).toEqual(["a", "b", BENCHMARK_TIER_ANCHORS["deep-swe"].planning]);
    expect(groups.execution.map((r) => r.model.id)).toEqual([BENCHMARK_TIER_ANCHORS["deep-swe"].execution]);
    expect(groups.fast.map((r) => r.model.id)).toEqual(["z"]);
    expect(unranked.map((m) => m.id)).toEqual(["wrong-version", "bare"]);
    for (const rows of Object.values(groups)) {
      for (const r of rows) {
        expect(r.score).toBe(r.model.figures.find((f) => f.benchmark === "deep-swe")!.value);
        expect(r.tier).toBe(assignBenchmarkTier(r.model, "deep-swe", full));
      }
    }
  });

  it("concatenates to the ranked order", () => {
    const full = dataset([
      ...benchmarkAnchors("terminal-bench", 60, 55, 45),
      model("b", [fig("terminal-bench", 57)]),
      model("a", [fig("terminal-bench", 57)]),
      model("z", [fig("terminal-bench", 20)]),
    ]);
    const { groups, unranked } = computeBenchmarkTierGroups(full, "terminal-bench");
    expect(unranked).toEqual([]);
    const { ranked } = rankBenchmarkModels(full.models, "terminal-bench");
    const flattened = (["ultra", "planning", "execution", "fast"] as const).flatMap((t) => groups[t]);
    expect(flattened.map((r) => r.model.id)).toEqual(ranked.map((r) => r.model.id));
  });

  it("judges the shown models against the full roster's anchors", () => {
    const full = dataset([...benchmarkAnchors("deep-swe"), model("m", [fig("deep-swe", 57)])]);
    const shown = dataset([full.models[3]!]);
    const { groups } = computeBenchmarkTierGroups(shown, "deep-swe", full);
    expect(groups.planning.map((r) => r.model.id)).toEqual(["m"]);
  });
});

describe("benchmarkTierAnchors", () => {
  it("returns each benchmark anchor with its raw score on that benchmark", () => {
    for (const benchmark of Object.keys(BENCHMARK_TIER_ANCHORS) as BenchmarkId[]) {
      const a = benchmarkTierAnchors(dataset(benchmarkAnchors(benchmark)), benchmark);
      expect(a.ultra?.model.id).toBe(BENCHMARK_TIER_ANCHORS[benchmark].ultra);
      expect(a.ultra?.score).toBe(60);
      expect(a.planning?.score).toBe(55);
      expect(a.execution?.score).toBe(45);
      expect(a.ultra?.tier).toBe("ultra");
    }
  });

  it("returns undefined for an anchor missing from the roster or unscored there", () => {
    expect(benchmarkTierAnchors(dataset([]), "deep-swe").ultra).toBeUndefined();
    const unscored = dataset([model(BENCHMARK_TIER_ANCHORS["deep-swe"].ultra, [fig("terminal-bench", 10)])]);
    expect(benchmarkTierAnchors(unscored, "deep-swe").ultra).toBeUndefined();
  });
});

describe("compareDesc", () => {
  it("orders descending with undefined last and never returns NaN", () => {
    expect(compareDesc(2, 1)).toBeLessThan(0);
    expect(compareDesc(1, 2)).toBeGreaterThan(0);
    expect(compareDesc(undefined, 1)).toBe(1);
    expect(compareDesc(1, undefined)).toBe(-1);
    expect(compareDesc(undefined, undefined)).toBe(0);
  });
});

describe("tierRank", () => {
  it("orders the tiers from ultra down to insufficient", () => {
    expect(tierRank("ultra")).toBeGreaterThan(tierRank("planning"));
    expect(tierRank("planning")).toBeGreaterThan(tierRank("execution"));
    expect(tierRank("execution")).toBeGreaterThan(tierRank("fast"));
    expect(tierRank("fast")).toBeGreaterThan(tierRank("insufficient"));
  });
});
