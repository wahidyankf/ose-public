// In-memory documents for the unit doubles. They mirror the shape of the checked-in datasets at a small size,
// so every check can be shown to pass on a valid document and to report each violation on a broken copy.
import type {
  Band,
  BenchmarkDataset,
  BenchmarkVector,
  CalculatorVector,
  FxDataset,
  LivingDataset,
  UrlStateVector,
} from "../../src/dataset-checks";

const band = (base: number): Band => ({
  p25: { monthlyGrossLocal: base },
  median: { monthlyGrossLocal: base + 100 },
  p75: { monthlyGrossLocal: base + 200 },
});

const roles = (base: number): Record<string, Band> =>
  Object.fromEntries(Array.from({ length: 15 }, (_, index) => [`role-${index + 1}`, band(base + index)]));

export function benchmarkFixture(): BenchmarkDataset {
  const tiers = { ultra: "model-a", planning: "model-b", execution: "model-c" };
  return {
    dataset: {
      lastUpdated: "2026-03-01",
      models: [
        {
          id: "model-a",
          access: "general",
          figures: [
            { benchmark: "bench-1", version: "v1", value: 90, source: "src-a" },
            { benchmark: "bench-2", version: "v2", value: 85, source: "src-a" },
          ],
        },
        {
          id: "model-b",
          access: "general",
          figures: [
            { benchmark: "bench-1", version: "v1", value: 70, source: "src-b" },
            { benchmark: "bench-2", version: "v2", value: 65, source: "src-b" },
          ],
        },
        {
          id: "model-c",
          access: "general",
          figures: [
            { benchmark: "bench-1", version: "v1", value: 50, source: "src-c" },
            { benchmark: "bench-2", version: "v2", value: 45, source: "src-c" },
          ],
        },
      ],
    },
    benchmarks: {
      specs: [
        { id: "bench-1", version: "v1" },
        { id: "bench-2", version: "v2" },
      ],
      benchmarkTierAnchors: { "bench-1": { ...tiers }, "bench-2": { ...tiers } },
      defaultSubstituteHarness: "claude-code",
      substituteHarnesses: ["claude-code", "command-code-pro"],
      rosterCatalogHarnesses: ["claude-code"],
    },
    operators: [{ checkedOn: "2026-02-01" }],
    priceSources: [{ checkedOn: "2026-02-15" }],
  };
}

export function livingFixture(): LivingDataset {
  return {
    snapshotDate: "2026-02-20",
    countries: [
      {
        id: "country-1",
        effectiveRate: { low: { amount: 10 }, mid: { amount: 20 }, high: { amount: 30 } },
      },
    ],
    cities: [{ id: "city-1", countryId: "country-1", currency: "EUR" }],
    roleMatrix: {
      ladder: Array.from({ length: 15 }, (_, index) => ({ rank: index + 1 })),
      salaries: { "country-1": roles(1000) },
    },
  };
}

export function fxFixture(): FxDataset {
  return { fxSnapshotDate: "2026-02-20", ratesUsdPerUnit: { USD: 1, EUR: 1.1 } };
}

// The provenance record as the checked-in file carries the three snapshot dates.
export const PROVENANCE_RECORD = "Snapshots: 2026-03-01 (ai-benchmark), 2026-02-20 (cost-of-living, fx).";

export function benchmarkVectorFixture(): BenchmarkVector {
  return {
    compositeIndex: { "model-a": 80, "model-b": null },
    substitutes: { target: "model-a", options: [{ id: "model-b" }] },
  };
}

export function calculatorVectorFixture(): CalculatorVector {
  return { essentialsLocal: [{ city: "city-1" }], savingsRow: [{ city: "city-1" }] };
}

export function urlStateFixture(): UrlStateVector {
  return { benchmark: {}, calculator: [{ state: { tab: "calculator", region: "eu" } }] };
}

// Narrows an optional fixture element, failing the test loudly if the fixture shape changed.
export function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    throw new Error(`fixture is missing ${what}`);
  }
  return value;
}
