// Integration bindings: the same pure checks as the unit suite, run on the checked-in files. ADA-015 is bound
// here too: it imports the site's data adapters to prove they decode the same checked-in files.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
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
  type BenchmarkDataset,
  type BenchmarkVector,
  type CalculatorVector,
  type FxDataset,
  type LivingDataset,
  type UrlStateVector,
} from "../../src/dataset-checks";
import { dataset as siteBenchmarkDataset } from "../../../../apps/ayokoding-www/src/features/ai-benchmark/core/data/models";
import {
  cities as siteCities,
  countries as siteCountries,
} from "../../../../apps/ayokoding-www/src/features/cost-of-living-calculator/core/data/cities";
import { fx as siteFx } from "../../../../apps/ayokoding-www/src/features/cost-of-living-calculator/core/data/fx";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..", "..");
const dataDir = path.join(ROOT, "data");
const vectorsDir = path.join(ROOT, "test-vectors");
const provenancePath = path.join(ROOT, "provenance.md");

function json(name: string): unknown {
  const file = path.join(dataDir, name);
  expect(existsSync(file), `missing data file: ${file}`).toBe(true);
  return JSON.parse(readFileSync(file, "utf8")) as unknown;
}

function vectors(name: string): unknown {
  const file = path.join(vectorsDir, name);
  expect(existsSync(file), `missing vector file: ${file}`).toBe(true);
  return JSON.parse(readFileSync(file, "utf8")) as unknown;
}

function provenance(): string {
  expect(existsSync(provenancePath), `missing ${provenancePath}`).toBe(true);
  return readFileSync(provenancePath, "utf8");
}

function benchmarkData(): BenchmarkDataset {
  return json("ai-benchmark.json") as BenchmarkDataset;
}

function livingData(): LivingDataset {
  return json("cost-of-living.json") as LivingDataset;
}

function fxData(): FxDataset {
  return json("fx.json") as FxDataset;
}

function otherDataFiles(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const name of readdirSync(dataDir).filter((file) => file !== "fx.json")) {
    files[name] = readFileSync(path.join(dataDir, name), "utf8");
  }
  return files;
}

const provenanceFeature = await loadFeature(
  path.resolve(ROOT, "../../specs/libs/ayokoding-data/behaviours/provenance/source-provenance.feature"),
);

describeFeature(
  provenanceFeature,
  ({ Scenario }) => {
    // @scenario specs/libs/ayokoding-data/behaviours/provenance/source-provenance.feature: Snapshot dates in the provenance record match each dataset's own date
    Scenario("Snapshot dates in the provenance record match each dataset's own date", ({ Given, When, Then }) => {
      let record = "";
      let findings: string[] = [];

      Given("the shared provenance record", () => {
        record = provenance();
      });

      When("the provenance record is checked against the stored datasets", () => {
        const dates = [benchmarkData().dataset.lastUpdated, livingData().snapshotDate, fxData().fxSnapshotDate];
        findings = checkProvenanceDates(record, dates);
      });

      Then(
        "the record carries the snapshot date of data/ai-benchmark.json, data/cost-of-living.json, and data/fx.json",
        () => {
          expect(findings).toEqual([]);
        },
      );
    });
  },
  { excludeTags: ["integration-exempt"] },
);

const validationFeature = await loadFeature(
  path.resolve(ROOT, "../../specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature"),
);

describeFeature(
  validationFeature,
  ({ Scenario }) => {
    // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: A consumer finds all datasets and test vectors at their documented paths
    Scenario(
      "A consumer finds all datasets and test vectors at their documented paths",
      ({ Given, When, Then, And }) => {
        let findings: string[] = [];

        Given("the ayokoding-data library source tree", () => {
          expect(existsSync(ROOT)).toBe(true);
        });

        When("the dataset inventory is inspected", () => {
          const present = REQUIRED_INVENTORY.filter((rel) => existsSync(path.join(ROOT, rel)));
          findings = checkInventory(present, REQUIRED_INVENTORY);
        });

        Then(
          "data/ai-benchmark.json, data/cost-of-living.json, data/fx.json, provenance.md, and test-vectors/ exist",
          () => {
            expect(findings).toEqual([]);
          },
        );

        And("test-vectors/benchmark.json, test-vectors/calculator.json, and test-vectors/url-state.json exist", () => {
          expect(findings).toEqual([]);
          for (const name of ["benchmark.json", "calculator.json", "url-state.json"]) {
            vectors(name);
          }
        });
      },
    );

    // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Every benchmark model has a known id, a pinned figure version, and a source
    Scenario(
      "Every benchmark model has a known id, a pinned figure version, and a source",
      ({ Given, When, Then, And }) => {
        let findings: string[] = [];

        Given("the ayokoding-data library source tree", () => {
          expect(existsSync(ROOT)).toBe(true);
        });

        When("each benchmark model is checked against the benchmark specs", () => {
          findings = checkBenchmarkModels(benchmarkData());
        });

        Then("every model id is unique and every figure names a known benchmark", () => {
          expect(findings).toEqual([]);
        });

        And("every figure is pinned to that benchmark's version and carries a source", () => {
          expect(findings).toEqual([]);
        });
      },
    );

    // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Every calculator city resolves through the shared FX table
    Scenario("Every calculator city resolves through the shared FX table", ({ Given, When, Then, And }) => {
      let findings: string[] = [];

      Given("the ayokoding-data library source tree", () => {
        expect(existsSync(ROOT)).toBe(true);
      });

      When("each calculator city is checked against the country and FX tables", () => {
        findings = checkCityResolution(livingData(), fxData());
      });

      Then("every city names a listed country", () => {
        expect(findings).toEqual([]);
      });

      And("every city currency has a positive rate in the shared FX table", () => {
        expect(findings).toEqual([]);
      });
    });

    // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: The FX table is the only home for rates, USD is 1, and every rate is positive
    Scenario(
      "The FX table is the only home for rates, USD is 1, and every rate is positive",
      ({ Given, When, Then, And }) => {
        let findings: string[] = [];

        Given("the ayokoding-data library source tree", () => {
          expect(existsSync(ROOT)).toBe(true);
        });

        When("the rate tables are read", () => {
          findings = checkRateHome(fxData(), livingData() as unknown as Record<string, unknown>, otherDataFiles());
        });

        Then("data/fx.json holds every rate and no other dataset file holds a rate table", () => {
          expect(findings).toEqual([]);
        });

        And("the USD rate is 1", () => {
          expect(findings).toEqual([]);
        });

        And("every rate is greater than 0", () => {
          expect(findings).toEqual([]);
        });
      },
    );

    // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Snapshot dates are ISO dates and no source check is later than the dataset date
    Scenario(
      "Snapshot dates are ISO dates and no source check is later than the dataset date",
      ({ Given, When, Then, And }) => {
        let findings: string[] = [];

        Given("the ayokoding-data library source tree", () => {
          expect(existsSync(ROOT)).toBe(true);
        });

        When("the snapshot dates are read", () => {
          findings = checkSnapshotDates(benchmarkData(), livingData(), fxData());
        });

        Then("every snapshot date is an ISO date", () => {
          expect(findings).toEqual([]);
        });

        And("no operator or price source was checked after the dataset's last update", () => {
          expect(findings).toEqual([]);
        });
      },
    );

    // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Tier anchors are general-access models with descending floors on every benchmark
    Scenario(
      "Tier anchors are general-access models with descending floors on every benchmark",
      ({ Given, When, Then, And }) => {
        let findings: string[] = [];

        Given("the ayokoding-data library source tree", () => {
          expect(existsSync(ROOT)).toBe(true);
        });

        When("the tier anchors are read", () => {
          findings = checkTierAnchors(benchmarkData());
        });

        Then("every anchor model is general-access and has a figure on its benchmark", () => {
          expect(findings).toEqual([]);
        });

        And(
          "on every benchmark the ultra floor is above the planning floor, which is above the execution floor",
          () => {
            expect(findings).toEqual([]);
          },
        );
      },
    );

    // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Substitute-finder harnesses stay inside the offered catalog harnesses
    Scenario("Substitute-finder harnesses stay inside the offered catalog harnesses", ({ Given, When, Then, And }) => {
      let findings: string[] = [];

      Given("the ayokoding-data library source tree", () => {
        expect(existsSync(ROOT)).toBe(true);
      });

      When("the substitute-finder settings are read", () => {
        findings = checkSubstituteHarnesses(benchmarkData());
      });

      Then("every substitute harness is an offered catalog harness", () => {
        expect(findings).toEqual([]);
      });

      And("the default substitute harness is one of the substitute harnesses", () => {
        expect(findings).toEqual([]);
      });
    });

    // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: The role matrix keeps a 15-rung ladder with ordered percentile salaries
    Scenario(
      "The role matrix keeps a 15-rung ladder with ordered percentile salaries",
      ({ Given, When, Then, And }) => {
        let findings: string[] = [];

        Given("the ayokoding-data library source tree", () => {
          expect(existsSync(ROOT)).toBe(true);
        });

        When("the role matrix is read", () => {
          findings = checkRoleMatrix(livingData());
        });

        Then("the ladder has 15 ranked rungs", () => {
          expect(findings).toEqual([]);
        });

        And("every country lists 15 roles whose 25th, 50th, and 75th percentile salaries ascend", () => {
          expect(findings).toEqual([]);
        });
      },
    );

    // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: Country effective-rate bands ascend from low to mid to high
    Scenario("Country effective-rate bands ascend from low to mid to high", ({ Given, When, Then }) => {
      let findings: string[] = [];

      Given("the ayokoding-data library source tree", () => {
        expect(existsSync(ROOT)).toBe(true);
      });

      When("each country's effective-rate band is read", () => {
        findings = checkEffectiveRates(livingData());
      });

      Then("the mid band is at least the low band and the high band is at least the mid band", () => {
        expect(findings).toEqual([]);
      });
    });

    // @scenario specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature: The site decodes the same dataset values the library publishes
    Scenario("The site decodes the same dataset values the library publishes", ({ Given, When, Then }) => {
      let library: { models: unknown; countries: unknown; cities: unknown; rates: unknown } | undefined;
      let shown: { models: unknown; countries: unknown; cities: unknown; rates: unknown } | undefined;

      Given("the neutral dataset files the library publishes", () => {
        library = {
          models: benchmarkData().dataset.models,
          countries: livingData().countries,
          cities: livingData().cities,
          rates: fxData().ratesUsdPerUnit,
        };
      });

      When("the site reads its benchmark and cost-of-living data from those files", () => {
        shown = {
          models: siteBenchmarkDataset.models,
          countries: siteCountries,
          cities: siteCities,
          rates: siteFx.ratesUsdPerUnit,
        };
      });

      Then("the models, countries, cities, and rates it shows equal the library's values", () => {
        expect(shown).toBeDefined();
        expect(shown).toEqual(library);
      });
    });
  },
  { excludeTags: ["integration-exempt"] },
);

const vectorsFeature = await loadFeature(
  path.resolve(ROOT, "../../specs/libs/ayokoding-data/behaviours/vectors/test-vectors.feature"),
);

describeFeature(
  vectorsFeature,
  ({ Scenario }) => {
    // @scenario specs/libs/ayokoding-data/behaviours/vectors/test-vectors.feature: Benchmark vectors name stored models
    Scenario("Benchmark vectors name stored models", ({ Given, When, Then, And }) => {
      let findings: string[] = [];

      Given("the ayokoding-data library source tree", () => {
        expect(existsSync(ROOT)).toBe(true);
      });

      When("the benchmark vectors are compared to the stored models", () => {
        findings = checkBenchmarkVectors(vectors("benchmark.json") as BenchmarkVector, benchmarkData());
      });

      Then("every composite-index entry names a stored model", () => {
        expect(findings).toEqual([]);
      });

      And("every substitute-finder target and option names a stored model", () => {
        expect(findings).toEqual([]);
      });
    });

    // @scenario specs/libs/ayokoding-data/behaviours/vectors/test-vectors.feature: Calculator vectors name stored cities
    Scenario("Calculator vectors name stored cities", ({ Given, When, Then }) => {
      let findings: string[] = [];

      Given("the ayokoding-data library source tree", () => {
        expect(existsSync(ROOT)).toBe(true);
      });

      When("the calculator vectors are compared to the stored cities", () => {
        findings = checkCalculatorVectors(vectors("calculator.json") as CalculatorVector, livingData());
      });

      Then("every essentials row and every savings row names a stored city", () => {
        expect(findings).toEqual([]);
      });
    });

    // @scenario specs/libs/ayokoding-data/behaviours/vectors/test-vectors.feature: URL-state vectors keep their benchmark and calculator keys
    Scenario("URL-state vectors keep their benchmark and calculator keys", ({ Given, When, Then, And }) => {
      let findings: string[] = [];

      Given("the ayokoding-data library source tree", () => {
        expect(existsSync(ROOT)).toBe(true);
      });

      When("the url-state vectors are read", () => {
        findings = checkUrlStateKeys(vectors("url-state.json") as UrlStateVector);
      });

      Then('the url-state vectors keep the "benchmark" and "calculator" keys', () => {
        expect(findings).toEqual([]);
      });

      And("every calculator state key is a known calculator query key", () => {
        expect(findings).toEqual([]);
      });
    });
  },
  { excludeTags: ["integration-exempt"] },
);
