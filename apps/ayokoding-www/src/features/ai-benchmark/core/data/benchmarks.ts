// AI BENCHMARK — scoring constants.
//
// Everything the methodology section states (benchmarks, versions, weights, operator order,
// minimum coverage, tier anchors) is read from here, so the page text and the scoring code cannot
// drift apart. No figures live here.
//
// Values live in `libs/ayokoding-data/data/ai-benchmark.json` (provenance in
// `libs/ayokoding-data/provenance.md`). This module keeps the original path and named exports;
// the JSON is the only declaration.
import benchmarkJson from "../../../../../../../libs/ayokoding-data/data/ai-benchmark.json";
import type { AnchoredTier, BenchmarkId, HarnessId, OperatorId, Tier } from "./types";

export type BenchmarkSpec = {
  id: BenchmarkId;
  /** Proper-noun display name (not translated). */
  name: string;
  /** The only version whose figures enter the composite. */
  version: string;
  /** Relative weight in the composite. */
  weight: number;
  /** Operators tried in order when picking a model's figure for this benchmark. */
  operatorOrder: readonly OperatorId[];
  /** Benchmark home page. */
  url: string;
};

const config = benchmarkJson.benchmarks;

/**
 * The composite benchmarks, in column order. Equal weights: each is a different kind of coding
 * work (long-horizon repository changes, terminal tasks, and codebase question answering).
 */
export const BENCHMARK_SPECS: readonly BenchmarkSpec[] = config.specs as BenchmarkSpec[];

/** Look up a benchmark's spec. Every `BenchmarkId` has exactly one entry above. */
export function benchmarkSpec(id: BenchmarkId): BenchmarkSpec {
  return BENCHMARK_SPECS.find((s) => s.id === id) as BenchmarkSpec;
}

/** A model needs independent scores on at least this many composite benchmarks to be tiered. */
export const MIN_SCORED_BENCHMARKS: number = config.minScoredBenchmarks;

/** The composite index is a mean of percentages, so it never exceeds this. */
export const COMPOSITE_INDEX_MAX: number = config.compositeIndexMax;

/**
 * One previous-generation anchor per tier, highest tier first. A model belongs to the highest
 * tier whose anchor's composite index it matches or beats.
 */
export const TIER_ANCHORS: Readonly<Record<AnchoredTier, string>> = config.tierAnchors as Record<AnchoredTier, string>;

/** Anchored tiers in the order they are tested. */
export const ANCHORED_TIERS: readonly AnchoredTier[] = config.anchoredTiers as AnchoredTier[];

/** Every tier in display order. */
export const TIERS: readonly Tier[] = config.tiers as Tier[];

/** Vendors treated as frontier labs; their models are the substitute finder's targets. */
export const FRONTIER_VENDORS: readonly string[] = config.frontierVendors;

/**
 * In-house model lines of the listed harnesses: a harness vendor's own models, served only in its
 * harness. The roster carries every served generation of each line, up to three.
 */
export const HARNESS_IN_HOUSE_LINES: readonly { harness: HarnessId; vendor: string; line: string }[] =
  config.harnessInHouseLines as { harness: HarnessId; vendor: string; line: string }[];

/** The harnesses the substitute finder can search, in menu order. */
export const SUBSTITUTE_HARNESSES: readonly HarnessId[] = config.substituteHarnesses as HarnessId[];

/** The harness the substitute finder searches until the reader picks another. */
export const DEFAULT_SUBSTITUTE_HARNESS: HarnessId = config.defaultSubstituteHarness as HarnessId;

/**
 * Harnesses whose whole catalog the roster covers: every model they offer that names a vendor.
 * Command Code Pro is a plan inside the Command Code catalog, so it adds no models of its own.
 */
export const ROSTER_CATALOG_HARNESSES: readonly HarnessId[] = config.rosterCatalogHarnesses as HarnessId[];

/** How many nearest options the finder shows when no substitute reaches the target's tier. */
export const NEAREST_OPTION_COUNT: number = config.nearestOptionCount;

/**
 * Models the methodology's worked example uses: one model's index arithmetic, and one model compared
 * with a tier anchor.
 */
export const METHOD_EXAMPLE = config.methodExample as {
  indexModel: string;
  compareModel: string;
  compareTier: AnchoredTier;
};

/** Display names for the eight harnesses — proper nouns, not translated. */
export const HARNESS_DISPLAY_NAMES: Readonly<Record<HarnessId, string>> = config.harnessDisplayNames as Record<
  HarnessId,
  string
>;

/**
 * Values for the methodology's roster sentence, read from the constants that define the roster.
 * `locale` is a BCP 47 tag; it only picks the conjunction that joins the catalog names.
 */
export function rosterScopeParams(locale = "en"): { frontier: string; catalogs: string; inHouse: string } {
  return {
    frontier: FRONTIER_VENDORS.join(", "),
    catalogs: new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(
      ROSTER_CATALOG_HARNESSES.map((h) => HARNESS_DISPLAY_NAMES[h]),
    ),
    inHouse: HARNESS_IN_HOUSE_LINES.map((l) => `${l.vendor} ${l.line}`).join(", "),
  };
}

/** Blended price weighting: three input tokens for every output token. */
export const BLEND_INPUT_SHARE: number = config.blendInputShare;
export const BLEND_OUTPUT_SHARE: number = config.blendOutputShare;
