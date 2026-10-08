import { describe, expect, it } from "vitest";
import { HARNESS_IDS, filterModels, isKnownHarness, isKnownTier } from "@/features/ai-benchmark/core/filter";
import { anchors, dataset, flat, goModel, harnessModel, model } from "./fixtures";

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
  it("lists the seven harnesses in alphabetical order", () => {
    expect(HARNESS_IDS).toEqual([
      "claude-code",
      "codex-cli",
      "command-code",
      "command-code-pro",
      "cursor",
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
});
