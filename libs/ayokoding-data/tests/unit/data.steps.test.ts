import path from "node:path";
import { fileURLToPath } from "node:url";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..", "..");
const dataDir = path.join(ROOT, "data");
const vectorsDir = path.join(ROOT, "test-vectors");
const provenancePath = path.join(ROOT, "provenance.md");
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function json(name: string): unknown {
  const file = path.join(dataDir, name);
  expect(existsSync(file), `missing data file: ${file}`).toBe(true);
  return JSON.parse(readFileSync(file, "utf8") as string) as unknown;
}

function vectors(name: string): unknown {
  const file = path.join(vectorsDir, name);
  expect(existsSync(file), `missing vector file: ${file}`).toBe(true);
  return JSON.parse(readFileSync(file, "utf8") as string) as unknown;
}

function provenance(): string {
  expect(existsSync(provenancePath), `missing ${provenancePath}`).toBe(true);
  return readFileSync(provenancePath, "utf8");
}

type Model = {
  id: string;
  vendor: string;
  access: string;
  figures: { benchmark: string; version: string; value: number; source: string }[];
  releaseDate?: string;
};

type BenchmarkDataset = {
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

function benchmarkData(): BenchmarkDataset {
  return json("ai-benchmark.json") as BenchmarkDataset;
}

const provenanceFeature = await loadFeature(
  path.resolve(ROOT, "../../specs/libs/ayokoding-data/behaviours/provenance/source-provenance.feature"),
);

describeFeature(provenanceFeature, ({ Scenario }) => {
  // @scenario specs/libs/ayokoding-data/behaviours/provenance/source-provenance.feature: Snapshot dates in the provenance record match each dataset's own date
  Scenario("Snapshot dates in the provenance record match each dataset's own date", ({ Given, When, Then }) => {
    let record = "";
    let dates: string[] = [];

    Given("the shared provenance record", () => {
      record = provenance();
    });

    When("the provenance record is checked against the stored datasets", () => {
      dates = [
        benchmarkData().dataset.lastUpdated,
        (json("cost-of-living.json") as { snapshotDate: string }).snapshotDate,
        (json("fx.json") as { fxSnapshotDate: string }).fxSnapshotDate,
      ];
    });

    Then(
      "the record carries the snapshot date of data/ai-benchmark.json, data/cost-of-living.json, and data/fx.json",
      () => {
        for (const date of dates) {
          expect(record, `provenance must carry ${date}`).toContain(date);
        }
      },
    );
  });
});

const validationFeature = await loadFeature(
  path.resolve(ROOT, "../../specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature"),
);

describeFeature(validationFeature, ({ Scenario }) => {
  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: A consumer finds all datasets and test vectors at their documented paths
  Scenario("A consumer finds all datasets and test vectors at their documented paths", ({ Given, When, Then, And }) => {
    Given("the ayokoding-data library source tree", () => {
      expect(existsSync(ROOT)).toBe(true);
    });

    When("the dataset inventory is inspected", () => {
      // Inspection happens in the Then clauses below.
    });

    Then(
      "data/ai-benchmark.json, data/cost-of-living.json, data/fx.json, provenance.md, and test-vectors/ exist",
      () => {
        for (const rel of [
          "data/ai-benchmark.json",
          "data/cost-of-living.json",
          "data/fx.json",
          "provenance.md",
          "test-vectors/",
        ]) {
          expect(existsSync(path.join(ROOT, rel)), `missing ${rel}`).toBe(true);
        }
      },
    );

    And("test-vectors/benchmark.json, test-vectors/calculator.json, and test-vectors/url-state.json exist", () => {
      for (const name of ["benchmark.json", "calculator.json", "url-state.json"]) {
        vectors(name);
      }
    });
  });

  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Every benchmark model has a known id, a pinned figure version, and a source
  Scenario(
    "Every benchmark model has a known id, a pinned figure version, and a source",
    ({ Given, When, Then, And }) => {
      let data: BenchmarkDataset = benchmarkData();

      Given("the ayokoding-data library source tree", () => {
        expect(existsSync(ROOT)).toBe(true);
      });

      When("each benchmark model is checked against the benchmark specs", () => {
        data = benchmarkData();
      });

      Then("every model id is unique and every figure names a known benchmark", () => {
        const ids = data.dataset.models.map((model) => model.id);
        expect(new Set(ids).size, "model ids must be unique").toBe(ids.length);
        const specIds = new Set(data.benchmarks.specs.map((spec) => spec.id));
        for (const model of data.dataset.models) {
          expect(model.id, "model needs an id").toBeTruthy();
          for (const figure of model.figures) {
            expect(specIds.has(figure.benchmark), `${model.id}: unknown benchmark ${figure.benchmark}`).toBe(true);
          }
        }
      });

      And("every figure is pinned to that benchmark's version and carries a source", () => {
        const versions = new Map(data.benchmarks.specs.map((spec) => [spec.id, spec.version]));
        for (const model of data.dataset.models) {
          for (const figure of model.figures) {
            expect(figure.version, `${model.id}/${figure.benchmark}: unpinned figure`).toBe(
              versions.get(figure.benchmark),
            );
            expect(figure.source, `${model.id}/${figure.benchmark}: figure needs a source`).toBeTruthy();
          }
        }
      });
    },
  );

  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Every calculator city resolves through the shared FX table
  Scenario("Every calculator city resolves through the shared FX table", ({ Given, When, Then, And }) => {
    type Living = {
      countries: { id: string }[];
      cities: { id: string; countryId: string; currency: string }[];
    };
    let living: Living = { countries: [], cities: [] };
    let rates: Record<string, number> = {};

    Given("the ayokoding-data library source tree", () => {
      expect(existsSync(ROOT)).toBe(true);
    });

    When("each calculator city is checked against the country and FX tables", () => {
      living = json("cost-of-living.json") as Living;
      rates = (json("fx.json") as { ratesUsdPerUnit: Record<string, number> }).ratesUsdPerUnit;
      expect(living.cities.length).toBeGreaterThan(0);
    });

    Then("every city names a listed country", () => {
      const countryIds = new Set(living.countries.map((country) => country.id));
      for (const city of living.cities) {
        expect(countryIds.has(city.countryId), `${city.id} must name a listed country`).toBe(true);
      }
    });

    And("every city currency has a positive rate in the shared FX table", () => {
      for (const city of living.cities) {
        expect(rates[city.currency], `${city.id} currency ${city.currency}`).toBeGreaterThan(0);
      }
    });
  });

  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: The FX table is the only home for rates, USD is 1, and every rate is positive
  Scenario(
    "The FX table is the only home for rates, USD is 1, and every rate is positive",
    ({ Given, When, Then, And }) => {
      let fx: { ratesUsdPerUnit: Record<string, number> } = { ratesUsdPerUnit: {} };
      let living: Record<string, unknown> = {};

      Given("the ayokoding-data library source tree", () => {
        expect(existsSync(ROOT)).toBe(true);
      });

      When("the rate tables are read", () => {
        fx = json("fx.json") as { ratesUsdPerUnit: Record<string, number> };
        living = json("cost-of-living.json") as Record<string, unknown>;
      });

      Then("data/fx.json holds every rate and no other dataset file holds a rate table", () => {
        expect(Object.keys(fx.ratesUsdPerUnit).length).toBeGreaterThan(0);
        expect(living, "cost-of-living.json must not hold rates").not.toHaveProperty("fx");
        expect(living, "cost-of-living.json must not hold rates").not.toHaveProperty("ratesUsdPerUnit");
        for (const name of readdirSync(dataDir).filter((file) => file !== "fx.json")) {
          const raw = readFileSync(path.join(dataDir, name), "utf8");
          expect(raw, `${name} must not hold a rate table`).not.toContain("ratesUsdPerUnit");
        }
      });

      And("the USD rate is 1", () => {
        expect(fx.ratesUsdPerUnit["USD"]).toBe(1);
      });

      And("every rate is greater than 0", () => {
        for (const [code, rate] of Object.entries(fx.ratesUsdPerUnit)) {
          expect(rate, code).toBeGreaterThan(0);
        }
      });
    },
  );

  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Snapshot dates are ISO dates and no source check is later than the dataset date
  Scenario(
    "Snapshot dates are ISO dates and no source check is later than the dataset date",
    ({ Given, When, Then, And }) => {
      let data: BenchmarkDataset = benchmarkData();
      let dates: string[] = [];

      Given("the ayokoding-data library source tree", () => {
        expect(existsSync(ROOT)).toBe(true);
      });

      When("the snapshot dates are read", () => {
        data = benchmarkData();
        dates = [
          (json("cost-of-living.json") as { snapshotDate: string }).snapshotDate,
          (json("fx.json") as { fxSnapshotDate: string }).fxSnapshotDate,
          data.dataset.lastUpdated,
        ];
      });

      Then("every snapshot date is an ISO date", () => {
        for (const date of dates) {
          expect(date, `${date} must be an ISO date`).toMatch(ISO_DATE);
        }
      });

      And("no operator or price source was checked after the dataset's last update", () => {
        for (const source of [...data.operators, ...data.priceSources]) {
          expect(source.checkedOn, "source check date").toMatch(ISO_DATE);
          expect(source.checkedOn <= data.dataset.lastUpdated, `${source.checkedOn} is after the dataset date`).toBe(
            true,
          );
        }
      });
    },
  );

  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Tier anchors are general-access models with descending floors on every benchmark
  Scenario(
    "Tier anchors are general-access models with descending floors on every benchmark",
    ({ Given, When, Then, And }) => {
      let data: BenchmarkDataset = benchmarkData();

      Given("the ayokoding-data library source tree", () => {
        expect(existsSync(ROOT)).toBe(true);
      });

      When("the tier anchors are read", () => {
        data = benchmarkData();
      });

      Then("every anchor model is general-access and has a figure on its benchmark", () => {
        for (const [benchmark, tiers] of Object.entries(data.benchmarks.benchmarkTierAnchors)) {
          for (const [tier, anchorId] of Object.entries(tiers)) {
            const anchor = data.dataset.models.find((model) => model.id === anchorId);
            expect(anchor, `${benchmark}/${tier}: missing anchor ${anchorId}`).toBeDefined();
            expect(anchor?.access, `${benchmark}/${tier}`).toBe("general");
            expect(
              anchor?.figures.some((figure) => figure.benchmark === benchmark),
              `${benchmark}/${tier}: anchor needs a scored figure`,
            ).toBe(true);
          }
        }
      });

      And("on every benchmark the ultra floor is above the planning floor, which is above the execution floor", () => {
        for (const [benchmark, tiers] of Object.entries(data.benchmarks.benchmarkTierAnchors)) {
          const floorOf = (tier: string): number => {
            const anchor = data.dataset.models.find((model) => model.id === tiers[tier]);
            return anchor?.figures.find((item) => item.benchmark === benchmark)?.value ?? Number.NaN;
          };
          expect(floorOf("ultra"), `${benchmark}: ultra floor above planning`).toBeGreaterThan(floorOf("planning"));
          expect(floorOf("planning"), `${benchmark}: planning floor above execution`).toBeGreaterThan(
            floorOf("execution"),
          );
        }
      });
    },
  );

  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Substitute-finder harnesses stay inside the offered catalog harnesses
  Scenario("Substitute-finder harnesses stay inside the offered catalog harnesses", ({ Given, When, Then, And }) => {
    let data: BenchmarkDataset = benchmarkData();

    Given("the ayokoding-data library source tree", () => {
      expect(existsSync(ROOT)).toBe(true);
    });

    When("the substitute-finder settings are read", () => {
      data = benchmarkData();
    });

    Then("every substitute harness is an offered catalog harness", () => {
      expect(data.benchmarks.substituteHarnesses.length).toBeGreaterThan(0);
      const offered = [...data.benchmarks.rosterCatalogHarnesses, "command-code-pro"];
      for (const harness of data.benchmarks.substituteHarnesses) {
        expect(offered, harness).toContain(harness);
      }
    });

    And("the default substitute harness is one of the substitute harnesses", () => {
      expect(data.benchmarks.substituteHarnesses).toContain(data.benchmarks.defaultSubstituteHarness);
    });
  });

  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: The role matrix keeps a 15-rung ladder with ordered percentile salaries
  Scenario("The role matrix keeps a 15-rung ladder with ordered percentile salaries", ({ Given, When, Then, And }) => {
    type Living = {
      roleMatrix: {
        ladder: { rank: number }[];
        salaries: Record<
          string,
          Record<
            string,
            {
              p25: { monthlyGrossLocal: number };
              median: { monthlyGrossLocal: number };
              p75: { monthlyGrossLocal: number };
            }
          >
        >;
      };
    };
    let living: Living = { roleMatrix: { ladder: [], salaries: {} } };

    Given("the ayokoding-data library source tree", () => {
      expect(existsSync(ROOT)).toBe(true);
    });

    When("the role matrix is read", () => {
      living = json("cost-of-living.json") as Living;
    });

    Then("the ladder has 15 ranked rungs", () => {
      expect(living.roleMatrix.ladder).toHaveLength(15);
      expect(living.roleMatrix.ladder.map((rung) => rung.rank)).toEqual(living.roleMatrix.ladder.map((_, i) => i + 1));
    });

    And("every country lists 15 roles whose 25th, 50th, and 75th percentile salaries ascend", () => {
      for (const [countryId, roles] of Object.entries(living.roleMatrix.salaries)) {
        expect(Object.keys(roles), `${countryId} role count`).toHaveLength(15);
        for (const [role, band] of Object.entries(roles)) {
          expect(band.p25.monthlyGrossLocal, `${countryId}/${role}`).toBeGreaterThan(0);
          expect(band.median.monthlyGrossLocal, `${countryId}/${role}`).toBeGreaterThanOrEqual(
            band.p25.monthlyGrossLocal,
          );
          expect(band.p75.monthlyGrossLocal, `${countryId}/${role}`).toBeGreaterThanOrEqual(
            band.median.monthlyGrossLocal,
          );
        }
      }
    });
  });

  // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Country effective-rate bands ascend from low to mid to high
  Scenario("Country effective-rate bands ascend from low to mid to high", ({ Given, When, Then }) => {
    type Living = {
      countries: {
        id: string;
        effectiveRate: { low: { amount: number }; mid: { amount: number }; high: { amount: number } };
      }[];
    };
    let living: Living = { countries: [] };

    Given("the ayokoding-data library source tree", () => {
      expect(existsSync(ROOT)).toBe(true);
    });

    When("each country's effective-rate band is read", () => {
      living = json("cost-of-living.json") as Living;
    });

    Then("the mid band is at least the low band and the high band is at least the mid band", () => {
      for (const country of living.countries) {
        const { low, mid, high } = country.effectiveRate;
        expect(mid.amount, `${country.id}: mid below low`).toBeGreaterThanOrEqual(low.amount);
        expect(high.amount, `${country.id}: high below mid`).toBeGreaterThanOrEqual(mid.amount);
      }
    });
  });
});

const vectorsFeature = await loadFeature(
  path.resolve(ROOT, "../../specs/libs/ayokoding-data/behaviours/vectors/test-vectors.feature"),
);

describeFeature(vectorsFeature, ({ Scenario }) => {
  // @scenario specs/libs/ayokoding-data/behaviours/vectors/test-vectors.feature: Benchmark vectors name stored models
  Scenario("Benchmark vectors name stored models", ({ Given, When, Then, And }) => {
    let storedModels = new Set<string>();
    let benchmark: {
      compositeIndex: Record<string, number | null>;
      substitutes: { target: string; options: { id: string }[] };
    } = {
      compositeIndex: {},
      substitutes: { target: "", options: [] },
    };

    Given("the ayokoding-data library source tree", () => {
      expect(existsSync(ROOT)).toBe(true);
    });

    When("the benchmark vectors are compared to the stored models", () => {
      storedModels = new Set(benchmarkData().dataset.models.map((model) => model.id));
      benchmark = vectors("benchmark.json") as typeof benchmark;
    });

    Then("every composite-index entry names a stored model", () => {
      const names = Object.keys(benchmark.compositeIndex);
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) {
        expect(storedModels.has(name), `vector model ${name} must be stored`).toBe(true);
      }
    });

    And("every substitute-finder target and option names a stored model", () => {
      expect(storedModels.has(benchmark.substitutes.target), "substitute target must be stored").toBe(true);
      for (const option of benchmark.substitutes.options) {
        expect(storedModels.has(option.id), `substitute option ${option.id} must be stored`).toBe(true);
      }
    });
  });

  // @scenario specs/libs/ayokoding-data/behaviours/vectors/test-vectors.feature: Calculator vectors name stored cities
  Scenario("Calculator vectors name stored cities", ({ Given, When, Then }) => {
    let storedCities = new Set<string>();
    let calculator: { essentialsLocal: { city: string }[]; savingsRow: { city: string }[] } = {
      essentialsLocal: [],
      savingsRow: [],
    };

    Given("the ayokoding-data library source tree", () => {
      expect(existsSync(ROOT)).toBe(true);
    });

    When("the calculator vectors are compared to the stored cities", () => {
      storedCities = new Set(
        (json("cost-of-living.json") as { cities: { id: string }[] }).cities.map((city) => city.id),
      );
      calculator = vectors("calculator.json") as typeof calculator;
    });

    Then("every essentials row and every savings row names a stored city", () => {
      expect(calculator.essentialsLocal.length).toBeGreaterThan(0);
      for (const row of [...calculator.essentialsLocal, ...calculator.savingsRow]) {
        expect(storedCities.has(row.city), `vector city ${row.city} must be stored`).toBe(true);
      }
    });
  });

  // @scenario specs/libs/ayokoding-data/behaviours/vectors/test-vectors.feature: URL-state vectors keep their benchmark and calculator keys
  Scenario("URL-state vectors keep their benchmark and calculator keys", ({ Given, When, Then, And }) => {
    const calculatorKeys = [
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
    let urlState: { benchmark?: unknown; calculator?: { state: Record<string, unknown> }[] } = {};

    Given("the ayokoding-data library source tree", () => {
      expect(existsSync(ROOT)).toBe(true);
    });

    When("the url-state vectors are read", () => {
      urlState = vectors("url-state.json") as typeof urlState;
    });

    Then('the url-state vectors keep the "benchmark" and "calculator" keys', () => {
      expect(urlState.benchmark, "url-state must keep benchmark").toBeDefined();
      expect(urlState.calculator, "url-state must keep calculator").toBeDefined();
    });

    And("every calculator state key is a known calculator query key", () => {
      for (const { state } of urlState.calculator ?? []) {
        for (const key of Object.keys(state)) {
          expect(calculatorKeys, `unknown calculator state key ${key}`).toContain(key);
        }
      }
    });
  });
});
