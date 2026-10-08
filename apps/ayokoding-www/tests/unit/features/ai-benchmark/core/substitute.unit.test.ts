import { describe, expect, it } from "vitest";
import { DEFAULT_SUBSTITUTE_HARNESS, SUBSTITUTE_HARNESSES } from "@/features/ai-benchmark/core/data/benchmarks";
import type { HarnessId } from "@/features/ai-benchmark/core/data/types";
import {
  frontierModels,
  isFrontier,
  isSubstituteHarness,
  substitutesFor,
} from "@/features/ai-benchmark/core/substitute";
import { anchors, dataset, flat, goModel, harnessModel, model, price } from "./fixtures";

const frontierPlanning = flat("frontier-planning", 57, { vendor: "OpenAI", price: price(4, 20) });
const frontierUltra = flat("frontier-ultra", 70, { vendor: "Anthropic" });
const frontierThin = model("frontier-thin", [], { vendor: "Google" });

const roster = dataset([
  ...anchors(),
  frontierPlanning,
  frontierUltra,
  frontierThin,
  goModel("go-ultra", 62, { price: price(3, 15) }),
  goModel("go-planning-cheap", 56, { price: price(1, 1) }),
  goModel("go-planning-dear", 56, { price: price(2, 2) }),
  goModel("go-execution", 50),
  goModel("go-fast", 20),
  goModel("go-thin", undefined),
  flat("go-frontier", 58, { vendor: "OpenAI", harnesses: ["opencode-go"] }),
]);

describe("isFrontier / frontierModels", () => {
  it("treats Anthropic, OpenAI, Google, and xAI models as frontier", () => {
    expect(isFrontier(frontierPlanning)).toBe(true);
    expect(isFrontier(goModel("x", 1))).toBe(false);
  });

  it("lists the frontier models sorted by name", () => {
    const names = frontierModels(
      dataset([flat("b", 1, { vendor: "xAI" }), flat("a", 1, { vendor: "Google" }), goModel("c", 1)]),
    ).map((m) => m.id);
    expect(names).toEqual(["a", "b"]);
  });
});

describe("substitute harnesses", () => {
  it("offers Command Code Pro, Command Code, then OpenCode Go", () => {
    expect(SUBSTITUTE_HARNESSES).toEqual(["command-code-pro", "command-code", "opencode-go"]);
  });

  it("defaults to Command Code Pro, which is the first option", () => {
    expect(DEFAULT_SUBSTITUTE_HARNESS).toBe("command-code-pro");
    expect(SUBSTITUTE_HARNESSES[0]).toBe(DEFAULT_SUBSTITUTE_HARNESS);
  });

  it("recognises only the offered harnesses", () => {
    for (const h of SUBSTITUTE_HARNESSES) expect(isSubstituteHarness(h)).toBe(true);
    expect(isSubstituteHarness("cursor")).toBe(false);
    expect(isSubstituteHarness("opencode-zen")).toBe(false);
    expect(isSubstituteHarness("")).toBe(false);
  });
});

describe("substitutesFor", () => {
  it("returns models of the chosen harness in the same or a higher tier, by index then blended price", () => {
    const result = substitutesFor(frontierPlanning, roster, "opencode-go");
    expect(result.kind).toBe("matches");
    expect(result.models.map((s) => s.model.id)).toEqual([
      "go-ultra",
      "go-frontier",
      "go-planning-cheap",
      "go-planning-dear",
    ]);
  });

  it("never lists the target itself", () => {
    const target = roster.models.find((m) => m.id === "go-frontier")!;
    expect(substitutesFor(target, roster, "opencode-go").models.map((s) => s.model.id)).not.toContain("go-frontier");
  });

  it("offers the nearest rated models of the chosen harness when none reaches the target's tier", () => {
    const highRoster = dataset([
      ...anchors(),
      frontierUltra,
      goModel("go-a", 50),
      goModel("go-b", 56),
      goModel("go-c", 20),
      goModel("go-d", 30),
      goModel("go-thin", undefined),
    ]);
    const result = substitutesFor(frontierUltra, highRoster, "opencode-go");
    expect(result.kind).toBe("nearest");
    expect(result.models.map((s) => s.model.id)).toEqual(["go-b", "go-a", "go-d"]);
  });

  it("puts an unpriced model after priced ones of the same index", () => {
    const r = dataset([
      ...anchors(),
      flat("t", 30, { vendor: "xAI" }),
      goModel("go-free", 40),
      goModel("go-paid", 40, { price: price(1, 1) }),
    ]);
    expect(substitutesFor(r.models[3]!, r, "opencode-go").models.map((s) => s.model.id)).toEqual([
      "go-paid",
      "go-free",
    ]);
  });

  describe("by harness", () => {
    const mixed = dataset([
      ...anchors(),
      frontierPlanning,
      frontierUltra,
      harnessModel("command-code-pro", "pro-ultra", 62),
      harnessModel("command-code-pro", "pro-planning", 56),
      harnessModel("command-code-pro", "pro-fast", 20),
      harnessModel("command-code", "cc-ultra", 64),
      harnessModel("command-code", "cc-execution", 50),
      goModel("go-planning", 57),
      // On two harnesses at once: listed under each.
      flat("pro-and-go", 58, { vendor: "Moonshot", harnesses: ["command-code-pro", "opencode-go"] }),
    ]);
    const idsFor = (harness: HarnessId) =>
      substitutesFor(frontierPlanning, mixed, harness).models.map((s) => s.model.id);

    it("lists only Command Code Pro models for the Command Code Pro harness", () => {
      expect(idsFor("command-code-pro")).toEqual(["pro-ultra", "pro-and-go", "pro-planning"]);
    });

    it("lists only Command Code models for the Command Code harness", () => {
      expect(idsFor("command-code")).toEqual(["cc-ultra"]);
    });

    it("lists only OpenCode Go models for the OpenCode Go harness", () => {
      expect(idsFor("opencode-go")).toEqual(["pro-and-go", "go-planning"]);
    });

    it("never lists a model of another harness, even when it scores higher", () => {
      expect(idsFor("command-code-pro")).not.toContain("cc-ultra");
      expect(idsFor("command-code")).not.toContain("pro-ultra");
    });

    it("matches within the chosen harness alone when it reaches the target's tier", () => {
      const result = substitutesFor(frontierUltra, mixed, "command-code");
      expect(result.kind).toBe("matches");
      expect(result.models.map((s) => s.model.id)).toEqual(["cc-ultra"]);
    });

    it("falls back to the nearest options of the chosen harness alone", () => {
      const result = substitutesFor(frontierUltra, mixed, "opencode-go");
      expect(result.kind).toBe("nearest");
      expect(result.models.map((s) => s.model.id)).toEqual(["pro-and-go", "go-planning"]);
    });
  });

  it("returns nothing for a target with insufficient data", () => {
    expect(substitutesFor(frontierThin, roster, "opencode-go")).toEqual({ kind: "insufficient", models: [] });
  });
});
