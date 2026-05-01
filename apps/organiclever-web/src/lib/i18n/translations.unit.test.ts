import { it, expect } from "vitest";
import { TRANSLATIONS } from "./translations";

it("en and id have the same keys", () => {
  const enKeys = new Set(Object.keys(TRANSLATIONS.en));
  const idKeys = new Set(Object.keys(TRANSLATIONS.id));
  expect(enKeys).toEqual(idKeys);
});

it("all values are strings", () => {
  for (const [, val] of Object.entries(TRANSLATIONS.en)) {
    expect(typeof val).toBe("string");
  }
  for (const [, val] of Object.entries(TRANSLATIONS.id)) {
    expect(typeof val).toBe("string");
  }
});
