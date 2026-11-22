// Unit tests for url-state.ts — pure encode/decode/sanitize/apply helpers.
// No React, no router. All assertions on plain objects and URLSearchParams.

import { describe, expect, it } from "vitest";
import type { Dataset } from "../../../../../src/features/cost-of-living-calculator/core/data/cities";
import {
  DEFAULT_STATE,
  decodeState,
  encodeState,
  sanitizeState,
  applyRegionChange,
  applyCountryChange,
  applyCityChange,
  parentScopeParams,
} from "../../../../../src/features/cost-of-living-calculator/core/url-state";

// ─── Minimal mock dataset ────────────────────────────────────────────────────
// Region "asean": country sg (Singapore), city singapore; country id (Indonesia), city jakarta
// Region "europe": country de (Germany), city berlin

const mockDataset: Dataset = {
  snapshotDate: "2026-06-21",
  fx: {} as Dataset["fx"],
  countries: [
    {
      id: "sg",
      foreignerPublicSchool: { access: "limited", confidence: "high" },
      name: { en: "Singapore", id: "Singapura" },
      bandThresholdsUsd: { lowToMid: 3500, midToHigh: 8000 },
      effectiveRate: {
        low: { amount: 0.04, confidence: "high" },
        mid: { amount: 0.1, confidence: "high" },
        high: { amount: 0.17, confidence: "high" },
      },
      healthcareModelType: "mixed",
      compulsoryInsurance: { health: true, socialSecurity: true },
    },
    {
      id: "id",
      foreignerPublicSchool: { access: "nationals-only", confidence: "high" },
      name: { en: "Indonesia", id: "Indonesia" },
      bandThresholdsUsd: { lowToMid: 1500, midToHigh: 5000 },
      effectiveRate: {
        low: { amount: 0.06, confidence: "moderate" },
        mid: { amount: 0.17, confidence: "moderate" },
        high: { amount: 0.3, confidence: "moderate" },
      },
      healthcareModelType: "mixed",
      compulsoryInsurance: { health: true, socialSecurity: true },
    },
    {
      id: "de",
      foreignerPublicSchool: { access: "open", confidence: "high" },
      name: { en: "Germany", id: "Jerman" },
      bandThresholdsUsd: { lowToMid: 4000, midToHigh: 9000 },
      effectiveRate: {
        low: { amount: 0.2, confidence: "high" },
        mid: { amount: 0.36, confidence: "high" },
        high: { amount: 0.48, confidence: "high" },
      },
      healthcareModelType: "mixed",
      compulsoryInsurance: { health: true, socialSecurity: true },
    },
  ],
  cities: [
    {
      id: "singapore",
      name: { en: "Singapore", id: "Singapura" },
      countryId: "sg",
      currency: "SGD",
      region: "asean",
      expenses: {
        housing: { amount: 3500, confidence: "high" },
        food: { amount: 400, confidence: "high" },
        transport: { amount: 128, confidence: "high" },
        utilities: { amount: 180, confidence: "high" },
        healthcare: { amount: 120, confidence: "moderate" },
        childcare: { amount: 1500, confidence: "high" },
        lifestyle: { amount: 250, confidence: "moderate" },
      },
      childcareMedianLocal: { amount: 1500, confidence: "high" },
      schoolMedianLocal: {
        public: { amount: 150, confidence: "high" },
        private: { amount: 3500, confidence: "moderate" },
      },
      relocation: {
        sunkCosts: {
          deposit: { amount: 7000, confidence: "moderate" },
          keyMoney: { amount: 0, confidence: "high" },
          moving: { amount: 3500, confidence: "moderate" },
          visaAdmin: { amount: 600, confidence: "moderate" },
        },
        liquidityReserve: {
          cashCushion: { amount: 15000, confidence: "moderate" },
        },
      },
    },
    {
      id: "jakarta",
      name: { en: "Jakarta", id: "Jakarta" },
      countryId: "id",
      currency: "IDR",
      region: "asean",
      expenses: {
        housing: { amount: 8000000, confidence: "high" },
        food: { amount: 3000000, confidence: "high" },
        transport: { amount: 700000, confidence: "high" },
        utilities: { amount: 1500000, confidence: "high" },
        healthcare: { amount: 500000, confidence: "moderate" },
        childcare: { amount: 4000000, confidence: "moderate" },
        lifestyle: { amount: 2000000, confidence: "moderate" },
      },
      childcareMedianLocal: { amount: 4000000, confidence: "moderate" },
      schoolMedianLocal: {
        public: { amount: 200000, confidence: "moderate" },
        private: { amount: 10000000, confidence: "moderate" },
      },
      relocation: {
        sunkCosts: {
          deposit: { amount: 16000000, confidence: "moderate" },
          keyMoney: { amount: 0, confidence: "high" },
          moving: { amount: 10000000, confidence: "moderate" },
          visaAdmin: { amount: 5000000, confidence: "moderate" },
        },
        liquidityReserve: {
          cashCushion: { amount: 30000000, confidence: "moderate" },
        },
      },
    },
    {
      id: "berlin",
      name: { en: "Berlin", id: "Berlin" },
      countryId: "de",
      currency: "EUR",
      region: "europe",
      expenses: {
        housing: { amount: 1500, confidence: "high" },
        food: { amount: 400, confidence: "high" },
        transport: { amount: 86, confidence: "high" },
        utilities: { amount: 200, confidence: "high" },
        healthcare: { amount: 30, confidence: "high" },
        childcare: { amount: 200, confidence: "high" },
        lifestyle: { amount: 250, confidence: "moderate" },
      },
      childcareMedianLocal: { amount: 200, confidence: "high" },
      schoolMedianLocal: {
        public: { amount: 0, confidence: "high" },
        private: { amount: 1500, confidence: "moderate" },
      },
      relocation: {
        sunkCosts: {
          deposit: { amount: 4500, confidence: "moderate" },
          keyMoney: { amount: 0, confidence: "high" },
          moving: { amount: 1500, confidence: "moderate" },
          visaAdmin: { amount: 500, confidence: "moderate" },
        },
        liquidityReserve: {
          cashCushion: { amount: 6000, confidence: "moderate" },
        },
      },
    },
  ],
};

// ─── 1a: encode/decode round-trip + clean URLs ───────────────────────────────

describe("1a: encode/decode round-trip and clean URLs", () => {
  it("encodeState(DEFAULT_STATE) produces empty params string", () => {
    expect(encodeState(DEFAULT_STATE).toString()).toBe("");
  });

  it("decodeState with tab=savings sets tab to savings", () => {
    expect(decodeState(new URLSearchParams("tab=savings"), mockDataset).tab).toBe("savings");
  });

  it("decodeState with empty params deep-equals DEFAULT_STATE", () => {
    expect(decodeState(new URLSearchParams(""), mockDataset)).toEqual(DEFAULT_STATE);
  });
});

// ─── 1b: numeric clamp (out-of-range → default) ─────────────────────────────

describe("1b: numeric clamp", () => {
  it("adults=4 clamps to default 1", () => {
    expect(decodeState(new URLSearchParams("adults=4"), mockDataset).household.adults).toBe(1);
  });

  it("preschool=9 clamps to default 0", () => {
    expect(decodeState(new URLSearchParams("preschool=9"), mockDataset).household.preschoolKids).toBe(0);
  });

  it("schoolkids=-1 clamps to default 0", () => {
    expect(decodeState(new URLSearchParams("schoolkids=-1"), mockDataset).household.schoolKids).toBe(0);
  });
});

// ─── 1c: enum/id validity (drop unknown) ────────────────────────────────────

describe("1c: enum/id validity", () => {
  it("unknown cityId is dropped to null", () => {
    expect(decodeState(new URLSearchParams("city=atlantis"), mockDataset).cityId).toBeNull();
  });

  it("full country name is rejected (not a valid ID)", () => {
    expect(decodeState(new URLSearchParams("country=Indonesia"), mockDataset).countryId).toBeNull();
  });

  it("unknown region is dropped to null", () => {
    expect(decodeState(new URLSearchParams("region=mars"), mockDataset).region).toBeNull();
  });

  it("unknown schooltype falls back to default public", () => {
    expect(decodeState(new URLSearchParams("schooltype=montessori"), mockDataset).schoolType).toBe("public");
  });
});

// ─── 1d: backfill (selecting narrower fills broader) ────────────────────────

describe("1d: backfill", () => {
  it("applyCityChange backfills countryId and region from city", () => {
    const result = applyCityChange(DEFAULT_STATE, "singapore", mockDataset);
    expect(result.cityId).toBe("singapore");
    expect(result.countryId).toBe("sg");
    expect(result.region).toBe("asean");
  });

  it("applyCountryChange backfills region and leaves cityId null", () => {
    const result = applyCountryChange(DEFAULT_STATE, "id", mockDataset);
    expect(result.countryId).toBe("id");
    expect(result.region).toBe("asean");
    expect(result.cityId).toBeNull();
  });
});

// ─── 1e: cascade-clear (broader clears narrower) ────────────────────────────

describe("1e: cascade-clear", () => {
  const stateWithSingapore = {
    ...DEFAULT_STATE,
    cityId: "singapore" as string | null,
    countryId: "sg" as string | null,
    region: "asean" as "asean" | "europe" | null,
  };

  it("applyRegionChange to different region clears city and country", () => {
    const result = applyRegionChange(stateWithSingapore, "europe", mockDataset);
    expect(result.region).toBe("europe");
    expect(result.countryId).toBeNull();
    expect(result.cityId).toBeNull();
  });

  it("applyRegionChange to same region keeps city and country", () => {
    const result = applyRegionChange(stateWithSingapore, "asean", mockDataset);
    expect(result.region).toBe("asean");
    expect(result.countryId).toBe("sg");
    expect(result.cityId).toBe("singapore");
  });
});

// ─── 1f: sanitize + canonicalize (narrower-wins conflict, idempotent) ────────

describe("1f: sanitize and canonicalize", () => {
  it("narrower wins: city trumps region — city=singapore with region=europe → asean", () => {
    const result = decodeState(new URLSearchParams("region=europe&city=singapore"), mockDataset);
    expect(result.cityId).toBe("singapore");
    expect(result.countryId).toBe("sg");
    expect(result.region).toBe("asean");
  });

  it("sanitizeState is idempotent", () => {
    const state = decodeState(new URLSearchParams("tab=savings&city=singapore"), mockDataset);
    expect(sanitizeState(sanitizeState(state, mockDataset), mockDataset)).toEqual(sanitizeState(state, mockDataset));
  });
});

// ─── 1g: parent scope for the back link ─────────────────────────────────────

describe("1g: parentScopeParams", () => {
  it("includes region and country but not city", () => {
    const state = {
      ...DEFAULT_STATE,
      cityId: "singapore" as string | null,
      countryId: "sg" as string | null,
      region: "asean" as "asean" | "europe" | null,
    };
    const params = parentScopeParams(state);
    const str = params.toString();
    expect(str).toContain("region=asean");
    expect(str).toContain("country=sg");
    expect(str).not.toContain("city=");
  });

  it("produces empty string when state has all defaults (no region, no country)", () => {
    const params = parentScopeParams(DEFAULT_STATE);
    expect(params.toString()).toBe("");
  });
});

// ─── Additional branch coverage ───────────────────────────────────────────────

describe("branch coverage: applyCityChange edge cases", () => {
  it("applyCityChange with null cityId returns state with cityId null", () => {
    const stateWithCity = {
      ...DEFAULT_STATE,
      cityId: "singapore" as string | null,
      countryId: "sg" as string | null,
      region: "asean" as const,
    };
    const result = applyCityChange(stateWithCity, null, mockDataset);
    expect(result.cityId).toBeNull();
    expect(result.countryId).toBe("sg");
  });

  it("applyCityChange with invalid cityId returns state with cityId null", () => {
    const result = applyCityChange(DEFAULT_STATE, "atlantis", mockDataset);
    expect(result.cityId).toBeNull();
  });
});

describe("branch coverage: applyCountryChange edge cases", () => {
  it("applyCountryChange with null clears countryId and cityId", () => {
    const stateWithCountry = {
      ...DEFAULT_STATE,
      cityId: "singapore" as string | null,
      countryId: "sg" as string | null,
      region: "asean" as const,
    };
    const result = applyCountryChange(stateWithCountry, null, mockDataset);
    expect(result.countryId).toBeNull();
    expect(result.cityId).toBeNull();
  });

  it("applyCountryChange keeps city when city belongs to new country", () => {
    const stateWithCity = {
      ...DEFAULT_STATE,
      cityId: "singapore" as string | null,
      countryId: "sg" as string | null,
      region: "asean" as const,
    };
    const result = applyCountryChange(stateWithCity, "sg", mockDataset);
    expect(result.countryId).toBe("sg");
    expect(result.cityId).toBe("singapore");
  });

  it("applyCountryChange clears city when city belongs to different country", () => {
    const stateWithSingapore = {
      ...DEFAULT_STATE,
      cityId: "singapore" as string | null,
      countryId: "sg" as string | null,
      region: "asean" as const,
    };
    const result = applyCountryChange(stateWithSingapore, "id", mockDataset);
    expect(result.countryId).toBe("id");
    expect(result.cityId).toBeNull();
    expect(result.region).toBe("asean");
  });
});

describe("branch coverage: applyRegionChange edge cases", () => {
  it("applyRegionChange with null clears all geo", () => {
    const stateWithSingapore = {
      ...DEFAULT_STATE,
      cityId: "singapore" as string | null,
      countryId: "sg" as string | null,
      region: "asean" as const,
    };
    const result = applyRegionChange(stateWithSingapore, null, mockDataset);
    expect(result.region).toBeNull();
    expect(result.countryId).toBeNull();
    expect(result.cityId).toBeNull();
  });

  it("applyRegionChange keeps country when country is in new region but clears city from other region", () => {
    // State: has country=sg (asean) but no city
    const stateWithCountryOnly = {
      ...DEFAULT_STATE,
      countryId: "sg" as string | null,
      region: "asean" as const,
    };
    // Change to same region — country sg is still in asean
    const result = applyRegionChange(stateWithCountryOnly, "asean", mockDataset);
    expect(result.region).toBe("asean");
    expect(result.countryId).toBe("sg");
    expect(result.cityId).toBeNull();
  });

  it("applyRegionChange clears country when country is NOT in new region (no city)", () => {
    const stateWithSgCountry = {
      ...DEFAULT_STATE,
      countryId: "sg" as string | null,
      region: "asean" as const,
    };
    const result = applyRegionChange(stateWithSgCountry, "europe", mockDataset);
    expect(result.region).toBe("europe");
    expect(result.countryId).toBeNull();
    expect(result.cityId).toBeNull();
  });
});

describe("branch coverage: encodeState non-defaults", () => {
  it("encodeState encodes all non-default values", () => {
    const state = applyCityChange(
      {
        ...DEFAULT_STATE,
        tab: "savings" as const,
        household: { adults: 2, preschoolKids: 1, schoolKids: 2 },
        schoolType: "private" as const,
        area: "rural" as const,
      },
      "singapore",
      mockDataset,
    );
    const params = encodeState(state);
    expect(params.get("tab")).toBe("savings");
    expect(params.get("adults")).toBe("2");
    expect(params.get("preschool")).toBe("1");
    expect(params.get("schoolkids")).toBe("2");
    expect(params.get("schooltype")).toBe("private");
    expect(params.get("area")).toBe("rural");
    expect(params.get("region")).toBe("asean");
    expect(params.get("country")).toBe("sg");
    expect(params.get("city")).toBe("singapore");
  });

  it("encodeState encodes non-default min-role targetCurrency, refRole, and myGrossCurrency independently", () => {
    const state = {
      ...DEFAULT_STATE,
      minRole: {
        ...DEFAULT_STATE.minRole,
        targetCurrency: "IDR",
        refRole: "staff_swe",
        myGrossCurrency: "usd" as const,
      },
    };
    const params = encodeState(state);
    expect(params.get("targetcur")).toBe("IDR");
    expect(params.get("refrole")).toBe("staff_swe");
    expect(params.get("mygrosscur")).toBe("usd");
  });
});

describe("branch coverage: sanitizeState with invalid fields", () => {
  it("sanitizeState coerces unknown tab to default", () => {
    const badState = { ...DEFAULT_STATE, tab: "unknown" as CalculatorState["tab"] };
    const result = sanitizeState(badState, mockDataset);
    expect(result.tab).toBe("cost");
  });

  it("sanitizeState coerces unknown schoolType to default", () => {
    const badState = { ...DEFAULT_STATE, schoolType: "montessori" as CalculatorState["schoolType"] };
    const result = sanitizeState(badState, mockDataset);
    expect(result.schoolType).toBe("public");
  });

  it("sanitizeState coerces unknown area to default", () => {
    const badState = { ...DEFAULT_STATE, area: "suburban" as CalculatorState["area"] };
    const result = sanitizeState(badState, mockDataset);
    expect(result.area).toBe("center");
  });

  it("sanitizeState coerces invalid adults to default", () => {
    const badState = {
      ...DEFAULT_STATE,
      household: { ...DEFAULT_STATE.household, adults: 5 as CalculatorState["household"]["adults"] },
    };
    const result = sanitizeState(badState, mockDataset);
    expect(result.household.adults).toBe(1);
  });

  it("sanitizeState coerces invalid preschoolKids to default", () => {
    const badState = {
      ...DEFAULT_STATE,
      household: {
        ...DEFAULT_STATE.household,
        preschoolKids: 9 as CalculatorState["household"]["preschoolKids"],
      },
    };
    const result = sanitizeState(badState, mockDataset);
    expect(result.household.preschoolKids).toBe(0);
  });

  it("sanitizeState coerces invalid schoolKids to default", () => {
    const badState = {
      ...DEFAULT_STATE,
      household: {
        ...DEFAULT_STATE.household,
        schoolKids: 9 as CalculatorState["household"]["schoolKids"],
      },
    };
    const result = sanitizeState(badState, mockDataset);
    expect(result.household.schoolKids).toBe(0);
  });

  it("sanitizeState clears an unknown cityId and falls back to the country", () => {
    const badState = { ...DEFAULT_STATE, cityId: "nope", countryId: "de", region: null };
    const result = sanitizeState(badState, mockDataset);
    expect(result.cityId).toBeNull();
    expect(result.countryId).toBe("de");
    expect(result.region).toBe("europe");
  });

  it("decodeState falls back to the country when the city param names nothing", () => {
    const result = decodeState(new URLSearchParams("city=nope&country=de"), mockDataset);
    expect(result.cityId).toBeNull();
    expect(result.countryId).toBe("de");
    expect(result.region).toBe("europe");
  });

  it("sanitizeState clears a countryId whose dataset entry has no cities to infer a region from", () => {
    // A country that exists in `dataset.countries` but backs zero cities in `dataset.cities` is a
    // valid `parseCountryId` result that still cannot resolve a region — `reconcileGeo`'s
    // "country is authoritative" branch never matches, so it falls through to clearing `countryId`.
    const datasetWithOrphanCountry: Dataset = {
      ...mockDataset,
      countries: [...mockDataset.countries, { ...mockDataset.countries[0]!, id: "fr" }],
    };
    const badState = { ...DEFAULT_STATE, cityId: null, countryId: "fr", region: null };
    const result = sanitizeState(badState, datasetWithOrphanCountry);
    expect(result.countryId).toBeNull();
    expect(result.region).toBeNull();
  });
});

describe("branch coverage: decodeState additional paths", () => {
  it("decodeState with valid adults=2 sets adults to 2", () => {
    expect(decodeState(new URLSearchParams("adults=2"), mockDataset).household.adults).toBe(2);
  });

  it("decodeState with valid preschool=2 sets preschoolKids to 2", () => {
    expect(decodeState(new URLSearchParams("preschool=2"), mockDataset).household.preschoolKids).toBe(2);
  });

  it("decodeState with valid schoolkids=3 sets schoolKids to 3", () => {
    expect(decodeState(new URLSearchParams("schoolkids=3"), mockDataset).household.schoolKids).toBe(3);
  });

  it("decodeState with valid country=sg sets countryId and backfills region", () => {
    const result = decodeState(new URLSearchParams("country=sg"), mockDataset);
    expect(result.countryId).toBe("sg");
    expect(result.region).toBe("asean");
  });

  it("decodeState with valid city=berlin sets all geo from city", () => {
    const result = decodeState(new URLSearchParams("city=berlin"), mockDataset);
    expect(result.cityId).toBe("berlin");
    expect(result.countryId).toBe("de");
    expect(result.region).toBe("europe");
  });

  it("decodeState tab=min-role sets tab to min-role", () => {
    expect(decodeState(new URLSearchParams("tab=min-role"), mockDataset).tab).toBe("min-role");
  });

  it("decodeState schooltype=private sets schoolType to private", () => {
    expect(decodeState(new URLSearchParams("schooltype=private"), mockDataset).schoolType).toBe("private");
  });

  it("decodeState area=rural sets area to rural", () => {
    expect(decodeState(new URLSearchParams("area=rural"), mockDataset).area).toBe("rural");
  });
});

// ─── Type import for use in sanitizeState tests ───────────────────────────────
type CalculatorState = ReturnType<typeof decodeState>;
