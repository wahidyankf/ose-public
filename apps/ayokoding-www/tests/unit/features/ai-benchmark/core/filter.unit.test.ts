import { describe, expect, it } from "vitest";
import {
  BENCHMARK_IDS,
  HARNESS_IDS,
  filterModels,
  isKnownBenchmark,
  isKnownHarness,
  isKnownTier,
} from "@/features/ai-benchmark/core/filter";
import { BENCHMARK_TIER_ANCHORS, TIER_ANCHORS } from "@/features/ai-benchmark/core/data/benchmarks";
import { anchors, benchmarkAnchors, dataset, fig, flat, goModel, harnessModel, model } from "./fixtures";

const roster = dataset([
  ...anchors(),
  flat("cc-fast", 20),
  goModel("go-planning", 56),
  harnessModel("command-code", "cmd-planning", 56),
  harnessModel("command-code-pro", "pro-fast", 20),
  model("bare"),
]);
const ids = (ms: { id: string }[]) => ms.map((m) => m.id);

describe("known values", () => {
  it("lists the eight harnesses in alphabetical order", () => {
    expect(HARNESS_IDS).toEqual([
      "claude-code",
      "codex-cli",
      "command-code",
      "command-code-pro",
      "cursor",
      "muse-code",
      "opencode-go",
      "opencode-zen",
    ]);
    expect([...HARNESS_IDS]).toEqual([...HARNESS_IDS].sort());
  });

  it("recognises harness and tier values", () => {
    expect(isKnownHarness("cursor")).toBe(true);
    expect(isKnownHarness("command-code")).toBe(true);
    expect(isKnownHarness("command-code-pro")).toBe(true);
    expect(isKnownHarness("command")).toBe(false);
    expect(isKnownHarness("vim")).toBe(false);
    expect(isKnownTier("insufficient")).toBe(true);
    expect(isKnownTier("opus")).toBe(false);
  });

  it("recognises the four score-basis benchmarks", () => {
    expect(BENCHMARK_IDS).toEqual(["deep-swe", "terminal-bench", "swe-atlas-qna", "frontiercode-aa"]);
    for (const id of BENCHMARK_IDS) expect(isKnownBenchmark(id)).toBe(true);
    expect(isKnownBenchmark("average")).toBe(false);
    expect(isKnownBenchmark("vim")).toBe(false);
  });
});

describe("filterModels", () => {
  it("returns every model with no filter", () => {
    expect(filterModels(roster, {})).toHaveLength(roster.models.length);
  });

  it("keeps only models the harness exposes", () => {
    expect(ids(filterModels(roster, { harness: "opencode-go" }))).toEqual(["go-planning"]);
  });

  it("keeps the Command Code and Command Code Pro harnesses apart", () => {
    expect(ids(filterModels(roster, { harness: "command-code" }))).toEqual(["cmd-planning"]);
    expect(ids(filterModels(roster, { harness: "command-code-pro" }))).toEqual(["pro-fast"]);
  });

  it("keeps only models in the tier", () => {
    expect(ids(filterModels(roster, { tier: "insufficient" }))).toEqual(["bare"]);
    expect(ids(filterModels(roster, { tier: "planning" }))).toEqual(["gpt-5.6-sol", "go-planning", "cmd-planning"]);
  });

  it("intersects the two filters", () => {
    expect(ids(filterModels(roster, { harness: "claude-code", tier: "planning" }))).toEqual(["gpt-5.6-sol"]);
    expect(filterModels(roster, { harness: "opencode-go", tier: "fast" })).toEqual([]);
    expect(ids(filterModels(roster, { harness: "command-code-pro", tier: "fast" }))).toEqual(["pro-fast"]);
  });

  it("leaves the roster untouched when only a score basis is set", () => {
    expect(ids(filterModels(roster, { benchmark: "deep-swe" }))).toEqual(ids(filterModels(roster, {})));
    expect(ids(filterModels(roster, { harness: "opencode-go", benchmark: "deep-swe" }))).toEqual(["go-planning"]);
  });
});

describe("filterModels with a score basis", () => {
  // Composite anchors (flat 60/55/45) plus FrontierCode-AA anchors (raw 30/20/10): distinct ids,
  // so one roster carries both anchor sets.
  const roster = dataset([
    ...anchors(),
    ...benchmarkAnchors("frontiercode-aa", 30, 20, 10),
    model("ultra-here", [fig("frontiercode-aa", 40), fig("deep-swe", 1)]),
    model("fast-here", [fig("frontiercode-aa", 5), fig("deep-swe", 99)]),
    model("cursor-ultra", [fig("frontiercode-aa", 80), fig("deep-swe", 80)], { harnesses: ["cursor"] }),
    model("unranked-here", [fig("deep-swe", 99)]),
  ]);

  it("narrows the tier filter to the per-benchmark tier, not the composite one", () => {
    // ultra-here is ultra on FrontierCode-AA but fast on the composite (40 + 1 over two benchmarks);
    // fast-here is fast on FrontierCode-AA but execution on the composite (5 + 99 over two benchmarks).
    expect(ids(filterModels(roster, { benchmark: "frontiercode-aa", tier: "ultra" }))).toEqual([
      BENCHMARK_TIER_ANCHORS["frontiercode-aa"].ultra,
      "ultra-here",
      "cursor-ultra",
    ]);
    expect(ids(filterModels(roster, { benchmark: "frontiercode-aa", tier: "fast" }))).toEqual(["fast-here"]);
  });

  it("matches unranked models through the insufficient tier option", () => {
    expect(ids(filterModels(roster, { benchmark: "frontiercode-aa", tier: "insufficient" })).sort()).toEqual(
      [...Object.values(TIER_ANCHORS), "unranked-here"].sort(),
    );
  });

  it("keeps the composite meaning when no score basis is set", () => {
    expect(ids(filterModels(roster, { tier: "insufficient" }))).toEqual([
      ...Object.values(BENCHMARK_TIER_ANCHORS["frontiercode-aa"]),
      "unranked-here",
    ]);
    expect(ids(filterModels(roster, { tier: "ultra" }))).toEqual([TIER_ANCHORS.ultra, "cursor-ultra"]);
  });

  it("intersects the harness filter with the per-benchmark tier", () => {
    expect(ids(filterModels(roster, { harness: "cursor", benchmark: "frontiercode-aa", tier: "ultra" }))).toEqual([
      "cursor-ultra",
    ]);
    expect(filterModels(roster, { harness: "cursor", benchmark: "frontiercode-aa", tier: "planning" })).toEqual([]);
  });
});
