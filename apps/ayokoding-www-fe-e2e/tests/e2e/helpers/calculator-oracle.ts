import {
  dataset,
  type City,
  type Country,
} from "../../../../ayokoding-www/src/features/cost-of-living-calculator/core/data/cities";
import {
  roleMatrix,
  type EngRole,
} from "../../../../ayokoding-www/src/features/cost-of-living-calculator/core/data/roles";

export { dataset as rawCalculatorDataset };

type Household = { adults: 1 | 2; preschoolKids: 0 | 1 | 2 | 3; schoolKids: 0 | 1 | 2 | 3 };
type Options = {
  area?: "center" | "rural";
  cityIds?: readonly string[];
  household?: Household;
  region?: City["region"];
  schoolType?: "public" | "private";
};
type Candidate = { cityId: string; role: EngRole; rank: number; essentialSavingsUsd: number };

const USD_PER_UNIT: Readonly<Record<string, number>> = {
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
const SINGLE: Household = { adults: 1, preschoolKids: 0, schoolKids: 0 };

function countryFor(city: City): Country {
  const country = dataset.countries.find((item) => item.id === city.countryId);
  if (!country) throw new Error(`Missing raw country fixture for ${city.id}`);
  return country;
}

function localRate(currency: string): number {
  const rate = USD_PER_UNIT[currency];
  if (rate === undefined) throw new Error(`Missing independently pinned rate for ${currency}`);
  return rate;
}

function essentialsUsd(
  city: City,
  household: Household,
  area: "center" | "rural",
  schoolType: "public" | "private",
): number {
  const country = countryFor(city);
  const people = 1 + 0.5 * (household.adults - 1) + 0.3 * (household.preschoolKids + household.schoolKids);
  const householdFactor = 1 + 0.5 * (people - 1);
  const actualSchoolType =
    schoolType === "public" && country.foreignerPublicSchool.access !== "open" ? "private" : schoolType;
  const local =
    city.expenses.housing.amount * householdFactor * (area === "rural" ? 0.75 : 1) +
    city.expenses.food.amount * people +
    city.expenses.transport.amount +
    city.expenses.utilities.amount * householdFactor +
    city.expenses.healthcare.amount * people +
    city.childcareMedianLocal.amount * household.preschoolKids +
    city.schoolMedianLocal[actualSchoolType].amount * household.schoolKids;
  return local * localRate(city.currency);
}

function afterEssentials(city: City, role: EngRole, options: Options): number {
  const country = countryFor(city);
  const distribution = roleMatrix.salaries[country.id]?.[role];
  if (!distribution) throw new Error(`Missing raw ${role} distribution for ${country.id}`);
  const grossUsd = distribution.median.monthlyGrossLocal * localRate(city.currency);
  const rate =
    grossUsd < country.bandThresholdsUsd.lowToMid
      ? country.effectiveRate.low.amount
      : grossUsd < country.bandThresholdsUsd.midToHigh
        ? country.effectiveRate.mid.amount
        : country.effectiveRate.high.amount;
  const subnational = city.subNational?.effectiveRate;
  const localTax =
    subnational === undefined
      ? 0
      : grossUsd < country.bandThresholdsUsd.lowToMid
        ? subnational.low.amount
        : grossUsd < country.bandThresholdsUsd.midToHigh
          ? subnational.mid.amount
          : subnational.high.amount;
  return (
    grossUsd * (1 - rate - localTax) -
    essentialsUsd(city, options.household ?? SINGLE, options.area ?? "center", options.schoolType ?? "public")
  );
}

export function independentCandidates(
  targetUsd: number,
  options: Options = {},
): {
  candidates: Candidate[];
  qualifying: Candidate[];
  nonQualifying: Candidate[];
  minimumRank: number | null;
} {
  const candidates: Candidate[] = [];
  for (const city of dataset.cities) {
    if (options.cityIds !== undefined && !options.cityIds.includes(city.id)) continue;
    if (options.region !== undefined && city.region !== options.region) continue;
    for (const item of roleMatrix.ladder) {
      if (!roleMatrix.salaries[city.countryId]?.[item.role]) continue;
      candidates.push({
        cityId: city.id,
        role: item.role,
        rank: item.rank,
        essentialSavingsUsd: afterEssentials(city, item.role, options),
      });
    }
  }
  candidates.sort((left, right) => right.essentialSavingsUsd - left.essentialSavingsUsd);
  const qualifying = candidates.filter(({ essentialSavingsUsd }) => essentialSavingsUsd >= targetUsd);
  const nonQualifying = candidates.filter(({ essentialSavingsUsd }) => essentialSavingsUsd < targetUsd);
  return {
    candidates,
    qualifying,
    nonQualifying,
    minimumRank: qualifying.length === 0 ? null : Math.min(...qualifying.map(({ rank }) => rank)),
  };
}

export function rawSeniorSweNonSalaryAnnualUsd(cityId: string): number {
  const city = dataset.cities.find(({ id }) => id === cityId);
  if (!city) throw new Error(`Missing raw city fixture for ${cityId}`);
  const distribution = roleMatrix.salaries[city.countryId]?.senior_swe;
  if (!distribution) throw new Error(`Missing raw senior_swe distribution for ${city.countryId}`);
  return distribution.nonSalaryComp.annualLocal * localRate(city.currency);
}
