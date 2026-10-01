// AI BENCHMARK — dataset types.
//
// One shape for the whole roster: the page, the substitute finder, and the reference generator all
// read these types. Only independently run results are stored — vendor-reported figures are never
// recorded, so nothing here needs an "origin" flag to keep them out of the score.

/** The three benchmarks that make up the composite index. Versions are pinned in `benchmarks.ts`. */
export type BenchmarkId = "deep-swe" | "terminal-bench" | "swe-atlas-qna";

/** The independent operators whose published runs supply the figures. */
export type OperatorId = "artificial-analysis" | "datacurve" | "terminal-bench" | "vals" | "scale";

/**
 * The five harnesses used as page filters. claude-code = Claude Code, codex-cli = Codex CLI,
 * cursor = Cursor, opencode-go = OpenCode Go, opencode-zen = OpenCode Zen.
 */
export type HarnessId = "claude-code" | "codex-cli" | "cursor" | "opencode-go" | "opencode-zen";

/** The three tiers defined by an anchor model, highest first. */
export type AnchoredTier = "ultra" | "planning" | "execution";

/** Every tier a model can land in: the anchored tiers, `fast` below them, and `insufficient`. */
export type Tier = AnchoredTier | "fast" | "insufficient";

/** `limited` = invite-only or staged rollout; such a model is shown and labelled, never an anchor. */
export type Access = "general" | "limited";

/** One independently run benchmark result. */
export type Figure = {
  benchmark: BenchmarkId;
  /** The benchmark version the operator ran; only the pinned version enters the composite. */
  version: string;
  /** Percentage of tasks solved, 0–100. */
  value: number;
  operator: OperatorId;
  /** The harness and effort setting the operator used, e.g. "Claude Code, max effort". */
  config: string;
  /** Page the figure was read from. */
  source: string;
};

/** The standard API price per 1M tokens, USD. */
export type ApiPrice = {
  input: number;
  output: number;
  source: string;
  /**
   * `vendor` = the model vendor's own pricing page; `opencode` = the rate OpenCode lists, used only
   * when the vendor publishes no reachable price page.
   */
  listedBy: "vendor" | "opencode";
  /** Promotions, peak/off-peak schedules, or long-context surcharges worth knowing. */
  note?: string;
};

/** Average spend per benchmark task, as published by an independent operator. */
export type CostPerTask = {
  usd: number;
  operator: OperatorId;
  source: string;
};

export type Model = {
  id: string;
  name: string;
  vendor: string;
  /** Model family within a vendor (e.g. "Opus"); latest and previous generation are kept per line. */
  line: string;
  /** ISO date of general availability (or preview launch); absent when no source states it. */
  releaseDate?: string;
  access: Access;
  harnesses: HarnessId[];
  figures: Figure[];
  /** Absent when no API price is published (e.g. limited-access or free-preview models). */
  price?: ApiPrice;
  costPerTask?: CostPerTask;
  /** Short qualifier shown with the row, e.g. how access is limited. */
  note?: string;
};

export type Dataset = {
  /** ISO date the roster, figures, and prices were last checked as a whole. */
  lastUpdated: string;
  models: Model[];
};
