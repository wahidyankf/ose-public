import { describe, expect, it } from "vitest";
import { blendedPrice, priceRatio } from "@/features/ai-benchmark/core/price";
import { model, price } from "./fixtures";

describe("blendedPrice", () => {
  it("weights input three to one against output", () => {
    expect(blendedPrice(price(4, 20))).toBe(8);
    expect(blendedPrice(price(0.1, 0.5))).toBeCloseTo(0.2);
  });

  it("is undefined when no price is published", () => {
    expect(blendedPrice(undefined)).toBeUndefined();
  });
});

describe("priceRatio", () => {
  it("is how many times the reference's blended price the candidate costs", () => {
    const reference = model("r", [], { price: price(4, 20) });
    const candidate = model("c", [], { price: price(1, 4) });
    expect(priceRatio(candidate, reference)).toBeCloseTo(1.75 / 8);
  });

  it("is undefined when either model has no price, or the reference is free", () => {
    const priced = model("p", [], { price: price(1, 1) });
    expect(priceRatio(model("x"), priced)).toBeUndefined();
    expect(priceRatio(priced, model("x"))).toBeUndefined();
    expect(priceRatio(priced, model("f", [], { price: price(0, 0) }))).toBeUndefined();
  });
});
