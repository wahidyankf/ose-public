import { describe, expect, it } from "vitest";
import { BENCHMARK_TIER_ANCHORS } from "@/features/ai-benchmark/core/data/benchmarks";
import type { BenchmarkId, BenchmarkTier } from "@/features/ai-benchmark/core/data/types";
import {
  assignBenchmarkTier,
  assignConsensusTier,
  benchmarkTierAnchors,
  byBenchmarkScoreDesc,
  byConsensusDesc,
  computeBenchmarkTierGroups,
  computeTierGroups,
  meetsBenchmarkAnchor,
  rankBenchmarkModels,
  scoreModels,
  tableOrder,
  tableRows,
  tierRank,
} from "@/features/ai-benchmark/core/tiers";
import { benchmarkAnchors, dataset, fig, model, quadAnchors, tiered } from "./fixtures";

const full = () => dataset([...quadAnchors(), tiered("m", "ultra", "ultra", "planning", "execution")]);

describe("assignConsensusTier", () => {
  it.each<[string, string, string, string, string, number, number]>([
    ["ultra", "ultra", "planning", "execution", "ultra", 2, 4],
    ["planning", "planning", "ultra", "execution", "planning", 2, 4],
    ["ultra", "ultra", "planning", "planning", "ultra", 2, 4],
    ["planning", "ultra", "planning", "ultra", "ultra", 2, 4],
    ["fast", "fast", "fast", "planning", "fast", 3, 4],
    ["ultra", "ultra", "unranked", "unranked", "ultra", 2, 2],
  ])(
    "holds %s/%s/%s/%s → consensus %s, agreeing %d of %d",
    (deepSwe, terminalBench, sweAtlas, frontierCode, tier, agreeing, considered) => {
      type Held = Exclude<BenchmarkTier, "unranked"> | "unranked";
      const held = [deepSwe, terminalBench, sweAtlas, frontierCode].map((t) => t as Held);
      const roster = dataset([...quadAnchors(), tiered("m", held[0]!, held[1]!, held[2]!, held[3]!)]);
      const s = assignConsensusTier(roster.models[roster.models.length - 1]!, roster);
      expect(s.tier).toBe(tier);
      expect(s.agreeing).toBe(agreeing);
      expect(s.considered).toBe(considered);
      expect(s.share).toBeCloseTo(agreeing / considered, 10);
    },
  );

  it("sends a two-way tie to the highest tied tier", () => {
    const roster = dataset([...quadAnchors(), tiered("m", "planning", "planning", "ultra", "ultra")]);
    expect(assignConsensusTier(roster.models[roster.models.length - 1]!, roster).tier).toBe("ultra");
  });

  it("sends a three-way tie to the highest tied tier", () => {
    const roster = dataset([...quadAnchors(), tiered("m", "ultra", "planning", "execution", "unranked")]);
    const s = assignConsensusTier(roster.models[roster.models.length - 1]!, roster);
    expect(s.tier).toBe("ultra");
    expect(s.agreeing).toBe(1);
    expect(s.considered).toBe(3);
  });

  it("marks a model tiered on fewer than two benchmarks insufficient with no consensus count", () => {
    const roster = dataset([...quadAnchors(), model("m", [fig("deep-swe", 90)])]);
    const s = assignConsensusTier(roster.models[roster.models.length - 1]!, roster);
    expect(s.tier).toBe("insufficient");
    expect(s.considered).toBe(1);
    expect(s.agreeing).toBe(0);
    expect(s.share).toBe(0);
  });

  it("marks a model with no figures insufficient", () => {
    const roster = dataset([...quadAnchors(), model("bare")]);
    const s = assignConsensusTier(roster.models[roster.models.length - 1]!, roster);
    expect(s.tier).toBe("insufficient");
    expect(s.considered).toBe(0);
  });

  it("judges each benchmark against its own anchors", () => {
    // planning on DeepSWE (57), ultra on FrontierCode-AA (70): consensus is the 1–1 tie → ultra.
    const roster = dataset([...quadAnchors(), tiered("m", "planning", "unranked", "unranked", "ultra")]);
    expect(assignConsensusTier(roster.models[roster.models.length - 1]!, roster).tier).toBe("ultra");
  });
});

describe("scoreModels", () => {
  it("scores the shown models against the full roster's anchors", () => {
    const all = [...quadAnchors(), tiered("m", "planning", "planning", "planning", "execution")];
    const f = dataset(all);
    const shown = dataset([all[all.length - 1]!]);
    expect(scoreModels(shown, f)).toEqual([
      { model: all[all.length - 1], tier: "planning", agreeing: 3, considered: 4, share: 0.75 },
    ]);
  });

  it("defaults the full roster to the shown roster", () => {
    const f = dataset([...quadAnchors(), tiered("m", "ultra", "ultra", "ultra", "ultra")]);
    expect(scoreModels(f).find((s) => s.model.id === "m")?.tier).toBe("ultra");
  });
});

describe("byConsensusDesc", () => {
  it("orders tier rank first, even when a lower tier agrees more", () => {
    const f = dataset([
      ...quadAnchors(),
      tiered("exec-4of4", "execution", "execution", "execution", "execution"),
      tiered("plan-2of4", "planning", "planning", "execution", "execution"),
    ]);
    const scored = scoreModels(f);
    const plan = scored.find((s) => s.model.id === "plan-2of4")!;
    const exec = scored.find((s) => s.model.id === "exec-4of4")!;
    expect([exec, plan].sort(byConsensusDesc).map((s) => s.model.id)).toEqual(["plan-2of4", "exec-4of4"]);
  });

  it("orders agreeing desc, then share desc, then ascending id", () => {
    const deep = BENCHMARK_TIER_ANCHORS["deep-swe"];
    const f = dataset([
      ...quadAnchors(),
      tiered("c-2of4", "planning", "planning", "execution", "execution"),
      tiered("b-3of4", "planning", "planning", "planning", "execution"),
      tiered("a-3of3", "planning", "planning", "planning", "unranked"),
    ]);
    const groups = computeTierGroups(f);
    // The planning anchor holds 3 of 3 like a-3of3 and loses the id tiebreak to it.
    expect(groups.planning.map((s) => s.model.id)).toEqual(["a-3of3", deep.planning, "b-3of4", "c-2of4"]);
  });
});

describe("computeTierGroups", () => {
  it("puts every model in exactly one group", () => {
    const deep = BENCHMARK_TIER_ANCHORS["deep-swe"];
    const swe = BENCHMARK_TIER_ANCHORS["swe-atlas-qna"];
    const fc = BENCHMARK_TIER_ANCHORS["frontiercode-aa"];
    const f = dataset([
      ...quadAnchors(),
      tiered("u", "ultra", "ultra", "ultra", "ultra"),
      tiered("p", "planning", "planning", "planning", "execution"),
      tiered("e", "execution", "execution", "execution", "fast"),
      tiered("f", "fast", "fast", "fast", "fast"),
      model("thin", [fig("deep-swe", 90)]),
      model("bare"),
    ]);
    const groups = computeTierGroups(f);
    // The multi-benchmark anchors are rated too: opus ultra, sol planning, sonnet execution.
    expect(groups.ultra.map((s) => s.model.id)).toEqual(["u", deep.ultra]);
    expect(groups.planning.map((s) => s.model.id)).toEqual([deep.planning, "p"]);
    expect(groups.execution.map((s) => s.model.id)).toEqual(["e", deep.execution]);
    expect(groups.fast.map((s) => s.model.id)).toEqual(["f"]);
    // Single-benchmark anchors plus the two thin models have too little data.
    expect(groups.insufficient.map((s) => s.model.id).sort()).toEqual(
      [swe.execution, fc.ultra, fc.planning, fc.execution, "thin", "bare"].sort(),
    );
    const total = Object.values(groups).reduce((n, g) => n + g.length, 0);
    expect(total).toBe(f.models.length);
  });
});

describe("tableRows", () => {
  it("shows the consensus tier when no benchmark is chosen", () => {
    const f = full();
    expect(tableRows(f, undefined).find((r) => r.model.id === "m")).toMatchObject({
      tier: "ultra",
      agreeing: 2,
      considered: 4,
    });
  });

  it("shows the per-benchmark tier, unranked included, when a benchmark is chosen", () => {
    const f = dataset([
      ...quadAnchors(),
      tiered("rated", "planning", "planning", "planning", "planning"),
      tiered("missing", "planning", "planning", "planning", "unranked"),
    ]);
    const rows = tableRows(f, "frontiercode-aa");
    expect(rows.find((r) => r.model.id === "rated")).toMatchObject({ tier: "planning" });
    expect(rows.find((r) => r.model.id === "missing")).toMatchObject({ tier: "unranked" });
  });

  it("orders the highest active tier first, unranked last, then consensus strength, then id", () => {
    const deep = BENCHMARK_TIER_ANCHORS["deep-swe"];
    const f = dataset([
      ...quadAnchors(),
      tiered("b-plan", "planning", "planning", "planning", "execution"),
      tiered("a-plan", "planning", "planning", "planning", "unranked"),
      tiered("fast", "fast", "fast", "fast", "fast"),
      model("thin", [fig("deep-swe", 90)]),
    ]);
    const rows = tableRows(f, undefined);
    const rated = rows.filter((r) => r.tier !== "insufficient");
    // The multi-benchmark anchors are rated alongside the fixtures: ultra, then planning
    // (a-plan and the anchor both 3 of 3, id order), then execution, then fast.
    expect(rated.map((r) => r.model.id)).toEqual([
      deep.ultra,
      "a-plan",
      deep.planning,
      "b-plan",
      deep.execution,
      "fast",
    ]);
    expect(rows.length - rated.length).toBe(5);
    expect(rows.slice(rated.length).every((r) => r.tier === "insufficient")).toBe(true);
  });

  it("keeps the per-benchmark meaning when a score basis is set", () => {
    // Consensus ultra (tie) but merely planning on FrontierCode-AA.
    const f = dataset([...quadAnchors(), tiered("m", "ultra", "planning", "ultra", "planning")]);
    expect(tableRows(f, undefined).find((r) => r.model.id === "m")?.tier).toBe("ultra");
    expect(tableRows(f, "frontiercode-aa").find((r) => r.model.id === "m")?.tier).toBe("planning");
  });
});

describe("tableOrder", () => {
  it("is the order tableRows uses", () => {
    const f = full();
    const rows = tableRows(f, undefined);
    expect([...rows].sort(tableOrder).map((r) => r.model.id)).toEqual(rows.map((r) => r.model.id));
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

describe("byBenchmarkScoreDesc", () => {
  it("is the order rankBenchmarkModels uses", () => {
    const models = [model("b", [fig("deep-swe", 70)]), model("a", [fig("deep-swe", 70)])];
    const { ranked } = rankBenchmarkModels(models, "deep-swe");
    expect([...ranked].sort(byBenchmarkScoreDesc).map((r) => r.model.id)).toEqual(["a", "b"]);
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

describe("tierRank", () => {
  it("orders the tiers from ultra down to insufficient", () => {
    expect(tierRank("ultra")).toBeGreaterThan(tierRank("planning"));
    expect(tierRank("planning")).toBeGreaterThan(tierRank("execution"));
    expect(tierRank("execution")).toBeGreaterThan(tierRank("fast"));
    expect(tierRank("fast")).toBeGreaterThan(tierRank("insufficient"));
  });
});
