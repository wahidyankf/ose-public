// ayokoding-data unit tests: the shared JSON is structurally sound, matches its
// provenance record, and stays consistent with the checked-in test vectors.
// In-memory only: JSON is parsed, never executed, and no product service runs.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
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

type Model = {
  id: string;
  access: string;
  harnesses: string[];
  figures: { benchmark: string; version: string; operator: string; value: number; source: string }[];
  price?: { input: number; output: number; source: string; listedBy: string };
  costPerTask?: { usd: number; operator: string };
  note?: string;
  releaseDate?: string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HARNESS_IDS = new Set([
  "claude-code",
  "codex-cli",
  "command-code",
  "command-code-pro",
  "cursor",
  "muse-code",
  "opencode-go",
  "opencode-zen",
]);

const benchmark = () =>
  json("ai-benchmark.json") as {
    dataset: { lastUpdated: string; models: Model[] };
    benchmarks: {
      specs: { id: string; version: string; operatorOrder: string[] }[];
      tierAnchors: Record<string, string>;
      defaultSubstituteHarness: string;
      substituteHarnesses: string[];
      rosterCatalogHarnesses: string[];
      harnessDisplayNames: Record<string, string>;
    };
    operators: { id: string; checkedOn: string; sourceUpdated?: string }[];
    priceSources: { checkedOn: string }[];
  };

describe("provenance record", () => {
  it("exists and names every dataset, date, and consumer contract", () => {
    expect(existsSync(provenancePath), `missing ${provenancePath}`).toBe(true);
    const provenance = readFileSync(provenancePath, "utf8");
    const data = benchmark();
    const living = json("cost-of-living.json") as { snapshotDate: string };
    const fx = json("fx.json") as { fxSnapshotDate: string };
    for (const token of [
      "data/ai-benchmark.json",
      "data/cost-of-living.json",
      "data/fx.json",
      data.dataset.lastUpdated,
      living.snapshotDate,
      fx.fxSnapshotDate,
      "never to an edited expectation",
    ]) {
      expect(provenance, `provenance must record ${token}`).toContain(token);
    }
  });
});

describe("ai-benchmark.json", () => {
  it("carries an ISO last-updated date no earlier than any source check", () => {
    const data = benchmark();
    expect(data.dataset.lastUpdated).toMatch(ISO_DATE);
    for (const s of [...data.operators, ...data.priceSources]) {
      expect(s.checkedOn).toMatch(ISO_DATE);
      expect(s.checkedOn <= data.dataset.lastUpdated).toBe(true);
    }
  });

  it("has unique model ids over known harnesses", () => {
    const { models } = benchmark().dataset;
    expect(new Set(models.map((m) => m.id)).size).toBe(models.length);
    for (const m of models) {
      for (const h of m.harnesses) expect(HARNESS_IDS, m.id).toContain(h);
    }
  });

  it("keeps figures pinned, ranged, single-per-benchmark, and explained when priced", () => {
    const data = benchmark();
    const specById = new Map(data.benchmarks.specs.map((s) => [s.id, s]));
    for (const m of data.dataset.models) {
      const seen = new Set<string>();
      for (const f of m.figures) {
        const spec = specById.get(f.benchmark);
        expect(spec, `${m.id}: unknown benchmark`).toBeDefined();
        expect(f.version, `${m.id}: unpinned figure`).toBe(spec?.version);
        expect(f.value).toBeGreaterThanOrEqual(0);
        expect(f.value).toBeLessThanOrEqual(100);
        expect(spec?.operatorOrder, `${m.id}: unknown operator`).toContain(f.operator);
        expect(seen.has(f.benchmark), `${m.id}: duplicate figure`).toBe(false);
        seen.add(f.benchmark);
      }
      if (m.access === "limited") expect(m.note, m.id).toBeTruthy();
      if (m.price === undefined) expect(m.note, m.id).toBeTruthy();
      if (m.costPerTask !== undefined) {
        expect(
          m.figures.some((f) => f.operator === m.costPerTask?.operator),
          m.id,
        ).toBe(true);
      }
    }
  });

  it("keeps the anchored tiers rated on general-access models", () => {
    const data = benchmark();
    for (const anchorId of Object.values(data.benchmarks.tierAnchors)) {
      const anchor = data.dataset.models.find((m) => m.id === anchorId);
      expect(anchor, `missing anchor ${anchorId}`).toBeDefined();
      expect(anchor?.access).toBe("general");
      expect(anchor?.figures.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps the substitute finder inside the offered catalog harnesses", () => {
    const { benchmarks } = benchmark();
    expect(benchmarks.substituteHarnesses.length).toBeGreaterThan(0);
    for (const h of benchmarks.substituteHarnesses) {
      expect([...benchmarks.rosterCatalogHarnesses, "command-code-pro"], h).toContain(h);
    }
    expect(benchmarks.substituteHarnesses).toContain(benchmarks.defaultSubstituteHarness);
    expect(Object.keys(benchmarks.harnessDisplayNames).sort()).toEqual([...HARNESS_IDS].sort());
  });
});

describe("cost-of-living.json and fx.json", () => {
  it("keeps two independent ISO snapshot dates and one fx home", () => {
    const living = json("cost-of-living.json") as Record<string, unknown>;
    const fx = json("fx.json") as { fxSnapshotDate: string; ratesUsdPerUnit: Record<string, number> };
    expect(living["snapshotDate"]).toMatch(ISO_DATE);
    expect(fx.fxSnapshotDate).toMatch(ISO_DATE);
    expect(fx.fxSnapshotDate).not.toBe(living["snapshotDate"]);
    expect(living, "fx must live only in fx.json").not.toHaveProperty("fx");
    expect(living, "fx must live only in fx.json").not.toHaveProperty("ratesUsdPerUnit");
    expect(fx.ratesUsdPerUnit["USD"]).toBe(1);
    for (const [code, rate] of Object.entries(fx.ratesUsdPerUnit)) {
      expect(rate, code).toBeGreaterThan(0);
    }
  });

  it("resolves every city through the shared fx table", () => {
    const living = json("cost-of-living.json") as {
      countries: { id: string; effectiveRate: Record<string, { amount: number }> }[];
      cities: { id: string; countryId: string; currency: string; region: string; subNational?: unknown }[];
    };
    const fx = json("fx.json") as { ratesUsdPerUnit: Record<string, number> };
    const countryIds = new Set(living.countries.map((c) => c.id));
    for (const city of living.cities) {
      expect(countryIds.has(city.countryId), city.id).toBe(true);
      expect(fx.ratesUsdPerUnit[city.currency], `${city.id} currency`).toBeGreaterThan(0);
      if (["us", "ca", "ch"].includes(city.countryId)) {
        expect(city.subNational, city.id).toBeDefined();
      } else {
        expect(city, `${city.id} must not gain subNational`).not.toHaveProperty("subNational");
      }
    }
    for (const country of living.countries) {
      const { low, mid, high } = country.effectiveRate as unknown as Record<string, never> as Record<
        "low" | "mid" | "high",
        { amount: number }
      >;
      expect(mid.amount).toBeGreaterThanOrEqual(low.amount);
      expect(high.amount).toBeGreaterThanOrEqual(mid.amount);
    }
  });

  it("keeps a 15-rung ladder and a full role matrix", () => {
    const living = json("cost-of-living.json") as {
      roleMatrix: {
        snapshotDate: string;
        ladder: { role: string; rank: number }[];
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
      snapshotDate: string;
    };
    expect(living.roleMatrix.snapshotDate).toBe(living.snapshotDate);
    expect(living.roleMatrix.ladder).toHaveLength(15);
    expect(living.roleMatrix.ladder.map((r) => r.rank)).toEqual(living.roleMatrix.ladder.map((_, i) => i + 1));
    const countryIds = Object.keys(living.roleMatrix.salaries);
    expect(countryIds.length).toBeGreaterThan(0);
    for (const [countryId, roles] of Object.entries(living.roleMatrix.salaries)) {
      expect(Object.keys(roles)).toHaveLength(15);
      for (const [role, dist] of Object.entries(roles)) {
        expect(dist.p25.monthlyGrossLocal, `${countryId}/${role}`).toBeGreaterThan(0);
        expect(dist.median.monthlyGrossLocal, `${countryId}/${role}`).toBeGreaterThanOrEqual(
          dist.p25.monthlyGrossLocal,
        );
        expect(dist.p75.monthlyGrossLocal, `${countryId}/${role}`).toBeGreaterThanOrEqual(
          dist.median.monthlyGrossLocal,
        );
      }
    }
  });
});

describe("test-vectors consistency", () => {
  it("references only dataset models, cities, and url keys", () => {
    const data = benchmark();
    const modelIds = new Set(data.dataset.models.map((m) => m.id));
    const b = vectors("benchmark.json") as {
      compositeIndex: Record<string, number | null>;
      substitutes: { target: string; options: { id: string }[] };
    };
    for (const id of Object.keys(b.compositeIndex)) expect(modelIds.has(id), id).toBe(true);
    expect(modelIds.has(b.substitutes.target)).toBe(true);
    for (const o of b.substitutes.options) expect(modelIds.has(o.id), o.id).toBe(true);

    const living = json("cost-of-living.json") as { cities: { id: string }[] };
    const cityIds = new Set(living.cities.map((c) => c.id));
    const c = vectors("calculator.json") as {
      savingsRow: { city: string }[];
      minimumRole: { baselineUsd: number; role: string | null }[];
    };
    for (const row of c.savingsRow) expect(cityIds.has(row.city), row.city).toBe(true);

    const u = vectors("url-state.json") as {
      benchmark: { query: string; state: Record<string, unknown> }[];
      calculator: { query: string; state: Record<string, unknown> }[];
    };
    for (const { state } of u.benchmark) {
      expect(Object.keys(state).sort()).toEqual(
        Object.keys(state)
          .filter((k) => ["harness", "tier", "sub", "subHarness"].includes(k))
          .sort(),
      );
    }
    for (const { state } of u.calculator) {
      for (const key of Object.keys(state)) {
        expect(
          ["tab", "region", "countryId", "cityId", "household", "schoolType", "area", "gross", "minRole"],
          `unknown calculator state key ${key}`,
        ).toContain(key);
      }
    }
  });
});
