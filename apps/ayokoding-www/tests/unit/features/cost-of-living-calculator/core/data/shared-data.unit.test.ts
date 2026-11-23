// P1D characterization at the unit level: the cost-of-living evaluated exports must survive the
// same JSON decode path the library's published files take, with no file read. The checks against
// the real checked-in files run in tests/integration.
import { describe, expect, it } from "vitest";
import { cities, countries, dataset } from "@/features/cost-of-living-calculator/core/data/cities";
import { ladder, roleMatrix } from "@/features/cost-of-living-calculator/core/data/roles";
import { decodeState, encodeState, DEFAULT_STATE } from "@/features/cost-of-living-calculator/core/url-state";

/**
 * In-memory double of `libs/ayokoding-data/data/cost-of-living.json`. The site's exports are
 * serialized and parsed back, which is the decode path the published file takes.
 */
const publishedDouble = JSON.parse(
  JSON.stringify({
    snapshotDate: dataset.snapshotDate,
    countries,
    cities,
    roleMatrix: { snapshotDate: roleMatrix.snapshotDate, ladder, salaries: roleMatrix.salaries },
  }),
) as {
  snapshotDate: string;
  countries: unknown;
  cities: unknown;
  roleMatrix: { snapshotDate: string; ladder: unknown; salaries: unknown };
};

// @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: The site decodes the same dataset values the library publishes
describe("evaluated exports equal the shared JSON", () => {
  it("carries the same countries and cities in the same order", () => {
    expect(publishedDouble.snapshotDate).toBe(dataset.snapshotDate);
    expect(publishedDouble.countries).toEqual(countries);
    expect(publishedDouble.cities).toEqual(cities);
    expect((publishedDouble.cities as { id: string }[]).map((c) => c.id)).toEqual(cities.map((c) => c.id));
  });

  it("carries the same role matrix with its own snapshot date", () => {
    expect(publishedDouble.roleMatrix.snapshotDate).toBe(roleMatrix.snapshotDate);
    expect(publishedDouble.roleMatrix.ladder).toEqual(ladder);
    expect(publishedDouble.roleMatrix.salaries).toEqual(roleMatrix.salaries);
  });
});

describe("codec blanks, duplicates, and defaults", () => {
  it("keeps a blank min-role target distinct from an explicit zero", () => {
    const blank = decodeState(new URLSearchParams(""), dataset);
    expect(blank.minRole.targetRaw).toBe("");
    expect(encodeState(blank).toString()).toBe("");
    const zero = decodeState(new URLSearchParams("target=0"), dataset);
    expect(zero.minRole.targetRaw).toBe("0");
    expect(encodeState(zero).toString()).toContain("target=0");
  });

  it("encodes the default state to an empty query", () => {
    expect(encodeState(DEFAULT_STATE).toString()).toBe("");
  });

  it("resolves a duplicated parameter to its first value and drops unknowns", () => {
    const state = decodeState(new URLSearchParams("adults=2&adults=1&harness=x"), dataset);
    expect(state.household.adults).toBe(2);
  });
});
