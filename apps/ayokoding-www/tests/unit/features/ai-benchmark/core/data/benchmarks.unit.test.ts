import { describe, expect, it } from "vitest";
import {
  FRONTIER_VENDORS,
  HARNESS_DISPLAY_NAMES,
  HARNESS_IN_HOUSE_LINES,
  ROSTER_CATALOG_HARNESSES,
  rosterScopeParams,
} from "@/features/ai-benchmark/core/data/benchmarks";
import { HARNESS_IDS } from "@/features/ai-benchmark/core/filter";

describe("HARNESS_DISPLAY_NAMES", () => {
  it("names every harness with its proper-noun display name", () => {
    expect(Object.keys(HARNESS_DISPLAY_NAMES).sort()).toEqual([...HARNESS_IDS].sort());
    expect(HARNESS_DISPLAY_NAMES["command-code"]).toBe("Command Code");
    expect(HARNESS_DISPLAY_NAMES["command-code-pro"]).toBe("Command Code Pro");
  });

  it("gives every harness a distinct name", () => {
    const names = Object.values(HARNESS_DISPLAY_NAMES);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("rosterScopeParams", () => {
  it("covers every OpenCode Go and Command Code model, whatever the reader's language", () => {
    expect(ROSTER_CATALOG_HARNESSES).toEqual(["opencode-go", "command-code"]);
    expect(rosterScopeParams().catalogs).toBe("OpenCode Go and Command Code");
    expect(rosterScopeParams("en").catalogs).toBe("OpenCode Go and Command Code");
    expect(rosterScopeParams("id").catalogs).toBe("OpenCode Go dan Command Code");
  });

  it("lists the frontier vendors and the in-house lines from the constants that define them", () => {
    const params = rosterScopeParams();
    expect(params.frontier).toBe(FRONTIER_VENDORS.join(", "));
    expect(params.inHouse).toBe(HARNESS_IN_HOUSE_LINES.map((l) => `${l.vendor} ${l.line}`).join(", "));
  });

  it("no longer carries the single-harness `substitute` value", () => {
    expect(Object.keys(rosterScopeParams()).sort()).toEqual(["catalogs", "frontier", "inHouse"]);
  });
});
