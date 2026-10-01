import { describe, expect, it } from "vitest";
import { frontierModels, isFrontier, substitutesFor } from "@/features/ai-benchmark/core/substitute";
import { anchors, dataset, flat, goModel, model, price } from "./fixtures";

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

describe("substitutesFor", () => {
  it("returns OpenCode Go models in the same or a higher tier, by index then blended price", () => {
    const result = substitutesFor(frontierPlanning, roster);
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
    expect(substitutesFor(target, roster).models.map((s) => s.model.id)).not.toContain("go-frontier");
  });

  it("offers the nearest rated OpenCode Go models when none reaches the target's tier", () => {
    const highRoster = dataset([
      ...anchors(),
      frontierUltra,
      goModel("go-a", 50),
      goModel("go-b", 56),
      goModel("go-c", 20),
      goModel("go-d", 30),
      goModel("go-thin", undefined),
    ]);
    const result = substitutesFor(frontierUltra, highRoster);
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
    expect(substitutesFor(r.models[3]!, r).models.map((s) => s.model.id)).toEqual(["go-paid", "go-free"]);
  });

  it("returns nothing for a target with insufficient data", () => {
    expect(substitutesFor(frontierThin, roster)).toEqual({ kind: "insufficient", models: [] });
  });
});
