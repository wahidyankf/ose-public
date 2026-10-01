import { describe, expect, it } from "vitest";
import { TIER_ANCHORS } from "@/features/ai-benchmark/core/data/benchmarks";
import {
  assignTier,
  compareDesc,
  computeTierGroups,
  meetsAnchor,
  scoreModels,
  tierAnchors,
  tierRank,
} from "@/features/ai-benchmark/core/tiers";
import { anchors, dataset, fig, flat, model } from "./fixtures";

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
