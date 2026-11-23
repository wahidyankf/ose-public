import { describe, it, expect } from "vitest";
import { clampWidth, parsePersistedWidth } from "../../../../src/primitives/resizable-panel/width-model";

describe("clampWidth", () => {
  it("clamps a requested width above the maximum to 35% of the viewport", () => {
    const requestedPx = 900;
    const viewportPx = 1000;
    const minPct = 15;
    const maxPct = 35;

    const result = clampWidth(requestedPx, viewportPx, minPct, maxPct);

    expect(result).toBe(350);
  });

  it("clamps a requested width below the minimum to 15% of the viewport", () => {
    const requestedPx = 50;
    const viewportPx = 1000;
    const minPct = 15;
    const maxPct = 35;

    const result = clampWidth(requestedPx, viewportPx, minPct, maxPct);

    expect(result).toBe(150);
  });

  it("keeps a requested width already inside the band unchanged", () => {
    const requestedPx = 250;
    const viewportPx = 1000;
    const minPct = 15;
    const maxPct = 35;

    const result = clampWidth(requestedPx, viewportPx, minPct, maxPct);

    expect(result).toBe(250);
  });
});

describe("parsePersistedWidth", () => {
  // @scenario specs/libs/web-ui/behaviours/resizable-panel/width-model.feature: parsePersistedWidth returns nothing for text that is not a number
  it.each(["wide", "12px", "NaN"])("returns nothing for the stored text %s", (text) => {
    expect(parsePersistedWidth(text)).toBeUndefined();
  });

  it("rejects an unparseable persisted value", () => {
    const result = parsePersistedWidth("not-a-number");

    expect(result).toBeUndefined();
  });
});
