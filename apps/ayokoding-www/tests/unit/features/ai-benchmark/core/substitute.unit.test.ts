import { describe, expect, it } from "vitest";
import { DEFAULT_SUBSTITUTE_HARNESS, SUBSTITUTE_HARNESSES } from "@/features/ai-benchmark/core/data/benchmarks";
import type { HarnessId } from "@/features/ai-benchmark/core/data/types";
import {
  frontierModels,
  isFrontier,
  isSubstituteHarness,
  substitutesFor,
} from "@/features/ai-benchmark/core/substitute";
import { dataset, flat, model, price, quadAnchors, tiered } from "./fixtures";

const frontierPlanning = tiered("frontier-planning", "planning", "planning", "planning", "execution", {
  vendor: "OpenAI",
  price: price(4, 20),
});
const frontierUltra = tiered("frontier-ultra", "ultra", "ultra", "ultra", "ultra", { vendor: "Anthropic" });
const frontierThin = model("frontier-thin", [], { vendor: "Google" });

const roster = dataset([
  ...quadAnchors(),
  frontierPlanning,
  frontierUltra,
  frontierThin,
  tiered("go-ultra", "ultra", "ultra", "ultra", "ultra", {
    vendor: "OpenWeights",
    harnesses: ["opencode-go"],
    price: price(3, 15),
  }),
  tiered("go-planning-cheap", "planning", "planning", "planning", "execution", {
    vendor: "OpenWeights",
    harnesses: ["opencode-go"],
    price: price(1, 1),
  }),
  tiered("go-planning-dear", "planning", "planning", "planning", "execution", {
    vendor: "OpenWeights",
    harnesses: ["opencode-go"],
    price: price(2, 2),
  }),
  tiered("go-execution", "execution", "execution", "execution", "execution", {
    vendor: "OpenWeights",
    harnesses: ["opencode-go"],
  }),
  tiered("go-fast", "fast", "fast", "fast", "fast", { vendor: "OpenWeights", harnesses: ["opencode-go"] }),
  tiered("go-thin", "planning", "unranked", "unranked", "unranked", {
    vendor: "OpenWeights",
    harnesses: ["opencode-go"],
  }),
  tiered("go-frontier", "planning", "planning", "planning", "execution", {
    vendor: "OpenAI",
    harnesses: ["opencode-go"],
  }),
]);

describe("isFrontier / frontierModels", () => {
  it("treats Anthropic, OpenAI, Google, and xAI models as frontier", () => {
    expect(isFrontier(frontierPlanning)).toBe(true);
    expect(isFrontier(tiered("x", "fast", "fast", "fast", "fast", { vendor: "OpenWeights" }))).toBe(false);
  });

  it("lists the frontier models sorted by name", () => {
    const names = frontierModels(dataset([flat("b", 1, { vendor: "xAI" }), flat("a", 1, { vendor: "Google" })])).map(
      (m) => m.id,
    );
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
  it("returns models of the chosen harness in the same or a higher tier, ordered by consensus tier then strength", () => {
    const result = substitutesFor(frontierPlanning, roster, "opencode-go");
    expect(result.kind).toBe("matches");
    expect(result.models.map((s) => s.model.id)).toEqual([
      "go-ultra",
      "go-frontier",
      "go-planning-cheap",
      "go-planning-dear",
    ]);
  });

  it("orders equal tiers by agreeing, then share, then id — never by price", () => {
    const r = dataset([
      ...quadAnchors(),
      tiered("t", "planning", "planning", "planning", "execution", { vendor: "xAI" }),
      tiered("go-b", "planning", "planning", "planning", "execution", {
        vendor: "OpenWeights",
        harnesses: ["opencode-go"],
        price: price(1, 1),
      }),
      tiered("go-a", "planning", "planning", "planning", "execution", {
        vendor: "OpenWeights",
        harnesses: ["opencode-go"],
        price: price(99, 99),
      }),
    ]);
    // go-a sorts first by id even though it is far pricier.
    const target = r.models.find((m) => m.id === "t")!;
    expect(substitutesFor(target, r, "opencode-go").models.map((s) => s.model.id)).toEqual(["go-a", "go-b"]);
  });

  it("never lists the target itself", () => {
    const target = roster.models.find((m) => m.id === "go-frontier")!;
    expect(substitutesFor(target, roster, "opencode-go").models.map((s) => s.model.id)).not.toContain("go-frontier");
  });

  it("offers the nearest consensus-rated models of the chosen harness when none reaches the target's tier", () => {
    const highRoster = dataset([
      ...quadAnchors(),
      frontierUltra,
      tiered("go-a", "execution", "execution", "execution", "execution", {
        vendor: "OpenWeights",
        harnesses: ["opencode-go"],
      }),
      tiered("go-b", "planning", "planning", "planning", "execution", {
        vendor: "OpenWeights",
        harnesses: ["opencode-go"],
      }),
      tiered("go-c", "fast", "fast", "fast", "fast", { vendor: "OpenWeights", harnesses: ["opencode-go"] }),
      tiered("go-d", "fast", "fast", "fast", "unranked", { vendor: "OpenWeights", harnesses: ["opencode-go"] }),
      tiered("go-thin", "planning", "unranked", "unranked", "unranked", {
        vendor: "OpenWeights",
        harnesses: ["opencode-go"],
      }),
    ]);
    const result = substitutesFor(frontierUltra, highRoster, "opencode-go");
    expect(result.kind).toBe("nearest");
    expect(result.models.map((s) => s.model.id)).toEqual(["go-b", "go-a", "go-c"]);
  });

  describe("by harness", () => {
    const mixed = dataset([
      ...quadAnchors(),
      frontierPlanning,
      frontierUltra,
      tiered("pro-ultra", "ultra", "ultra", "ultra", "ultra", { harnesses: ["command-code-pro"] }),
      tiered("pro-planning", "planning", "planning", "planning", "execution", { harnesses: ["command-code-pro"] }),
      tiered("pro-fast", "fast", "fast", "fast", "fast", { harnesses: ["command-code-pro"] }),
      tiered("cc-ultra", "ultra", "ultra", "ultra", "ultra", { harnesses: ["command-code"] }),
      tiered("cc-execution", "execution", "execution", "execution", "execution", { harnesses: ["command-code"] }),
      tiered("go-planning", "planning", "planning", "planning", "execution", { harnesses: ["opencode-go"] }),
      // On two harnesses at once: listed under each.
      tiered("pro-and-go", "planning", "planning", "planning", "execution", {
        vendor: "Moonshot",
        harnesses: ["command-code-pro", "opencode-go"],
      }),
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
      expect(idsFor("opencode-go")).toEqual(["go-planning", "pro-and-go"]);
    });

    it("never lists a model of another harness, even when it tiers higher", () => {
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
      expect(result.models.map((s) => s.model.id)).toEqual(["go-planning", "pro-and-go"]);
    });
  });

  it("returns nothing for a target with insufficient data", () => {
    expect(substitutesFor(frontierThin, roster, "opencode-go")).toEqual({ kind: "insufficient", models: [] });
  });

  it("treats a no-consensus target like an insufficient one", () => {
    const r = dataset([
      ...quadAnchors(),
      tiered("split-target", "ultra", "planning", "execution", "fast", { vendor: "OpenAI" }),
      tiered("go-ultra", "ultra", "ultra", "ultra", "ultra", {
        vendor: "OpenWeights",
        harnesses: ["opencode-go"],
      }),
    ]);
    const target = r.models.find((m) => m.id === "split-target")!;
    expect(substitutesFor(target, r, "opencode-go")).toEqual({ kind: "insufficient", models: [] });
  });

  it("never offers a no-consensus model as a substitute", () => {
    const r = dataset([
      ...quadAnchors(),
      frontierPlanning,
      tiered("go-split", "ultra", "planning", "execution", "fast", {
        vendor: "OpenWeights",
        harnesses: ["opencode-go"],
      }),
      tiered("go-planning", "planning", "planning", "planning", "execution", {
        vendor: "OpenWeights",
        harnesses: ["opencode-go"],
      }),
    ]);
    const result = substitutesFor(frontierPlanning, r, "opencode-go");
    expect(result.kind).toBe("matches");
    expect(result.models.map((s) => s.model.id)).toEqual(["go-planning"]);
  });
});
