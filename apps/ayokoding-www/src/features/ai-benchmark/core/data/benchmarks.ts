// AI BENCHMARK — scoring constants.
//
// Everything the methodology section states (benchmarks, versions, weights, operator order,
// minimum coverage, tier anchors) is read from here, so the page text and the scoring code cannot
// drift apart. No figures live here.

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

/**
 * The composite benchmarks, in column order. Equal weights: each is a different kind of coding
 * work (long-horizon repository changes, terminal tasks, and codebase question answering).
 */
export const BENCHMARK_SPECS: readonly BenchmarkSpec[] = [
  {
    id: "deep-swe",
    name: "DeepSWE",
    version: "1.1",
    weight: 1,
    operatorOrder: ["artificial-analysis", "datacurve"],
    url: "https://deepswe.datacurve.ai/",
  },
  {
    id: "terminal-bench",
    name: "Terminal-Bench",
    version: "4.0",
    weight: 1,
    operatorOrder: ["artificial-analysis", "terminal-bench", "vals"],
    url: "https://www.tbench.ai/",
  },
  {
    id: "swe-atlas-qna",
    name: "SWE-Atlas",
    version: "QnA",
    weight: 1,
    operatorOrder: ["artificial-analysis", "scale"],
    url: "https://labs.scale.com/leaderboard/sweatlas-qna",
  },
];

/** Look up a benchmark's spec. Every `BenchmarkId` has exactly one entry above. */
export function benchmarkSpec(id: BenchmarkId): BenchmarkSpec {
  return BENCHMARK_SPECS.find((s) => s.id === id) as BenchmarkSpec;
}

/** A model needs independent scores on at least this many composite benchmarks to be tiered. */
export const MIN_SCORED_BENCHMARKS = 2;

/** The composite index is a mean of percentages, so it never exceeds this. */
export const COMPOSITE_INDEX_MAX = 100;

/**
 * One previous-generation anchor per tier, highest tier first. A model belongs to the highest
 * tier whose anchor's composite index it matches or beats.
 */
export const TIER_ANCHORS: Readonly<Record<AnchoredTier, string>> = {
  ultra: "claude-opus-5",
  planning: "gpt-5.6-sol",
  execution: "gpt-5.6-terra",
};

/** Anchored tiers in the order they are tested. */
export const ANCHORED_TIERS: readonly AnchoredTier[] = ["ultra", "planning", "execution"];

/** Every tier in display order. */
export const TIERS: readonly Tier[] = ["ultra", "planning", "execution", "fast", "insufficient"];

/** Vendors treated as frontier labs; their models are the substitute finder's targets. */
export const FRONTIER_VENDORS: readonly string[] = ["Anthropic", "OpenAI", "Google", "xAI"];

/**
 * In-house model lines of the listed harnesses: a harness vendor's own models, served only in its
 * harness. The roster carries every served generation of each line, up to three.
 */
export const HARNESS_IN_HOUSE_LINES: readonly { harness: HarnessId; vendor: string; line: string }[] = [
  { harness: "cursor", vendor: "Cursor", line: "Composer" },
];

/** The harness whose models the substitute finder suggests. */
export const SUBSTITUTE_HARNESS: HarnessId = "opencode-go";

/** How many nearest options the finder shows when no substitute reaches the target's tier. */
export const NEAREST_OPTION_COUNT = 3;

/**
 * Models the methodology's worked example uses: one model's index arithmetic, and one model compared
 * with a tier anchor.
 */
export const METHOD_EXAMPLE = {
  indexModel: "glm-5.3",
  compareModel: "kimi-k3",
  compareTier: "execution",
} as const satisfies { indexModel: string; compareModel: string; compareTier: AnchoredTier };

/** Display names for the five harnesses — proper nouns, not translated. */
export const HARNESS_DISPLAY_NAMES: Readonly<Record<HarnessId, string>> = {
  "claude-code": "Claude Code",
  "codex-cli": "Codex CLI",
  cursor: "Cursor",
  "opencode-go": "OpenCode Go",
  "opencode-zen": "OpenCode Zen",
};

/** Values for the methodology's roster sentence, read from the constants that define the roster. */
export function rosterScopeParams(): { frontier: string; substitute: string; inHouse: string } {
  return {
    frontier: FRONTIER_VENDORS.join(", "),
    substitute: HARNESS_DISPLAY_NAMES[SUBSTITUTE_HARNESS],
    inHouse: HARNESS_IN_HOUSE_LINES.map((l) => `${l.vendor} ${l.line}`).join(", "),
  };
}

/** Blended price weighting: three input tokens for every output token. */
export const BLEND_INPUT_SHARE = 3;
export const BLEND_OUTPUT_SHARE = 1;
