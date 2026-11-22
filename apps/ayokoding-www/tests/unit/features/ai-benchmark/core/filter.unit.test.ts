import { describe, expect, it } from "vitest";
import {
  BENCHMARK_IDS,
  HARNESS_IDS,
  filterModels,
  isKnownBenchmark,
  isKnownHarness,
  isKnownTier,
} from "@/features/ai-benchmark/core/filter";
import { BENCHMARK_TIER_ANCHORS } from "@/features/ai-benchmark/core/data/benchmarks";
import { dataset, goModel, harnessModel, model, quadAnchors, tiered } from "./fixtures";

const deep = BENCHMARK_TIER_ANCHORS["deep-swe"];
const swe = BENCHMARK_TIER_ANCHORS["swe-atlas-qna"];
const fc = BENCHMARK_TIER_ANCHORS["frontiercode-aa"];

const roster = dataset([
  ...quadAnchors(),
  tiered("cc-fast", "fast", "fast", "fast", "fast"),
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

  it("keeps only models in the consensus tier", () => {
    // The planning anchor is consensus-rated alongside the fixtures.
    expect(ids(filterModels(roster, { tier: "planning" }))).toEqual([deep.planning, "go-planning", "cmd-planning"]);
  });

  it("matches consensus-insufficient models through the insufficient tier option", () => {
    // Single-benchmark anchors plus the bare model: too little data for consensus.
    expect(ids(filterModels(roster, { tier: "insufficient" }))).toEqual([
      swe.execution,
      fc.ultra,
      fc.planning,
      fc.execution,
      "bare",
    ]);
  });

  it("intersects the two filters", () => {
    expect(ids(filterModels(roster, { harness: "claude-code", tier: "planning" }))).toEqual([deep.planning]);
    expect(filterModels(roster, { harness: "opencode-go", tier: "fast" })).toEqual([]);
    expect(ids(filterModels(roster, { harness: "command-code-pro", tier: "fast" }))).toEqual(["pro-fast"]);
  });

  it("leaves the roster untouched when only a score basis is set", () => {
    expect(ids(filterModels(roster, { benchmark: "deep-swe" }))).toEqual(ids(filterModels(roster, {})));
    expect(ids(filterModels(roster, { harness: "opencode-go", benchmark: "deep-swe" }))).toEqual(["go-planning"]);
  });
});

describe("filterModels with a score basis", () => {
  const mixed = dataset([
    ...quadAnchors(),
    // Consensus ultra (2–2 tie goes to ultra) but merely planning on FrontierCode-AA.
    tiered("ultra-here", "ultra", "ultra", "planning", "planning"),
    // Consensus execution but fast on FrontierCode-AA.
    tiered("fast-here", "execution", "execution", "execution", "fast"),
    tiered("cursor-ultra", "ultra", "ultra", "ultra", "ultra", { harnesses: ["cursor"] }),
    // Consensus planning with no FrontierCode-AA figure at all.
    tiered("unranked-here", "planning", "planning", "planning", "unranked"),
  ]);

  it("narrows the tier filter to the per-benchmark tier, not the consensus one", () => {
    // ultra-here is consensus ultra but only planning on FrontierCode-AA.
    expect(ids(filterModels(mixed, { benchmark: "frontiercode-aa", tier: "ultra" }))).toEqual([
      fc.ultra,
      "cursor-ultra",
    ]);
    expect(ids(filterModels(mixed, { benchmark: "frontiercode-aa", tier: "fast" }))).toEqual(["fast-here"]);
  });

  it("matches unranked models through the insufficient tier option", () => {
    expect(ids(filterModels(mixed, { benchmark: "frontiercode-aa", tier: "insufficient" }))).toEqual([
      deep.ultra,
      deep.planning,
      deep.execution,
      swe.execution,
      "unranked-here",
    ]);
  });

  it("keeps the consensus meaning when no score basis is set", () => {
    // The single-benchmark anchors carry too little data for consensus.
    expect(ids(filterModels(mixed, { tier: "insufficient" }))).toEqual([
      swe.execution,
      fc.ultra,
      fc.planning,
      fc.execution,
    ]);
    expect(ids(filterModels(mixed, { tier: "ultra" }))).toEqual([deep.ultra, "ultra-here", "cursor-ultra"]);
  });

  it("intersects the harness filter with the per-benchmark tier", () => {
    expect(ids(filterModels(mixed, { harness: "cursor", benchmark: "frontiercode-aa", tier: "ultra" }))).toEqual([
      "cursor-ultra",
    ]);
    expect(filterModels(mixed, { harness: "cursor", benchmark: "frontiercode-aa", tier: "planning" })).toEqual([]);
  });
});
