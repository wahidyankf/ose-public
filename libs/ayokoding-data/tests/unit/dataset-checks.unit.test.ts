// Unit bindings for the shared dataset scenarios. Each check runs on in-memory documents only: the valid
// fixture must produce no findings, and a broken copy must report each violation. The checked-in files are
// read by the integration suite, which runs the same checks on the real data.
import { describe, expect, it } from "vitest";
import {
  REQUIRED_INVENTORY,
  checkBenchmarkModels,
  checkBenchmarkVectors,
  checkCalculatorVectors,
  checkCityResolution,
  checkEffectiveRates,
  checkInventory,
  checkProvenanceDates,
  checkRateHome,
  checkRoleMatrix,
  checkSnapshotDates,
  checkSubstituteHarnesses,
  checkTierAnchors,
  checkUrlStateKeys,
} from "../../src/dataset-checks";
import {
  PROVENANCE_RECORD,
  benchmarkFixture,
  benchmarkVectorFixture,
  calculatorVectorFixture,
  fxFixture,
  livingFixture,
  must,
  urlStateFixture,
} from "./dataset-fixtures";

describe("dataset inventory", () => {
  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: A consumer finds all datasets and test vectors at their documented paths
  it("finds every documented dataset and vector path", () => {
    expect(checkInventory([...REQUIRED_INVENTORY], REQUIRED_INVENTORY)).toEqual([]);
    const withoutVectors = REQUIRED_INVENTORY.filter((rel) => rel !== "test-vectors/url-state.json");
    expect(checkInventory(withoutVectors, REQUIRED_INVENTORY)).toEqual(["missing test-vectors/url-state.json"]);
  });
});

describe("benchmark models", () => {
  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Every benchmark model has a known id, a pinned figure version, and a source
  it("keeps ids unique, figures pinned to a known benchmark version, and sourced", () => {
    expect(checkBenchmarkModels(benchmarkFixture())).toEqual([]);

    const broken = benchmarkFixture();
    const first = must(broken.dataset.models[0], "model a");
    const second = must(broken.dataset.models[1], "model b");
    const third = must(broken.dataset.models[2], "model c");
    second.id = "model-a";
    third.id = "";
    first.figures.push({ benchmark: "bench-9", version: "v1", value: 1, source: "src" });
    must(second.figures[0], "figure").version = "v0";
    must(second.figures[1], "figure").source = "";

    expect(checkBenchmarkModels(broken)).toEqual([
      "model ids must be unique",
      "model-a: unknown benchmark bench-9",
      "model-a/bench-1: unpinned figure",
      "model-a/bench-2: figure needs a source",
      "model needs an id",
    ]);
  });
});

describe("calculator cities", () => {
  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Every calculator city resolves through the shared FX table
  it("names a listed country and a positive FX rate for every city", () => {
    expect(checkCityResolution(livingFixture(), fxFixture())).toEqual([]);

    const broken = livingFixture();
    broken.cities.push({ id: "city-2", countryId: "country-9", currency: "XXX" });
    expect(checkCityResolution(broken, fxFixture())).toEqual([
      "city-2 must name a listed country",
      "city-2 currency XXX has no positive rate in the shared FX table",
    ]);

    const empty = livingFixture();
    empty.cities = [];
    expect(checkCityResolution(empty, fxFixture())).toEqual(["no calculator cities are listed"]);
  });
});

describe("rate home", () => {
  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: The FX table is the only home for rates, USD is 1, and every rate is positive
  it("keeps rates only in the FX table, with USD at 1 and every rate positive", () => {
    const otherFiles = { "ai-benchmark.json": "{}", "cost-of-living.json": "{}" };
    expect(checkRateHome(fxFixture(), { ...livingFixture() }, otherFiles)).toEqual([]);

    const living: Record<string, unknown> = { ...livingFixture(), fx: {}, ratesUsdPerUnit: {} };
    const fx = { fxSnapshotDate: "2026-02-20", ratesUsdPerUnit: { USD: 2, EUR: 0 } };
    expect(checkRateHome(fx, living, { "ai-benchmark.json": '{"ratesUsdPerUnit":{}}' })).toEqual([
      "cost-of-living.json must not hold rates (fx)",
      "cost-of-living.json must not hold rates (ratesUsdPerUnit)",
      "ai-benchmark.json must not hold a rate table",
      "the USD rate must be 1",
      "EUR rate must be greater than 0",
    ]);

    expect(checkRateHome({ fxSnapshotDate: "2026-02-20", ratesUsdPerUnit: {} }, {}, {})).toEqual([
      "data/fx.json holds no rates",
      "the USD rate must be 1",
    ]);
  });
});

describe("snapshot dates", () => {
  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Snapshot dates are ISO dates and no source check is later than the dataset date
  it("keeps every snapshot an ISO date and no source check after the dataset date", () => {
    expect(checkSnapshotDates(benchmarkFixture(), livingFixture(), fxFixture())).toEqual([]);

    const notIso = benchmarkFixture();
    notIso.dataset.lastUpdated = "March 1";
    notIso.priceSources.push({ checkedOn: "2026-13" });
    expect(checkSnapshotDates(notIso, livingFixture(), { ...fxFixture(), fxSnapshotDate: "2026/02/20" })).toEqual([
      "2026/02/20 must be an ISO date",
      "March 1 must be an ISO date",
      "source check date 2026-13 must be an ISO date",
    ]);

    const late = benchmarkFixture();
    late.operators.push({ checkedOn: "2026-06-01" });
    expect(checkSnapshotDates(late, livingFixture(), fxFixture())).toEqual(["2026-06-01 is after the dataset date"]);
  });
});

describe("tier anchors", () => {
  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Tier anchors are general-access models with descending floors on every benchmark
  it("anchors each tier on a general-access model with a figure and descending floors", () => {
    expect(checkTierAnchors(benchmarkFixture())).toEqual([]);

    const missingScore = benchmarkFixture();
    must(missingScore.dataset.models[1], "model b").figures = must(
      missingScore.dataset.models[1],
      "model b",
    ).figures.filter((figure) => figure.benchmark !== "bench-1");
    missingScore.benchmarks.benchmarkTierAnchors = {
      "bench-1": { ultra: "model-a", planning: "model-b", execution: "model-missing" },
    };
    expect(checkTierAnchors(missingScore)).toEqual([
      "bench-1/planning: anchor needs a scored figure",
      "bench-1/execution: missing anchor model-missing",
      "bench-1: ultra floor must be above planning",
      "bench-1: planning floor must be above execution",
    ]);

    const inverted = benchmarkFixture();
    must(inverted.dataset.models[2], "model c").access = "restricted";
    must(must(inverted.dataset.models[0], "model a").figures[0], "figure").value = 60;
    expect(checkTierAnchors(inverted)).toEqual([
      "bench-1/execution: anchor must be general-access",
      "bench-1: ultra floor must be above planning",
      "bench-2/execution: anchor must be general-access",
    ]);
  });
});

describe("substitute harnesses", () => {
  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Substitute-finder harnesses stay inside the offered catalog harnesses
  it("keeps every substitute harness offered and the default one of them", () => {
    expect(checkSubstituteHarnesses(benchmarkFixture())).toEqual([]);

    const broken = benchmarkFixture();
    broken.benchmarks.substituteHarnesses = ["unlisted-harness"];
    expect(checkSubstituteHarnesses(broken)).toEqual([
      "substitute harness unlisted-harness is not an offered catalog harness",
      "default substitute harness claude-code is not a substitute harness",
    ]);

    broken.benchmarks.substituteHarnesses = [];
    expect(checkSubstituteHarnesses(broken)).toEqual([
      "no substitute harnesses are listed",
      "default substitute harness claude-code is not a substitute harness",
    ]);
  });
});

describe("role matrix", () => {
  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: The role matrix keeps a 15-rung ladder with ordered percentile salaries
  it("keeps a 15-rung ladder and ordered percentile salaries for 15 roles per country", () => {
    expect(checkRoleMatrix(livingFixture())).toEqual([]);

    const broken = livingFixture();
    broken.roleMatrix.ladder = [{ rank: 2 }, { rank: 1 }];
    const country = must(broken.roleMatrix.salaries["country-1"], "country-1");
    delete country["role-1"];
    must(country["role-2"], "role-2").p25.monthlyGrossLocal = 0;
    must(country["role-3"], "role-3").median.monthlyGrossLocal = 1;
    must(country["role-4"], "role-4").p75.monthlyGrossLocal = 1;
    expect(checkRoleMatrix(broken)).toEqual([
      "the ladder must have 15 rungs, found 2",
      "the ladder ranks must run 1 to 15 in order",
      "country-1 must list 15 roles",
      "country-1/role-2: the 25th percentile must be positive",
      "country-1/role-3: the median must not be below the 25th percentile",
      "country-1/role-4: the 75th percentile must not be below the median",
    ]);
  });
});

describe("effective rates", () => {
  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Country effective-rate bands ascend from low to mid to high
  it("keeps the low, mid, and high bands in ascending order", () => {
    expect(checkEffectiveRates(livingFixture())).toEqual([]);

    const broken = livingFixture();
    const country = must(broken.countries[0], "country-1");
    country.effectiveRate.mid.amount = 5;
    country.effectiveRate.high.amount = 1;
    expect(checkEffectiveRates(broken)).toEqual([
      "country-1: mid band is below low",
      "country-1: high band is below mid",
    ]);
  });
});

describe("provenance record", () => {
  // @scenario specs/libs/ayokoding-data/behaviours/provenance/source-provenance.feature: Snapshot dates in the provenance record match each dataset's own date
  it("carries the snapshot date of every dataset it describes", () => {
    const dates = ["2026-03-01", "2026-02-20"];
    expect(checkProvenanceDates(PROVENANCE_RECORD, dates)).toEqual([]);
    expect(checkProvenanceDates("no dates here", dates)).toEqual([
      "provenance must carry 2026-03-01",
      "provenance must carry 2026-02-20",
    ]);
  });
});

describe("test vectors", () => {
  // @scenario specs/libs/ayokoding-data/behaviours/vectors/test-vectors.feature: Benchmark vectors name stored models
  it("names only stored models in the benchmark vectors", () => {
    expect(checkBenchmarkVectors(benchmarkVectorFixture(), benchmarkFixture())).toEqual([]);

    const broken = benchmarkVectorFixture();
    broken.compositeIndex = { "model-x": 1 };
    broken.substitutes = { target: "model-y", options: [{ id: "model-z" }] };
    expect(checkBenchmarkVectors(broken, benchmarkFixture())).toEqual([
      "vector model model-x must be stored",
      "substitute target must be stored",
      "substitute option model-z must be stored",
    ]);

    expect(checkBenchmarkVectors({ ...benchmarkVectorFixture(), compositeIndex: {} }, benchmarkFixture())).toEqual([
      "the composite index has no entries",
    ]);
  });

  // @scenario specs/libs/ayokoding-data/behaviours/vectors/test-vectors.feature: Calculator vectors name stored cities
  it("names only stored cities in the calculator vectors", () => {
    expect(checkCalculatorVectors(calculatorVectorFixture(), livingFixture())).toEqual([]);

    expect(checkCalculatorVectors({ essentialsLocal: [], savingsRow: [{ city: "city-9" }] }, livingFixture())).toEqual([
      "the essentials rows are empty",
      "vector city city-9 must be stored",
    ]);
  });

  // @scenario specs/libs/ayokoding-data/behaviours/vectors/test-vectors.feature: URL-state vectors keep their benchmark and calculator keys
  it("keeps the benchmark and calculator keys and only known calculator state keys", () => {
    expect(checkUrlStateKeys(urlStateFixture())).toEqual([]);

    expect(checkUrlStateKeys({ calculator: [{ state: { tab: "x", unknownKey: 1 } }] })).toEqual([
      "url-state must keep benchmark",
      "unknown calculator state key unknownKey",
    ]);
    expect(checkUrlStateKeys({ benchmark: {} })).toEqual(["url-state must keep calculator"]);
  });
});
