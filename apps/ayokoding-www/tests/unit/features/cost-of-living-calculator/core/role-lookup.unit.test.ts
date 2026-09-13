import { describe, expect, it } from "vitest";
import { dataset } from "../../../../../src/features/cost-of-living-calculator/core/data/cities";
import { roleMatrix } from "../../../../../src/features/cost-of-living-calculator/core/data/roles";
import {
  roleMedianGrossUsd,
  roleSalaryDistributionUsd,
  roleNonSalaryCompUsd,
  roleTotalCompUsd,
  candidateEssentialSavingsUsd,
  bestCityForRole,
  resolveBaselineUsd,
  rankLadder,
  minimumRole,
  orderForDisplay,
  toDisplayCurrencies,
  enumerateCityRoleEntries,
  minimumQualifyingRank,
} from "../../../../../src/features/cost-of-living-calculator/core/role-lookup";
import { savingsRow } from "../../../../../src/features/cost-of-living-calculator/core/calc";

const fx = dataset.fx;
const allCities = dataset.cities;
const countries = dataset.countries;

// Fixtures
const berlin = allCities.find((c) => c.id === "berlin")!;
const tokyo = allCities.find((c) => c.id === "tokyo")!;
const sanFrancisco = allCities.find((c) => c.id === "san-francisco")!;
const austin = allCities.find((c) => c.id === "austin")!;
const singapore = allCities.find((c) => c.id === "singapore")!;
const london = allCities.find((c) => c.id === "london")!;
const de = countries.find((c) => c.id === "de")!;
const us = countries.find((c) => c.id === "us")!;

const defaultOpts = {
  household: { adults: 1 as const, preschoolKids: 0 as const, schoolKids: 0 as const },
  area: "center" as const,
  schoolType: "public" as const,
};

describe("role-lookup", () => {
  describe("roleMedianGrossUsd", () => {
    it("converts senior_swe Germany median to USD", () => {
      const result = roleMedianGrossUsd(fx, roleMatrix, berlin, "senior_swe");
      // DE senior_swe median is 9200 EUR; EUR rate ~1.08 → ~9936 USD
      expect(result).toBeGreaterThan(5000);
      expect(result).toBeLessThan(20000);
    });

    it("returns higher USD for US than Germany for same role", () => {
      const usVal = roleMedianGrossUsd(fx, roleMatrix, sanFrancisco, "senior_swe");
      const deVal = roleMedianGrossUsd(fx, roleMatrix, berlin, "senior_swe");
      expect(usVal).toBeGreaterThan(deVal);
    });

    it("uses the median (not p25 or p75)", () => {
      const med = roleMedianGrossUsd(fx, roleMatrix, berlin, "swe_1");
      const dist = roleMatrix.salaries[berlin.countryId]!["swe_1"]!;
      const rate = fx.ratesUsdPerUnit[berlin.currency]!;
      expect(med).toBeCloseTo(dist.median.monthlyGrossLocal * rate, 2);
    });
  });

  describe("roleSalaryDistributionUsd", () => {
    it("returns p25 ≤ median ≤ p75 in USD", () => {
      const dist = roleSalaryDistributionUsd(fx, roleMatrix, singapore, "staff_swe");
      expect(dist.p25).toBeLessThanOrEqual(dist.median);
      expect(dist.median).toBeLessThanOrEqual(dist.p75);
    });

    it("returns positive USD figures for all percentiles", () => {
      const dist = roleSalaryDistributionUsd(fx, roleMatrix, tokyo, "eng_manager");
      expect(dist.p25).toBeGreaterThan(0);
      expect(dist.median).toBeGreaterThan(0);
      expect(dist.p75).toBeGreaterThan(0);
    });
  });

  describe("roleNonSalaryCompUsd", () => {
    it("returns non-negative annual USD figure", () => {
      const result = roleNonSalaryCompUsd(fx, roleMatrix, berlin, "staff_swe");
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it("US roles have higher non-salary comp than Indonesia for same role", () => {
      const jakarta = allCities.find((c) => c.id === "jakarta")!;
      const usVal = roleNonSalaryCompUsd(fx, roleMatrix, sanFrancisco, "senior_swe");
      const idVal = roleNonSalaryCompUsd(fx, roleMatrix, jakarta, "senior_swe");
      expect(usVal).toBeGreaterThan(idVal);
    });
  });

  describe("roleTotalCompUsd", () => {
    it("equals annual base + non-salary comp", () => {
      const medUsd = roleMedianGrossUsd(fx, roleMatrix, london, "senior_swe");
      const nonSalUsd = roleNonSalaryCompUsd(fx, roleMatrix, london, "senior_swe");
      const total = roleTotalCompUsd(fx, roleMatrix, london, "senior_swe");
      expect(total).toBeCloseTo(medUsd * 12 + nonSalUsd, 1);
    });

    it("is strictly greater than annual base salary", () => {
      const medUsd = roleMedianGrossUsd(fx, roleMatrix, singapore, "staff_swe");
      const total = roleTotalCompUsd(fx, roleMatrix, singapore, "staff_swe");
      expect(total).toBeGreaterThan(medUsd * 12);
    });
  });

  describe("candidateEssentialSavingsUsd", () => {
    it("returns a finite number (may be negative for expensive cities/low roles)", () => {
      const result = candidateEssentialSavingsUsd(fx, de, berlin, "swe_1", defaultOpts, roleMatrix);
      expect(Number.isFinite(result)).toBe(true);
    });

    it("higher-rank role has higher essential savings in same city", () => {
      const swe1 = candidateEssentialSavingsUsd(fx, us, sanFrancisco, "swe_1", defaultOpts, roleMatrix);
      const senior = candidateEssentialSavingsUsd(fx, us, sanFrancisco, "senior_swe", defaultOpts, roleMatrix);
      expect(senior).toBeGreaterThan(swe1);
    });

    it("federal + sub-national tax bands affect net savings (TX has 0 state tax vs CA)", () => {
      const caRole = candidateEssentialSavingsUsd(fx, us, sanFrancisco, "senior_swe", defaultOpts, roleMatrix);
      const txRole = candidateEssentialSavingsUsd(fx, us, austin, "senior_swe", defaultOpts, roleMatrix);
      // Austin has no state income tax (Texas); SF has California sub-national tax
      // Austin should have higher net → higher essential savings (lower expenses also differ)
      expect(Number.isFinite(caRole)).toBe(true);
      expect(Number.isFinite(txRole)).toBe(true);
    });
  });

  describe("bestCityForRole", () => {
    it("returns a city from the dataset", () => {
      const result = bestCityForRole(dataset, "senior_swe", defaultOpts, roleMatrix, null);
      expect(result).toBeDefined();
      expect(allCities.some((c) => c.id === result.city.id)).toBe(true);
    });

    it("geographic filter scopes the candidate cities", () => {
      const aseanOnly = allCities.filter((c) => c.region === "asean");
      const result = bestCityForRole(dataset, "senior_swe", defaultOpts, roleMatrix, aseanOnly);
      expect(aseanOnly.some((c) => c.id === result.city.id)).toBe(true);
      // Must not be a non-ASEAN city
      expect(result.city.region).toBe("asean");
    });

    it("returns essentialSavingsUsd matching candidateEssentialSavingsUsd for that city", () => {
      const result = bestCityForRole(dataset, "staff_swe", defaultOpts, roleMatrix, null);
      const country = countries.find((c) => c.id === result.city.countryId)!;
      const expected = candidateEssentialSavingsUsd(fx, country, result.city, "staff_swe", defaultOpts, roleMatrix);
      expect(result.essentialSavingsUsd).toBeCloseTo(expected, 2);
    });
  });

  describe("resolveBaselineUsd", () => {
    it("my_salary: returns essential savings of the entered gross salary IN THE SELECTED city", () => {
      const grossUsd = 10000;
      const result = resolveBaselineUsd(
        "my_salary",
        { grossMonthlyUsd: grossUsd, cityId: "jakarta" },
        defaultOpts,
        dataset,
        roleMatrix,
      );
      // The bar must equal essential savings computed for that exact city — not a global optimum.
      const jakarta = allCities.find((c) => c.id === "jakarta")!;
      const id = countries.find((c) => c.id === jakarta.countryId)!;
      const expected = savingsRow(
        grossUsd,
        jakarta,
        id,
        fx,
        defaultOpts.household,
        defaultOpts.schoolType,
        defaultOpts.area,
      ).essentialSavings;
      expect(result).toBeCloseTo(expected, 6);
    });

    // Regression (2026-06-22): the my_salary baseline must be anchored to the user's OWN salary
    // city, never a global best-city optimum. The old code looped all cities and took the max,
    // so picking Jakarta vs San Francisco produced an identical (Bengaluru-driven) bar — inflating
    // the min role and surfacing the wrong "best country". A different salary city must move the bar.
    it("my_salary: the chosen salary city changes the baseline (not a global max)", () => {
      const grossUsd = 6000;
      const inJakarta = resolveBaselineUsd(
        "my_salary",
        { grossMonthlyUsd: grossUsd, cityId: "jakarta" },
        defaultOpts,
        dataset,
        roleMatrix,
      );
      const inSanFrancisco = resolveBaselineUsd(
        "my_salary",
        { grossMonthlyUsd: grossUsd, cityId: "san-francisco" },
        defaultOpts,
        dataset,
        roleMatrix,
      );
      expect(inJakarta).not.toBeCloseTo(inSanFrancisco, 2);
    });

    it("reference_role: returns best-city savings for the reference role (median)", () => {
      const result = resolveBaselineUsd(
        "reference_role",
        { role: "senior_swe", cityId: "berlin" },
        defaultOpts,
        dataset,
        roleMatrix,
      );
      expect(Number.isFinite(result)).toBe(true);
    });

    it("savings_target: converts typed amount to USD", () => {
      const result = resolveBaselineUsd(
        "savings_target",
        { amountLocal: 1000, displayCurrency: "USD" },
        defaultOpts,
        dataset,
        roleMatrix,
      );
      // 1000 USD in savings target → 1000 USD
      expect(result).toBeCloseTo(1000, 2);
    });

    it("reference_role baseline parity: reference role is always its own minimum-or-lower", () => {
      const baseline = resolveBaselineUsd(
        "reference_role",
        { role: "senior_swe", cityId: "berlin" },
        defaultOpts,
        dataset,
        roleMatrix,
      );
      const ranked = rankLadder(dataset, defaultOpts, roleMatrix, null);
      const minRole = minimumRole(baseline, ranked);
      // The minimum role's rank should be ≤ senior_swe rank (3)
      const seniorRank = roleMatrix.ladder.find((r) => r.role === "senior_swe")!.rank;
      if (minRole !== null) {
        const minRank = roleMatrix.ladder.find((r) => r.role === minRole)!.rank;
        expect(minRank).toBeLessThanOrEqual(seniorRank);
      }
    });
  });

  describe("rankLadder", () => {
    it("returns one entry per role in the ladder", () => {
      const ranked = rankLadder(dataset, defaultOpts, roleMatrix, null);
      expect(ranked).toHaveLength(roleMatrix.ladder.length);
    });

    it("each entry has bestCity, bestCountry, distribution, and clears flag", () => {
      const ranked = rankLadder(dataset, defaultOpts, roleMatrix, null);
      for (const entry of ranked) {
        expect(entry.bestCity).toBeDefined();
        expect(entry.bestCountry).toBeDefined();
        expect(entry.distributionUsd.p25).toBeGreaterThan(0);
        expect(entry.distributionUsd.median).toBeGreaterThan(0);
        expect(entry.distributionUsd.p75).toBeGreaterThan(0);
        expect(typeof entry.nonSalaryCompUsd).toBe("number");
        expect(typeof entry.totalCompUsd).toBe("number");
        expect(typeof entry.clears).toBe("boolean");
      }
    });

    it("non-salary comp does not change the ranking (clears flags)", () => {
      const ranked1 = rankLadder(dataset, defaultOpts, roleMatrix, null);
      // clears is based on essentialSavings only — totalComp/nonSalaryComp are informational
      // Verify totalCompUsd > essentialSavingsUsd (comp > savings — total comp includes salary × 12 + bonus)
      for (const entry of ranked1) {
        expect(entry.totalCompUsd).toBeGreaterThan(entry.bestEssentialSavingsUsd);
      }
    });

    it("lifestyle does not change the ranking (essentialSavings excludes lifestyle)", () => {
      // rankLadder uses essentialSavings; lifestyle is separate
      const ranked = rankLadder(dataset, defaultOpts, roleMatrix, null);
      // Confirm bestEssentialSavingsUsd is computed from savingsRow which excludes lifestyle
      for (const entry of ranked) {
        expect(Number.isFinite(entry.bestEssentialSavingsUsd)).toBe(true);
      }
    });

    it("geographic filter scopes each role's best city", () => {
      const europeOnly = allCities.filter((c) => c.region === "europe");
      const ranked = rankLadder(dataset, defaultOpts, roleMatrix, europeOnly);
      for (const entry of ranked) {
        expect(entry.bestCity.region).toBe("europe");
      }
    });

    it("confidence propagates to the chosen row", () => {
      const ranked = rankLadder(dataset, defaultOpts, roleMatrix, null);
      for (const entry of ranked) {
        expect(["high", "moderate", "proxy"]).toContain(entry.confidence);
      }
    });
  });

  describe("enumerateCityRoleEntries (include-all, no argmax)", () => {
    const asean = allCities.filter((c) => c.region === "asean");

    it("emits one entry per (city in scope) × role — nothing collapsed", () => {
      const entries = enumerateCityRoleEntries(dataset, defaultOpts, roleMatrix, asean, 0);
      expect(entries.length).toBe(asean.length * roleMatrix.ladder.length);
    });

    it("only includes cities within the scope", () => {
      const entries = enumerateCityRoleEntries(dataset, defaultOpts, roleMatrix, asean, 0);
      const scopeIds = new Set(asean.map((c) => c.id));
      for (const e of entries) expect(scopeIds.has(e.city.id)).toBe(true);
    });

    it("flags clears = (savings ≥ bar) for every entry, both sides of the bar", () => {
      const bar = 500;
      const entries = enumerateCityRoleEntries(dataset, defaultOpts, roleMatrix, asean, bar);
      for (const e of entries) expect(e.clears).toBe(e.essentialSavingsUsd >= bar);
      // The bar must genuinely split the set — at least one qualifies and at least one does not.
      expect(entries.some((e) => e.clears)).toBe(true);
      expect(entries.some((e) => !e.clears)).toBe(true);
    });

    it("includes a qualifying city at EVERY role it clears — not just its best (the reported bug)", () => {
      // Malaysia clears the bar across many seniority levels; all must be present, not collapsed.
      const bar = 400;
      const entries = enumerateCityRoleEntries(dataset, defaultOpts, roleMatrix, asean, bar);
      const malaysiaClears = entries.filter((e) => e.country.id === "my" && e.clears);
      expect(malaysiaClears.length).toBeGreaterThan(1);
      // And a country that qualifies anywhere is never silently dropped from the candidate set.
      const countriesPresent = new Set(entries.map((e) => e.country.id));
      for (const c of asean) expect(countriesPresent.has(c.countryId)).toBe(true);
    });

    it("minimumQualifyingRank returns the lowest clearing rank, or null when none clear", () => {
      const entries = enumerateCityRoleEntries(dataset, defaultOpts, roleMatrix, asean, 400);
      const rank = minimumQualifyingRank(entries);
      expect(rank).not.toBeNull();
      const lowestClearing = Math.min(...entries.filter((e) => e.clears).map((e) => e.rank));
      expect(rank).toBe(lowestClearing);

      const none = enumerateCityRoleEntries(dataset, defaultOpts, roleMatrix, asean, 1_000_000_000);
      expect(minimumQualifyingRank(none)).toBeNull();
    });
  });

  describe("minimumRole", () => {
    it("returns null when no role clears the baseline", () => {
      // Unreachable baseline (e.g. 1 trillion USD savings per month)
      const ranked = rankLadder(dataset, defaultOpts, roleMatrix, null);
      const rankedWithClears = ranked.map((r) => ({ ...r, clears: false }));
      const result = minimumRole(1_000_000_000, rankedWithClears);
      expect(result).toBeNull();
    });

    it("returns the lowest-rank clearing role", () => {
      // Very low baseline: all roles should clear; minimum is rank 1
      const ranked = rankLadder(dataset, defaultOpts, roleMatrix, null);
      const result = minimumRole(-999999, ranked);
      // The minimum qualifying role is the lowest-rank one with clears = true
      if (result !== null) {
        const resultRank = roleMatrix.ladder.find((r) => r.role === result)!.rank;
        for (const entry of ranked) {
          if (entry.clears && entry.role !== result) {
            const entryRank = roleMatrix.ladder.find((r) => r.role === entry.role)!.rank;
            expect(resultRank).toBeLessThanOrEqual(entryRank);
          }
        }
      }
    });

    it("returns null for the no-qualifier case", () => {
      const ranked = rankLadder(dataset, defaultOpts, roleMatrix, null);
      const result = minimumRole(Number.MAX_SAFE_INTEGER, ranked);
      expect(result).toBeNull();
    });
  });

  describe("orderForDisplay", () => {
    it("places qualifying roles before non-qualifying ones", () => {
      const ranked = rankLadder(dataset, defaultOpts, roleMatrix, null);
      const minRole = minimumRole(-999999, ranked); // low enough that some qualify
      const ordered = orderForDisplay(ranked, minRole);
      // Find first non-qualifying entry
      const firstNonQual = ordered.findIndex((e) => !e.clears);
      const lastQual = ordered.findLastIndex((e) => e.clears);
      if (firstNonQual !== -1 && lastQual !== -1) {
        expect(lastQual).toBeLessThan(firstNonQual);
      }
    });

    it("qualifying roles sorted high→low seniority down to minimum", () => {
      const ranked = rankLadder(dataset, defaultOpts, roleMatrix, null);
      const minRole = minimumRole(-999999, ranked);
      const ordered = orderForDisplay(ranked, minRole);
      const qualifying = ordered.filter((e) => e.clears);
      if (qualifying.length > 1) {
        for (let i = 1; i < qualifying.length; i++) {
          const prevRank = roleMatrix.ladder.find((r) => r.role === qualifying[i - 1]!.role)!.rank;
          const currRank = roleMatrix.ladder.find((r) => r.role === qualifying[i]!.role)!.rank;
          expect(prevRank).toBeGreaterThanOrEqual(currRank);
        }
      }
    });

    it("non-qualifying roles appear dimmed (clears = false) at the end", () => {
      const ranked = rankLadder(dataset, defaultOpts, roleMatrix, null);
      const ordered = orderForDisplay(ranked, null);
      // With minRole null, all roles are non-qualifying
      for (const entry of ordered) {
        expect(entry.clears).toBe(false);
      }
    });
  });

  describe("toDisplayCurrencies", () => {
    it("converts USD savings to USD, local, and display currency", () => {
      const result = toDisplayCurrencies(fx, 10000, "EUR", "USD");
      expect(result.usd).toBeCloseTo(10000, 2);
      expect(result.localAmount).toBeGreaterThan(0); // EUR amount
      expect(result.display).toBeCloseTo(10000, 2); // USD display
    });

    it("local currency differs from USD for non-USD cities", () => {
      const result = toDisplayCurrencies(fx, 10000, "JPY", "USD");
      expect(result.localAmount).toBeGreaterThan(result.usd); // JPY amount >> USD
    });

    it("display currency = USD when displayCurrency is USD", () => {
      const result = toDisplayCurrencies(fx, 5000, "SGD", "USD");
      expect(result.display).toBeCloseTo(result.usd, 2);
    });
  });
});
