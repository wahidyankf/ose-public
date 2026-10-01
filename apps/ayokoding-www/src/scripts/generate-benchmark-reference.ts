// Generates the DATA TABLES of docs/reference/ai-model-benchmarks.md from the single source of truth
// at apps/ayokoding-www/src/features/ai-benchmark/core/data/models.ts, scored with the same core the
// page uses. Hand-written prose (benchmark definitions, tier rationale, caveats) is preserved
// verbatim: only the text between `<!-- BEGIN GENERATED: <name> -->` /
// `<!-- END GENERATED: <name> -->` marker pairs is rewritten.
//
// Marker-first guard: the generator locates a BEGIN/END pair BEFORE substituting and throws loudly
// when one is missing. It NEVER falls back to inserting at an anchor — an insert-style substitution
// duplicates content on every re-run.
//
// Nx targets (see apps/ayokoding-www/project.json):
//   generate-benchmark-reference  → writes the reference in place.
//   validate-benchmark-reference  → regenerates in memory and exits non-zero on drift.
//
// The rendering logic is split into PURE functions (`renderTables`, `substituteMarkers`) that take
// their inputs as arguments and do no disk I/O, so they are unit-tested directly; the `main()` shell
// below is the only place that touches the filesystem.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BENCHMARK_SPECS, FRONTIER_VENDORS } from "../features/ai-benchmark/core/data/benchmarks";
import { dataset } from "../features/ai-benchmark/core/data/models";
import type { BenchmarkId, Dataset, Model, OperatorId } from "../features/ai-benchmark/core/data/types";
import { blendedPrice } from "../features/ai-benchmark/core/price";
import { scoredFigure } from "../features/ai-benchmark/core/score";
import { scoreModels, type ScoredModel } from "../features/ai-benchmark/core/tiers";

/** A generated block's inner content, keyed by marker name. */
export type GeneratedTables = Record<string, string>;

/** Short operator labels used in table cells. */
const OPERATOR_LABEL: Record<OperatorId, string> = {
  "artificial-analysis": "AA",
  datacurve: "Datacurve",
  "terminal-bench": "TB official",
  vals: "Vals",
  scale: "Scale",
};

// ─── Pure table-rendering helpers ─────────────────────────────────────────────

/** `value% (operator)` for the model's scored figure, or `—` when it has none. */
function figureCell(model: Model, benchmark: BenchmarkId): string {
  const f = scoredFigure(model, benchmark);
  return f === undefined ? "—" : `${f.value.toFixed(2)}% (${OPERATOR_LABEL[f.operator]})`;
}

/** USD with no trailing-zero noise (5 → "$5", 0.435 → "$0.435"); `—` when absent. */
function money(n: number | undefined): string {
  return n === undefined ? "—" : `$${Number(n.toFixed(3)).toString()}`;
}

function indexCell(s: ScoredModel): string {
  return s.index === undefined ? "—" : s.index.toFixed(2);
}

/**
 * Format a GitHub-flavoured markdown table with column widths padded to the longest cell — the same
 * shape Prettier emits for markdown tables (left-aligned, dashes match column width) — so the
 * generator's output is stable under the repo's Prettier pre-commit pass and does not trip the
 * `validate-benchmark-reference` drift gate.
 */
function formatTable(header: string[], rows: string[][]): string {
  const cols = header.length;
  const all = [header, ...rows];
  const widths = Array.from({ length: cols }, (_, c) => Math.max(...all.map((r) => (r[c] ?? "").length)));
  const padRow = (cells: string[]) => "| " + cells.map((c, i) => c.padEnd(widths[i] ?? 0)).join(" | ") + " |";
  const separator = "| " + widths.map((w) => "-".repeat(w)).join(" | ") + " |";
  return [padRow(header), separator, ...rows.map(padRow)].join("\n");
}

/** A caption and a table, wrapped in the blank lines that separate a block from its markers. */
function block(caption: string, table: string): string {
  return `\n\n${caption}\n\n${table}\n\n`;
}

const BENCHMARK_HEADERS = BENCHMARK_SPECS.map((b) => `${b.name} ${b.version}`);

function renderRoster(ds: Dataset, scored: ScoredModel[]): string {
  const rows = scored
    .filter((s) => s.model.harnesses.includes("opencode-go"))
    .map((s) => [
      s.model.id,
      s.model.name,
      s.model.vendor,
      s.tier,
      indexCell(s),
      s.model.harnesses.filter((h) => h !== "opencode-go").join(", ") || "—",
    ]);
  const caption =
    `> Last updated ${ds.lastUpdated} — ${rows.length} OpenCode Go models with an identified vendor. ` +
    "Muse Spark is listed on OpenCode Go under its `-contributor` id. " +
    "Derived from `apps/ayokoding-www/src/features/ai-benchmark/core/data/models.ts`.";
  return block(caption, formatTable(["Model ID", "Name", "Vendor", "Tier", "Index", "Other harnesses"], rows));
}

function renderPricing(ds: Dataset): string {
  const rows = ds.models.map((m) => [
    m.name,
    m.vendor,
    money(m.price?.input),
    money(m.price?.output),
    money(blendedPrice(m.price)),
    m.price?.listedBy ?? "—",
    m.price?.note ?? m.note ?? "",
  ]);
  const caption =
    `> Standard API prices, USD per 1M tokens, last updated ${ds.lastUpdated}. Blended = (3 × input + ` +
    "output) ÷ 4. `opencode` = the rate OpenCode lists, used only where the vendor publishes no reachable price page.";
  return block(caption, formatTable(["Model", "Vendor", "Input", "Output", "Blended", "Listed by", "Note"], rows));
}

function renderFrontier(ds: Dataset, scored: ScoredModel[]): string {
  const rows = scored
    .filter((s) => FRONTIER_VENDORS.includes(s.model.vendor))
    .map((s) => [
      s.model.vendor,
      s.model.name,
      s.model.access,
      ...BENCHMARK_SPECS.map((b) => figureCell(s.model, b.id)),
      indexCell(s),
      s.tier,
      money(s.model.price?.input),
      money(s.model.price?.output),
    ]);
  const caption = `> Anthropic, OpenAI, Google, and xAI models, last updated ${ds.lastUpdated}. Independent results only.`;
  return block(
    caption,
    formatTable(["Vendor", "Model", "Access", ...BENCHMARK_HEADERS, "Index", "Tier", "Input", "Output"], rows),
  );
}

function renderCapabilitySummary(ds: Dataset, scored: ScoredModel[]): string {
  const rows = scored.map((s) => [
    s.model.name,
    s.model.vendor,
    ...BENCHMARK_SPECS.map((b) => figureCell(s.model, b.id)),
    indexCell(s),
    s.tier,
    s.model.costPerTask === undefined ? "—" : `$${s.model.costPerTask.usd.toFixed(2)}`,
  ]);
  const caption =
    `> Independent composite-benchmark results for every model, last updated ${ds.lastUpdated}. Index = ` +
    "equal-weight mean of the scored benchmarks (at least two); tier = highest tier whose anchor's " +
    "index the model's index matches or beats. Cost per task from Artificial Analysis.";
  return block(caption, formatTable(["Model", "Vendor", ...BENCHMARK_HEADERS, "Index", "Tier", "Cost/task"], rows));
}

/**
 * Derive every generated block from the dataset. PURE: no disk I/O, deterministic, unit-tested.
 * The keys MUST match the marker names written into the reference document.
 */
export function renderTables(ds: Dataset): GeneratedTables {
  const scored = scoreModels(ds);
  return {
    roster: renderRoster(ds, scored),
    pricing: renderPricing(ds),
    frontier: renderFrontier(ds, scored),
    "capability-summary": renderCapabilitySummary(ds, scored),
  };
}

// ─── Marker-delimited substitution (PURE) ────────────────────────────────────

interface MarkerPair {
  name: string;
  /** Index immediately AFTER the BEGIN tag (start of inner content). */
  innerStart: number;
  /** Index of the END tag's leading `<` (end of inner content). */
  innerEnd: number;
  /** Index immediately AFTER the END tag. */
  afterEnd: number;
}

/**
 * Scan the document for BEGIN/END marker pairs in order. Marker-first guard: throws if any BEGIN has
 * no following END with the SAME name (so substitution can never silently fall back to insertion,
 * which would duplicate content on re-run).
 */
function findMarkerPairs(input: string): MarkerPair[] {
  // Fresh global regex (no shared lastIndex state across invocations). Global (`/g`) SEARCHES from
  // lastIndex onward; sticky (`/y`) would ANCHOR at lastIndex and miss markers not at position 0.
  const beginTag = /<!-- BEGIN GENERATED: (\S+) -->/g;
  const pairs: MarkerPair[] = [];
  let match: RegExpExecArray | null;
  while ((match = beginTag.exec(input)) !== null) {
    const name = match[1];
    if (name === undefined) continue; // unreachable: the regex's (\S+) capture is mandatory
    const innerStart = beginTag.lastIndex; // index just after the matched BEGIN tag
    const endTag = `<!-- END GENERATED: ${name} -->`;
    const innerEnd = input.indexOf(endTag, innerStart);
    if (innerEnd === -1) {
      throw new Error(
        `generate-benchmark-reference: BEGIN GENERATED marker "${name}" has no matching END — ` +
          "refusing to substitute (an insert-style fallback would duplicate content on re-run).",
      );
    }
    const afterEnd = innerEnd + endTag.length;
    pairs.push({ name, innerStart, innerEnd, afterEnd });
    beginTag.lastIndex = afterEnd; // resume scanning after this pair's END tag
  }
  if (pairs.length === 0) {
    throw new Error("generate-benchmark-reference: no BEGIN GENERATED markers found in the reference document.");
  }
  return pairs;
}

/**
 * Replace ONLY the text between each marker pair with the corresponding generated block. Every byte
 * outside the marker pairs (including the marker tags themselves) is preserved. Throws if a marker
 * pair is missing its END, or if the document carries a marker name the generator does not produce.
 */
export function substituteMarkers(input: string, tables: GeneratedTables): string {
  const pairs = findMarkerPairs(input);
  let out = "";
  let cursor = 0;
  for (const p of pairs) {
    if (!(p.name in tables)) {
      throw new Error(
        `generate-benchmark-reference: document has a "${p.name}" generated block, but renderTables ` +
          "produces no such table. Either add the section to renderTables or remove the marker pair.",
      );
    }
    out += input.slice(cursor, p.innerStart); // prose + the BEGIN tag, untouched
    out += tables[p.name]; // canonical generated inner content
    cursor = p.innerEnd; // the END tag (+ following prose) is appended by the next slice / tail
  }
  out += input.slice(cursor); // final END tag + trailing prose, untouched
  return out;
}

// ─── Thin file-I/O shell ─────────────────────────────────────────────────────

// The reference lives at the repository root, not under this app; resolve from this script's
// location so the path is correct regardless of the process cwd.
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REF_PATH = path.resolve(SCRIPT_DIR, "../../../../docs/reference/ai-model-benchmarks.md");

async function main(): Promise<void> {
  const mode = process.argv.includes("--validate") ? "validate" : "generate";
  const original = await readFile(REF_PATH, "utf8");
  const tables = renderTables(dataset);
  const regenerated = substituteMarkers(original, tables);

  if (mode === "validate") {
    if (regenerated !== original) {
      console.error(
        "generate-benchmark-reference: docs/reference/ai-model-benchmarks.md is out of date with models.ts (drift inside BEGIN/END GENERATED blocks).",
      );
      console.error("Regenerate with:  npx nx run ayokoding-www:generate-benchmark-reference");
      process.exit(1);
    }
    console.log("generate-benchmark-reference: reference is up to date.");
    return;
  }

  if (regenerated !== original) {
    await writeFile(REF_PATH, regenerated, "utf8");
    console.log("generate-benchmark-reference: updated docs/reference/ai-model-benchmarks.md.");
  } else {
    console.log("generate-benchmark-reference: already up to date.");
  }
}

// Run the I/O shell only when invoked directly as a script, never when imported (e.g. by the unit
// tests, which exercise the pure functions only).
const invokedDirectly =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
