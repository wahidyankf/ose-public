// Pure checks over the shared AyoKoding datasets. Each check receives parsed documents and returns
// one finding per violation; an empty list means the behaviour holds. No file, clock, or environment
// is read here: unit tests pass in-memory documents, and integration tests pass the checked-in files.

export type Finding = string;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const KNOWN_CALCULATOR_KEYS = [
  "tab",
  "region",
  "countryId",
  "cityId",
  "household",
  "schoolType",
  "area",
  "gross",
  "minRole",
];
const OFFERED_EXTRA_HARNESS = "command-code-pro";

export type Figure = { benchmark: string; version: string; value: number; source: string };

export type Model = { id: string; access: string; figures: Figure[] };

export type BenchmarkDataset = {
  dataset: { lastUpdated: string; models: Model[] };
  benchmarks: {
    specs: { id: string; version: string }[];
    benchmarkTierAnchors: Record<string, Record<string, string>>;
    defaultSubstituteHarness: string;
    substituteHarnesses: string[];
    rosterCatalogHarnesses: string[];
  };
  operators: { checkedOn: string }[];
  priceSources: { checkedOn: string }[];
};

export type Band = {
  p25: { monthlyGrossLocal: number };
  median: { monthlyGrossLocal: number };
  p75: { monthlyGrossLocal: number };
};

export type LivingDataset = {
  snapshotDate: string;
  countries: {
    id: string;
    effectiveRate: { low: { amount: number }; mid: { amount: number }; high: { amount: number } };
  }[];
  cities: { id: string; countryId: string; currency: string }[];
  roleMatrix: { ladder: { rank: number }[]; salaries: Record<string, Record<string, Band>> };
};

export type FxDataset = { fxSnapshotDate: string; ratesUsdPerUnit: Record<string, number> };

export type BenchmarkVector = {
  compositeIndex: Record<string, number | null>;
  substitutes: { target: string; options: { id: string }[] };
};

export type CalculatorVector = {
  essentialsLocal: { city: string }[];
  savingsRow: { city: string }[];
};

export type UrlStateVector = { benchmark?: unknown; calculator?: { state: Record<string, unknown> }[] };

export function checkInventory(present: readonly string[], required: readonly string[]): Finding[] {
  return required.filter((rel) => !present.includes(rel)).map((rel) => `missing ${rel}`);
}

export function checkProvenanceDates(record: string, dates: readonly string[]): Finding[] {
  return dates.filter((date) => !record.includes(date)).map((date) => `provenance must carry ${date}`);
}

export function checkBenchmarkModels(data: BenchmarkDataset): Finding[] {
  const findings: Finding[] = [];
  const ids = data.dataset.models.map((model) => model.id);
  if (new Set(ids).size !== ids.length) {
    findings.push("model ids must be unique");
  }
  const versions = new Map(data.benchmarks.specs.map((spec) => [spec.id, spec.version]));
  for (const model of data.dataset.models) {
    if (!model.id) {
      findings.push("model needs an id");
    }
    for (const figure of model.figures) {
      const key = `${model.id}/${figure.benchmark}`;
      if (!versions.has(figure.benchmark)) {
        findings.push(`${model.id}: unknown benchmark ${figure.benchmark}`);
      } else if (figure.version !== versions.get(figure.benchmark)) {
        findings.push(`${key}: unpinned figure`);
      }
      if (!figure.source) {
        findings.push(`${key}: figure needs a source`);
      }
    }
  }
  return findings;
}

export function checkCityResolution(living: LivingDataset, fx: FxDataset): Finding[] {
  if (living.cities.length === 0) {
    return ["no calculator cities are listed"];
  }
  const countryIds = new Set(living.countries.map((country) => country.id));
  const findings: Finding[] = [];
  for (const city of living.cities) {
    if (!countryIds.has(city.countryId)) {
      findings.push(`${city.id} must name a listed country`);
    }
    const rate = fx.ratesUsdPerUnit[city.currency];
    if (rate === undefined || !(rate > 0)) {
      findings.push(`${city.id} currency ${city.currency} has no positive rate in the shared FX table`);
    }
  }
  return findings;
}

export function checkRateHome(
  fx: FxDataset,
  living: Record<string, unknown>,
  otherDataFiles: Readonly<Record<string, string>>,
): Finding[] {
  const findings: Finding[] = [];
  const rates = Object.entries(fx.ratesUsdPerUnit);
  if (rates.length === 0) {
    findings.push("data/fx.json holds no rates");
  }
  for (const key of ["fx", "ratesUsdPerUnit"]) {
    if (key in living) {
      findings.push(`cost-of-living.json must not hold rates (${key})`);
    }
  }
  for (const [name, raw] of Object.entries(otherDataFiles)) {
    if (raw.includes("ratesUsdPerUnit")) {
      findings.push(`${name} must not hold a rate table`);
    }
  }
  if (fx.ratesUsdPerUnit["USD"] !== 1) {
    findings.push("the USD rate must be 1");
  }
  for (const [code, rate] of rates) {
    if (!(rate > 0)) {
      findings.push(`${code} rate must be greater than 0`);
    }
  }
  return findings;
}

export function checkSnapshotDates(data: BenchmarkDataset, living: LivingDataset, fx: FxDataset): Finding[] {
  const findings: Finding[] = [];
  for (const date of [living.snapshotDate, fx.fxSnapshotDate, data.dataset.lastUpdated]) {
    if (!ISO_DATE.test(date)) {
      findings.push(`${date} must be an ISO date`);
    }
  }
  for (const source of [...data.operators, ...data.priceSources]) {
    if (!ISO_DATE.test(source.checkedOn)) {
      findings.push(`source check date ${source.checkedOn} must be an ISO date`);
    } else if (source.checkedOn > data.dataset.lastUpdated) {
      findings.push(`${source.checkedOn} is after the dataset date`);
    }
  }
  return findings;
}

export function checkTierAnchors(data: BenchmarkDataset): Finding[] {
  const findings: Finding[] = [];
  for (const [benchmark, tiers] of Object.entries(data.benchmarks.benchmarkTierAnchors)) {
    const floorOf = (tier: string): number => {
      const anchor = data.dataset.models.find((model) => model.id === tiers[tier]);
      return anchor?.figures.find((figure) => figure.benchmark === benchmark)?.value ?? Number.NaN;
    };
    for (const [tier, anchorId] of Object.entries(tiers)) {
      const anchor = data.dataset.models.find((model) => model.id === anchorId);
      if (!anchor) {
        findings.push(`${benchmark}/${tier}: missing anchor ${anchorId}`);
        continue;
      }
      if (anchor.access !== "general") {
        findings.push(`${benchmark}/${tier}: anchor must be general-access`);
      }
      if (!anchor.figures.some((figure) => figure.benchmark === benchmark)) {
        findings.push(`${benchmark}/${tier}: anchor needs a scored figure`);
      }
    }
    if (!(floorOf("ultra") > floorOf("planning"))) {
      findings.push(`${benchmark}: ultra floor must be above planning`);
    }
    if (!(floorOf("planning") > floorOf("execution"))) {
      findings.push(`${benchmark}: planning floor must be above execution`);
    }
  }
  return findings;
}

export function checkSubstituteHarnesses(data: BenchmarkDataset): Finding[] {
  const findings: Finding[] = [];
  const { substituteHarnesses, rosterCatalogHarnesses, defaultSubstituteHarness } = data.benchmarks;
  if (substituteHarnesses.length === 0) {
    findings.push("no substitute harnesses are listed");
  }
  const offered = [...rosterCatalogHarnesses, OFFERED_EXTRA_HARNESS];
  for (const harness of substituteHarnesses) {
    if (!offered.includes(harness)) {
      findings.push(`substitute harness ${harness} is not an offered catalog harness`);
    }
  }
  if (!substituteHarnesses.includes(defaultSubstituteHarness)) {
    findings.push(`default substitute harness ${defaultSubstituteHarness} is not a substitute harness`);
  }
  return findings;
}

export function checkRoleMatrix(living: LivingDataset): Finding[] {
  const findings: Finding[] = [];
  const { ladder, salaries } = living.roleMatrix;
  if (ladder.length !== 15) {
    findings.push(`the ladder must have 15 rungs, found ${ladder.length}`);
  }
  if (ladder.some((rung, index) => rung.rank !== index + 1)) {
    findings.push("the ladder ranks must run 1 to 15 in order");
  }
  for (const [countryId, roles] of Object.entries(salaries)) {
    if (Object.keys(roles).length !== 15) {
      findings.push(`${countryId} must list 15 roles`);
    }
    for (const [role, band] of Object.entries(roles)) {
      const key = `${countryId}/${role}`;
      if (!(band.p25.monthlyGrossLocal > 0)) {
        findings.push(`${key}: the 25th percentile must be positive`);
      }
      if (band.median.monthlyGrossLocal < band.p25.monthlyGrossLocal) {
        findings.push(`${key}: the median must not be below the 25th percentile`);
      }
      if (band.p75.monthlyGrossLocal < band.median.monthlyGrossLocal) {
        findings.push(`${key}: the 75th percentile must not be below the median`);
      }
    }
  }
  return findings;
}

export function checkEffectiveRates(living: LivingDataset): Finding[] {
  const findings: Finding[] = [];
  for (const country of living.countries) {
    const { low, mid, high } = country.effectiveRate;
    if (mid.amount < low.amount) {
      findings.push(`${country.id}: mid band is below low`);
    }
    if (high.amount < mid.amount) {
      findings.push(`${country.id}: high band is below mid`);
    }
  }
  return findings;
}

export function checkBenchmarkVectors(vector: BenchmarkVector, data: BenchmarkDataset): Finding[] {
  const stored = new Set(data.dataset.models.map((model) => model.id));
  const findings: Finding[] = [];
  const names = Object.keys(vector.compositeIndex);
  if (names.length === 0) {
    findings.push("the composite index has no entries");
  }
  for (const name of names) {
    if (!stored.has(name)) {
      findings.push(`vector model ${name} must be stored`);
    }
  }
  if (!stored.has(vector.substitutes.target)) {
    findings.push("substitute target must be stored");
  }
  for (const option of vector.substitutes.options) {
    if (!stored.has(option.id)) {
      findings.push(`substitute option ${option.id} must be stored`);
    }
  }
  return findings;
}

export function checkCalculatorVectors(vector: CalculatorVector, living: LivingDataset): Finding[] {
  const stored = new Set(living.cities.map((city) => city.id));
  const findings: Finding[] = [];
  if (vector.essentialsLocal.length === 0) {
    findings.push("the essentials rows are empty");
  }
  for (const row of [...vector.essentialsLocal, ...vector.savingsRow]) {
    if (!stored.has(row.city)) {
      findings.push(`vector city ${row.city} must be stored`);
    }
  }
  return findings;
}

export function checkUrlStateKeys(vector: UrlStateVector): Finding[] {
  const findings: Finding[] = [];
  if (vector.benchmark === undefined) {
    findings.push("url-state must keep benchmark");
  }
  if (vector.calculator === undefined) {
    findings.push("url-state must keep calculator");
  }
  for (const { state } of vector.calculator ?? []) {
    for (const key of Object.keys(state)) {
      if (!KNOWN_CALCULATOR_KEYS.includes(key)) {
        findings.push(`unknown calculator state key ${key}`);
      }
    }
  }
  return findings;
}

// The checked-in inventory: every file the library publishes, by repository-relative path.
export const REQUIRED_INVENTORY = [
  "data/ai-benchmark.json",
  "data/cost-of-living.json",
  "data/fx.json",
  "provenance.md",
  "test-vectors/",
  "test-vectors/benchmark.json",
  "test-vectors/calculator.json",
  "test-vectors/url-state.json",
] as const;
