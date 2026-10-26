import { dataset, type City, type Country } from "@/features/cost-of-living-calculator/core/data/cities";
import { roleMatrix, type EngRole } from "@/features/cost-of-living-calculator/core/data/roles";

export type OracleHousehold = {
  adults: 1 | 2;
  preschoolKids: 0 | 1 | 2 | 3;
  schoolKids: 0 | 1 | 2 | 3;
};

export type CalculatorOracleOptions = {
  area?: "center" | "rural";
  cityIds?: readonly string[];
  household?: OracleHousehold;
  region?: City["region"];
  schoolType?: "public" | "private";
};

export type OracleCandidate = {
  cityId: string;
  role: EngRole;
  rank: number;
  essentialSavingsUsd: number;
};

export type CalculatorCandidateOracle = {
  candidates: OracleCandidate[];
  qualifying: OracleCandidate[];
  nonQualifying: OracleCandidate[];
  minimumRank: number | null;
};

const expectedUsdPerUnit: Readonly<Record<string, number>> = {
  AED: 0.27229,
  AUD: 0.69422,
  BRL: 0.1951,
  CAD: 0.7091,
  CHF: 1.21939,
  CZK: 0.047063,
  DKK: 0.15223,
  EUR: 1.1379,
  GBP: 1.32844,
  IDR: 0.000055339,
  INR: 0.010448,
  JPY: 0.0061059,
  KES: 0.007727,
  KRW: 0.0006898,
  MXN: 0.057151,
  MYR: 0.24449,
  NOK: 0.1035,
  PHP: 0.016283,
  PLN: 0.26308,
  SEK: 0.10291,
  SGD: 0.7744,
  THB: 0.029802,
  USD: 1,
  VND: 0.00003797,
};

const defaultHousehold: OracleHousehold = { adults: 1, preschoolKids: 0, schoolKids: 0 };

function rateFor(currency: string): number {
  const rate = expectedUsdPerUnit[currency];
  if (rate === undefined) throw new Error(`Missing independent USD rate for ${currency}`);
  return rate;
}

export function independentUsdPerUnit(currency: string): number {
  return rateFor(currency);
}

function countryFor(city: City): Country {
  const country = dataset.countries.find((candidate) => candidate.id === city.countryId);
  if (country === undefined) throw new Error(`Missing country fixture for city ${city.id}`);
  return country;
}

function selectedIncomeRate(grossMonthlyUsd: number, city: City, country: Country): number {
  const band =
    grossMonthlyUsd < country.bandThresholdsUsd.lowToMid
      ? "low"
      : grossMonthlyUsd < country.bandThresholdsUsd.midToHigh
        ? "mid"
        : "high";
  return country.effectiveRate[band].amount + (city.subNational?.effectiveRate[band].amount ?? 0);
}

function essentialsInUsd(
  city: City,
  household: OracleHousehold,
  area: "center" | "rural",
  schoolType: "public" | "private",
): number {
  const country = countryFor(city);
  const equivalised = 1 + 0.5 * (household.adults - 1) + 0.3 * (household.preschoolKids + household.schoolKids);
  const sublinear = 1 + 0.5 * (equivalised - 1);
  const areaFactor = area === "rural" ? 0.75 : 1;
  const actualSchoolType =
    schoolType === "public" && country.foreignerPublicSchool.access !== "open" ? "private" : schoolType;
  const localEssentials =
    city.expenses.housing.amount * sublinear * areaFactor +
    city.expenses.food.amount * equivalised +
    city.expenses.transport.amount +
    city.expenses.utilities.amount * sublinear +
    city.expenses.healthcare.amount * equivalised +
    city.childcareMedianLocal.amount * household.preschoolKids +
    city.schoolMedianLocal[actualSchoolType].amount * household.schoolKids;
  return localEssentials * rateFor(city.currency);
}

export function essentialSavingsForGross(
  cityId: string,
  grossMonthlyUsd: number,
  options: CalculatorOracleOptions = {},
): number {
  const city = dataset.cities.find((candidate) => candidate.id === cityId);
  if (city === undefined) throw new Error(`Missing city fixture ${cityId}`);
  const country = countryFor(city);
  const netUsd = grossMonthlyUsd * (1 - selectedIncomeRate(grossMonthlyUsd, city, country));
  return (
    netUsd -
    essentialsInUsd(
      city,
      options.household ?? defaultHousehold,
      options.area ?? "center",
      options.schoolType ?? "public",
    )
  );
}

export function referenceRoleSavings(cityId: string, role: EngRole, options: CalculatorOracleOptions = {}): number {
  const city = dataset.cities.find((candidate) => candidate.id === cityId);
  if (city === undefined) throw new Error(`Missing city fixture ${cityId}`);
  const salary = roleMatrix.salaries[city.countryId]?.[role];
  if (salary === undefined) throw new Error(`Missing ${role} salary fixture for ${city.countryId}`);
  const grossMonthlyUsd = salary.median.monthlyGrossLocal * rateFor(city.currency);
  return essentialSavingsForGross(cityId, grossMonthlyUsd, options);
}

export function candidateOracle(
  savingsTargetUsd: number,
  options: CalculatorOracleOptions = {},
): CalculatorCandidateOracle {
  const household = options.household ?? defaultHousehold;
  const area = options.area ?? "center";
  const schoolType = options.schoolType ?? "public";
  const candidates: OracleCandidate[] = [];

  for (const city of dataset.cities) {
    if (options.cityIds !== undefined && !options.cityIds.includes(city.id)) continue;
    if (options.region !== undefined && city.region !== options.region) continue;
    const country = countryFor(city);
    for (const role of roleMatrix.ladder) {
      const salary = roleMatrix.salaries[country.id]?.[role.role];
      if (salary === undefined) continue;
      const grossMonthlyUsd = salary.median.monthlyGrossLocal * rateFor(city.currency);
      candidates.push({
        cityId: city.id,
        role: role.role,
        rank: role.rank,
        essentialSavingsUsd: essentialSavingsForGross(city.id, grossMonthlyUsd, { area, household, schoolType }),
      });
    }
  }

  candidates.sort((left, right) => right.essentialSavingsUsd - left.essentialSavingsUsd);
  const qualifying = candidates.filter((candidate) => candidate.essentialSavingsUsd >= savingsTargetUsd);
  const nonQualifying = candidates.filter((candidate) => candidate.essentialSavingsUsd < savingsTargetUsd);
  const minimumRank = qualifying.length === 0 ? null : Math.min(...qualifying.map((candidate) => candidate.rank));
  return { candidates, qualifying, nonQualifying, minimumRank };
}
