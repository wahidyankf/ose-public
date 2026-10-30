// P1D characterization: the cost-of-living evaluated exports must be reproducible
// byte-for-byte from the neutral JSON in libs/ayokoding-data, and the representative
// results/codecs below must keep matching the checked-in shared test vectors.
// At RED these fail on the missing shared-data artifacts; at GREEN they prove
// old/new data equality and unchanged behavior.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  AREA_MULTIPLIERS,
  SUBLINEAR_DAMPING,
  cities,
  countries,
  dataset,
} from "@/features/cost-of-living-calculator/core/data/cities";
import type { City, Country, Household } from "@/features/cost-of-living-calculator/core/data/cities";
import { ladder, roleMatrix } from "@/features/cost-of-living-calculator/core/data/roles";
import type { EngRole } from "@/features/cost-of-living-calculator/core/data/roles";
import { fx } from "@/features/cost-of-living-calculator/core/data/fx";
import { essentialsLocal, netUsd, savingsRow } from "@/features/cost-of-living-calculator/core/calc";
import type { Area, SchoolType } from "@/features/cost-of-living-calculator/core/calc";
import { fmtCurrency, fmtDualCurrency, fmtNum } from "@/features/cost-of-living-calculator/core/format";
import { minimumRole, rankLadder, roleMedianGrossUsd } from "@/features/cost-of-living-calculator/core/role-lookup";
import { DEFAULT_STATE, decodeState, encodeState } from "@/features/cost-of-living-calculator/core/url-state";
import type { CalculatorState } from "@/features/cost-of-living-calculator/core/url-state";

const LIB = path.resolve(import.meta.dirname, "../../../../../../../../libs/ayokoding-data");
const livingPath = path.join(LIB, "data", "cost-of-living.json");
const fxPath = path.join(LIB, "data", "fx.json");
const calculatorVectorsPath = path.join(LIB, "test-vectors", "calculator.json");
const urlVectorsPath = path.join(LIB, "test-vectors", "url-state.json");
const provenancePath = path.join(LIB, "provenance.md");

function mustReadJson(file: string): unknown {
  expect(existsSync(file), `shared artifact missing: ${file}`).toBe(true);
  return JSON.parse(readFileSync(file, "utf8"));
}

const cityById = (id: string): City => cities.find((c) => c.id === id) as City;
const countryById = (id: string): Country => countries.find((c) => c.id === id) as Country;

describe("shared cost-of-living artifact presence", () => {
  it("publishes the neutral country/city and fx JSON files", () => {
    expect(existsSync(livingPath), `missing ${livingPath}`).toBe(true);
    expect(existsSync(fxPath), `missing ${fxPath}`).toBe(true);
  });

  it("publishes the shared calculator and url-state vectors", () => {
    expect(existsSync(calculatorVectorsPath), `missing ${calculatorVectorsPath}`).toBe(true);
    expect(existsSync(urlVectorsPath), `missing ${urlVectorsPath}`).toBe(true);
  });

  it("records both dataset dates and sourcing provenance", () => {
    expect(existsSync(provenancePath), `missing ${provenancePath}`).toBe(true);
    const provenance = readFileSync(provenancePath, "utf8");
    expect(provenance).toContain(dataset.snapshotDate);
    expect(provenance).toContain(fx.fxSnapshotDate);
    expect(provenance).toContain("data/cost-of-living.json");
    expect(provenance).toContain("data/fx.json");
  });
});

describe("evaluated exports equal the shared JSON", () => {
  it("carries the same countries and cities in the same order", () => {
    const json = mustReadJson(livingPath) as { snapshotDate: string; countries: unknown; cities: unknown };
    expect(json.snapshotDate).toBe(dataset.snapshotDate);
    expect(json.countries).toEqual(countries);
    expect(json.cities).toEqual(cities);
    expect((json.cities as City[]).map((c) => c.id)).toEqual(cities.map((c) => c.id));
  });

  it("keeps the fx table in its own file with its independent snapshot date", () => {
    const fxJson = mustReadJson(fxPath) as typeof fx;
    const living = mustReadJson(livingPath) as Record<string, unknown>;
    expect(fxJson).toEqual(fx);
    expect(fxJson.fxSnapshotDate).not.toBe(dataset.snapshotDate);
    expect(living, "fx must not be duplicated into cost-of-living.json").not.toHaveProperty("fx");
    expect(living, "fx must not be duplicated into cost-of-living.json").not.toHaveProperty("ratesUsdPerUnit");
  });

  it("carries the same role matrix with its own snapshot date", () => {
    const json = mustReadJson(livingPath) as {
      roleMatrix: { snapshotDate: string; ladder: unknown; salaries: unknown };
    };
    expect(json.roleMatrix.snapshotDate).toBe(roleMatrix.snapshotDate);
    expect(json.roleMatrix.ladder).toEqual(ladder);
    expect(json.roleMatrix.salaries).toEqual(roleMatrix.salaries);
  });

  it("keeps absent optional fields absent in the JSON", () => {
    const json = mustReadJson(livingPath) as { cities: City[] };
    for (const [index, city] of cities.entries()) {
      if (city.subNational === undefined) {
        expect(json.cities[index], `${city.id} must not gain subNational`).not.toHaveProperty("subNational");
      }
    }
  });

  it("resolves every city currency through the shared fx table", () => {
    const fxJson = mustReadJson(fxPath) as typeof fx;
    for (const city of cities) {
      expect(fxJson.ratesUsdPerUnit[city.currency], `${city.id} currency`).toBeGreaterThan(0);
    }
  });
});

describe("representative calculator results match the shared vectors", () => {
  it("reproduces every shared calculator vector case", () => {
    const vectors = mustReadJson(calculatorVectorsPath) as {
      essentialsLocal: { city: string; household: Household; schoolType: SchoolType; area: Area; value: number }[];
      netUsd: { city: string; grossMonthlyUsd: number; value: number }[];
      savingsRow: {
        city: string;
        grossMonthlyUsd: number;
        household: Household;
        schoolType: SchoolType;
        area: Area;
        row: Record<string, number | string>;
      }[];
      minimumRole: { baselineUsd: number; role: string | null }[];
      format: { fmtNum: [number, string][]; fmtCurrency: [number, string][] };
      roleMedianGrossUsd: { city: string; role: EngRole; value: number }[];
      policy: { areaMultipliers: Record<string, number>; sublinearDamping: number };
    };
    for (const { city, household, schoolType, area, value } of vectors.essentialsLocal) {
      expect(essentialsLocal(cityById(city), countryById(cityById(city).countryId), household, schoolType, area)).toBe(
        value,
      );
    }
    for (const { city, grossMonthlyUsd, value } of vectors.netUsd) {
      const c = cityById(city);
      expect(netUsd(grossMonthlyUsd, c, countryById(c.countryId), fx)).toBe(value);
    }
    for (const { city, grossMonthlyUsd, household, schoolType, area, row } of vectors.savingsRow) {
      const c = cityById(city);
      expect(savingsRow(grossMonthlyUsd, c, countryById(c.countryId), fx, household, schoolType, area)).toEqual(row);
    }
    for (const [input, expected] of vectors.format.fmtNum) {
      expect(fmtNum(input)).toBe(expected);
    }
    for (const [input, expected] of vectors.format.fmtCurrency) {
      expect(fmtCurrency(input)).toBe(expected);
    }
    for (const { city, role, value } of vectors.roleMedianGrossUsd) {
      expect(roleMedianGrossUsd(fx, roleMatrix, cityById(city), role)).toBe(value);
    }
    expect(AREA_MULTIPLIERS).toEqual(vectors.policy.areaMultipliers);
    expect(SUBLINEAR_DAMPING).toBe(vectors.policy.sublinearDamping);
  });

  it("keeps the minimum-role examples on their ladder rungs", () => {
    const vectors = mustReadJson(calculatorVectorsPath) as {
      minimumRole: { baselineUsd: number; role: string | null }[];
    };
    for (const { baselineUsd, role } of vectors.minimumRole) {
      const ranked = rankLadder(
        dataset,
        { household: DEFAULT_STATE.household, area: "center", schoolType: "public" },
        roleMatrix,
        null,
      );
      expect(minimumRole(baselineUsd, ranked)).toBe(role);
    }
  });

  it("keeps the dual-currency display format", () => {
    const vectors = mustReadJson(calculatorVectorsPath) as {
      dualCurrency: { localAmount: number; localCurrency: string; usdAmount: number; text: string }[];
    };
    for (const { localAmount, localCurrency, usdAmount, text } of vectors.dualCurrency) {
      expect(fmtDualCurrency(localAmount, localCurrency, usdAmount)).toBe(text);
    }
  });
});

describe("codec blanks, duplicates, and defaults match the shared vectors", () => {
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

  it("round-trips every shared calculator url-state vector", () => {
    const vectors = mustReadJson(urlVectorsPath) as {
      calculator: { query: string; state: Record<string, unknown> }[];
    };
    for (const { query, state } of vectors.calculator) {
      expect(decodeState(new URLSearchParams(query), dataset)).toEqual(state);
      expect(encodeState(state as unknown as CalculatorState).toString()).toBe(query);
    }
  });
});
