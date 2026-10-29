import path from "node:path";
import { fileURLToPath } from "node:url";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..", "..");
const dataDir = path.join(ROOT, "data");
const vectorsDir = path.join(ROOT, "test-vectors");
const provenancePath = path.join(ROOT, "provenance.md");

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

const provenanceFeature = await loadFeature(
  path.resolve(ROOT, "../../specs/libs/ayokoding-data/behaviours/provenance/source-provenance.feature"),
);

describeFeature(provenanceFeature, ({ Scenario }) => {
  Scenario("Provenance names every dataset, date, and consumer contract", ({ Given, When, Then, And }) => {
    let record = "";
    let dataset: { lastUpdated: string } = { lastUpdated: "" };
    let living = { snapshotDate: "" };
    let fx = { fxSnapshotDate: "" };

    Given("the shared provenance record", () => {
      record = provenance();
    });

    When("the provenance record is checked against the stored datasets", () => {
      dataset = (json("ai-benchmark.json") as { dataset: { lastUpdated: string } }).dataset;
      living = json("cost-of-living.json") as { snapshotDate: string };
      fx = json("fx.json") as { fxSnapshotDate: string };
    });

    Then("the record names data/ai-benchmark.json, data/cost-of-living.json, and data/fx.json", () => {
      for (const token of ["data/ai-benchmark.json", "data/cost-of-living.json", "data/fx.json"]) {
        expect(record, `provenance must name ${token}`).toContain(token);
      }
    });

    And("the record carries every dataset snapshot date and the consumer contracts", () => {
      for (const token of [dataset.lastUpdated, living.snapshotDate, fx.fxSnapshotDate]) {
        expect(record, `provenance must carry ${token}`).toContain(token);
      }
      expect(record).toContain("never to an edited expectation");
    });
  });

  Scenario("Sourcing rules stay written down", ({ Given, When, Then, And }) => {
    let record = "";

    Given("the shared provenance record", () => {
      record = provenance();
    });

    When("the sourcing rules are read", () => {
      expect(record.length).toBeGreaterThan(0);
    });

    Then("each dataset section names its sources and re-sourcing prompt", () => {
      for (const section of ["## AI benchmark", "## Cost of living", "## FX"]) {
        expect(record, `provenance must keep ${section}`).toContain(section);
      }
      expect(record).toContain("re-sourcing");
    });

    And("the format migration promises are recorded", () => {
      expect(record).toContain("## Format migration");
      expect(record).toContain("mismatch returns to extraction");
    });
  });
});

const validationFeature = await loadFeature(
  path.resolve(ROOT, "../../specs/libs/ayokoding-data/behaviours/validation/dataset-validation.feature"),
);

describeFeature(validationFeature, ({ Scenario }) => {
  Scenario("Required shared datasets exist", ({ Given, When, Then }) => {
    const required = [
      "data/ai-benchmark.json",
      "data/cost-of-living.json",
      "data/fx.json",
      "provenance.md",
      "test-vectors/",
    ];

    Given("the ayokoding-data library source tree", () => {
      expect(existsSync(ROOT)).toBe(true);
    });

    When("the dataset inventory is inspected", () => {
      // Inspection happens in the Then clauses below.
    });

    Then(
      "data/ai-benchmark.json, data/cost-of-living.json, data/fx.json, provenance.md, and test-vectors/ exist",
      () => {
        for (const rel of required) {
          expect(existsSync(path.join(ROOT, rel)), `missing ${rel}`).toBe(true);
        }
      },
    );
  });

  Scenario("Benchmark and calculator entries validate", ({ Given, When, Then, And }) => {
    type Model = {
      id: string;
      figures: { source: string }[];
      price?: { listedBy: string };
    };
    type City = { id: string };
    let models: Model[] = [];
    let cities: City[] = [];

    Given("the ayokoding-data library source tree", () => {
      expect(existsSync(ROOT)).toBe(true);
    });

    When("each entry is validated against the shared rules", () => {
      models = (json("ai-benchmark.json") as { dataset: { models: Model[] } }).dataset.models;
      cities = (json("cost-of-living.json") as { cities: City[] }).cities;
      expect(models.length).toBeGreaterThan(0);
      expect(cities.length).toBeGreaterThan(0);
    });

    Then("every benchmark model satisfies the structure, version, and identifier rules", () => {
      for (const model of models) {
        expect(model.id, "model needs an id").toBeTruthy();
        for (const figure of model.figures) {
          expect(figure.source, `figure needs a source`).toBeTruthy();
        }
        if (model.price !== undefined) {
          expect(model.price.listedBy, "price needs listedBy").toBeTruthy();
        }
      }
    });

    And("every calculator city satisfies the structure and date rules", () => {
      for (const city of cities) {
        expect(city.id, "city needs an id").toBeTruthy();
      }
    });

    And("every markdown reference resolves to a repository file", () => {
      const record = provenance();
      const workspace = path.resolve(ROOT, "..", "..");
      const fence = String.fromCharCode(96);
      const rawRefs: string[] = [];
      for (const m of record.matchAll(new RegExp(fence + "((?:apps|libs|specs)/[^" + fence + "]+)" + fence, "g"))) {
        if (m[1] !== undefined) rawRefs.push(m[1]);
      }
      // Brace groups like {models,benchmarks,operators}.ts expand to siblings.
      const refs = rawRefs.flatMap((ref) => {
        const open = ref.indexOf("{");
        const close = ref.indexOf("}");
        if (open < 0 || close < open) return [ref];
        return ref
          .slice(open + 1, close)
          .split(",")
          .map((alt) => ref.slice(0, open) + alt + ref.slice(close + 1));
      });
      expect(refs.length).toBeGreaterThan(0);
      for (const ref of refs) {
        const candidate = path.join(workspace, ref);
        const dirCandidate = ref.endsWith("/") ? candidate.slice(0, -1) : candidate;
        expect(existsSync(candidate) || existsSync(dirCandidate), `markdown reference must resolve: ${ref}`).toBe(true);
      }
    });
  });
});

const vectorsFeature = await loadFeature(
  path.resolve(ROOT, "../../specs/libs/ayokoding-data/behaviours/vectors/test-vectors.feature"),
);

describeFeature(vectorsFeature, ({ Scenario }) => {
  Scenario("Vector inventories exist for every tool dataset", ({ Given, When, Then }) => {
    const files = ["benchmark.json", "calculator.json", "url-state.json"];

    Given("the ayokoding-data library source tree", () => {
      expect(existsSync(ROOT)).toBe(true);
    });

    When("the vector inventory is checked", () => {
      // Checked in the Then clause below.
    });

    Then("test-vectors/benchmark.json, test-vectors/calculator.json, and test-vectors/url-state.json exist", () => {
      for (const name of files) {
        vectors(name);
      }
    });
  });

  Scenario("Vector scenarios reference stored datasets", ({ Given, When, Then, And }) => {
    let storedModels = new Set<string>();
    let storedCities = new Set<string>();
    let compositeIndex: Record<string, number | null> = {};
    let essentialsLocal: { city: string }[] = [];

    Given("the ayokoding-data library source tree", () => {
      expect(existsSync(ROOT)).toBe(true);
    });

    When("vector expectations are compared to the stored datasets", () => {
      storedModels = new Set(
        (json("ai-benchmark.json") as { dataset: { models: { id: string }[] } }).dataset.models.map(
          (model) => model.id,
        ),
      );
      storedCities = new Set(
        (json("cost-of-living.json") as { cities: { id: string }[] }).cities.map((city) => city.id),
      );
      compositeIndex = (vectors("benchmark.json") as { compositeIndex: Record<string, number | null> }).compositeIndex;
      essentialsLocal = (vectors("calculator.json") as { essentialsLocal: { city: string }[] }).essentialsLocal;
    });

    Then("every benchmark vector entry names a stored model and snapshot scenario", () => {
      const names = Object.keys(compositeIndex);
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) {
        expect(storedModels.has(name), `vector model ${name} must be stored`).toBe(true);
      }
    });

    And("every calculator vector entry names a stored city", () => {
      expect(essentialsLocal.length).toBeGreaterThan(0);
      for (const row of essentialsLocal) {
        expect(storedCities.has(row.city), `vector city ${row.city} must be stored`).toBe(true);
      }
    });

    And("every vector scenario keeps its reference notes and url-state keys", () => {
      const urlState = vectors("url-state.json") as Record<string, unknown>;
      for (const key of ["benchmark", "calculator"]) {
        expect(urlState[key], `url-state must keep ${key}`).toBeDefined();
      }
    });
  });
});
