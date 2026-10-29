// CITY + COUNTRY DATASET — tech-hub cities worldwide (excl. Israel).
//
// Values live in `libs/ayokoding-data/data/cost-of-living.json` (countries, cities,
// role matrix) and `libs/ayokoding-data/data/fx.json` (FX snapshot); provenance in
// `libs/ayokoding-data/provenance.md`. This module keeps the original path and named
// exports; the JSON files are the only declarations.
import livingJson from "../../../../../../../libs/ayokoding-data/data/cost-of-living.json";
import type { FxTable } from "./fx";
import { fx } from "./fx";

// ─── Types ──────────────────────────────────────────────────────────────────

type Confidence = "high" | "moderate" | "proxy";

type Money = {
  amount: number;
  confidence: Confidence;
  note?: string;
};

type ExpenseCategories = {
  housing: Money;
  food: Money;
  transport: Money;
  utilities: Money;
  healthcare: Money;
  childcare: Money;
  lifestyle: Money;
};

type Relocation = {
  sunkCosts: {
    deposit: Money;
    keyMoney: Money;
    moving: Money;
    visaAdmin: Money;
  };
  liquidityReserve: {
    cashCushion: Money;
  };
};

type IncomeBand = "low" | "mid" | "high";
type Area = "center" | "rural";

export type Household = {
  adults: 1 | 2;
  preschoolKids: 0 | 1 | 2 | 3;
  schoolKids: 0 | 1 | 2 | 3;
};

export type Country = {
  id: string;
  name: { en: string; id: string };
  bandThresholdsUsd: { lowToMid: number; midToHigh: number };
  effectiveRate: Record<IncomeBand, Money>;
  healthcareModelType: "oop" | "tax-funded" | "mixed";
  compulsoryInsurance: {
    health: boolean;
    socialSecurity: boolean;
    note?: string;
  };
  // Whether a FOREIGN resident worker (work-visa holder, not a citizen/PR) can enrol children in
  // PUBLIC primary school. "open" = on similar terms to locals; "limited" = legally allowed but
  // with heavy barriers (non-resident fees, local-language-only, quotas) so most expat families
  // use private/international; "nationals-only" = effectively unavailable to foreign residents.
  // When access is NOT "open" (i.e. "limited" or "nationals-only"), the calculator charges the
  // PRIVATE school figure for a foreigner even if "public" is selected — the realistic relocation
  // budget where public schooling carries non-resident fees/barriers or is barred is private.
  foreignerPublicSchool: {
    access: "open" | "limited" | "nationals-only";
    confidence: Confidence;
    note?: string;
  };
};

export type City = {
  id: string;
  name: { en: string; id: string };
  countryId: string;
  currency: string;
  region: "asean" | "japan" | "europe" | "nordics" | "americas" | "mena" | "asia" | "oceania" | "africa";
  expenses: ExpenseCategories;
  childcareMedianLocal: Money;
  schoolMedianLocal: { public: Money; private: Money };
  relocation: Relocation;
  subNational?: {
    name: { en: string; id: string };
    effectiveRate: Record<IncomeBand, Money>;
  };
};

export type Dataset = {
  snapshotDate: string;
  fx: FxTable;
  countries: Country[];
  cities: City[];
};

// ─── OECD Multiplier Helpers ─────────────────────────────────────────────────

// OECD modified equivalence scale: first adult=1.0, additional adult=+0.5, each child=+0.3.
export function equivalisedSize(h: Household): number {
  return 1.0 + 0.5 * (h.adults - 1) + 0.3 * (h.preschoolKids + h.schoolKids);
}

// Damping factor for sub-linear household categories (housing, utilities share economies of scale).
export const SUBLINEAR_DAMPING = 0.5;

// Sub-linear multiplier: housing + utilities grow slower than household size.
export const subLinear = (h: Household): number => 1 + SUBLINEAR_DAMPING * (equivalisedSize(h) - 1);

// Per-capita multiplier: food, healthcare scale with equivalised size.
export const perCapita = (h: Household): number => equivalisedSize(h);

// Area discount for housing outside city center.
export const AREA_MULTIPLIERS: Record<Area, number> = {
  center: 1.0,
  rural: 0.75,
};

// ─── Dataset (from shared JSON; fx recomposed from fx.json) ──────────────────

export const countries: Country[] = livingJson.countries as Country[];

export const cities: City[] = livingJson.cities as City[];

export const dataset: Dataset = {
  snapshotDate: livingJson.snapshotDate,
  fx,
  countries,
  cities,
};
