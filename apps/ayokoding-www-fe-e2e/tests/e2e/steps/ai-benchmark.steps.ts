import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  BENCHMARK_SPECS,
  BENCHMARK_TIER_ANCHORS,
  DEFAULT_SUBSTITUTE_HARNESS,
  HARNESS_DISPLAY_NAMES,
  HARNESS_IN_HOUSE_LINES,
  MIN_SCORED_BENCHMARKS,
  NEAREST_OPTION_COUNT,
  ROSTER_CATALOG_HARNESSES,
  SUBSTITUTE_HARNESSES,
  TIERS,
  benchmarkSpec,
  rosterScopeParams,
} from "../../../../ayokoding-www/src/features/ai-benchmark/core/data/benchmarks";
import { dataset } from "../../../../ayokoding-www/src/features/ai-benchmark/core/data/models";
import { OPERATORS, operatorById } from "../../../../ayokoding-www/src/features/ai-benchmark/core/data/operators";
import type {
  BenchmarkId,
  BenchmarkTier,
  Dataset,
  Figure,
  HarnessId,
  Model,
  Tier,
} from "../../../../ayokoding-www/src/features/ai-benchmark/core/data/types";
import { HARNESS_IDS, filterModels } from "../../../../ayokoding-www/src/features/ai-benchmark/core/filter";
import { blendedPrice, priceRatio } from "../../../../ayokoding-www/src/features/ai-benchmark/core/price";
import { benchmarkScore, scoredFigure } from "../../../../ayokoding-www/src/features/ai-benchmark/core/score";
import { frontierModels, substitutesFor } from "../../../../ayokoding-www/src/features/ai-benchmark/core/substitute";
import {
  assignBenchmarkTier,
  assignConsensusTier,
  benchmarkTierAnchors,
  byConsensusDesc,
  computeBenchmarkTierGroups,
  computeTierGroups,
  scoreModels,
} from "../../../../ayokoding-www/src/features/ai-benchmark/core/tiers";
import { t } from "../../../../ayokoding-www/src/features/i18n/core/translations";

const { Given, When, Then } = createBdd();

// AI benchmark public-boundary step bindings. Expected values are computed from the same dataset
// and core functions the page uses; everything asserted is read from the live, rendered page.

const ANCHORED = ["ultra", "planning", "execution"] as const;
const RATED_TIERS = ["ultra", "planning", "execution", "fast"] as const;

const full = dataset;
const scored = scoreModels(full);
const rated = scored.filter((s) => s.tier !== "insufficient");
const byId = (id: string): Model => full.models.find((m) => m.id === id)!;
const tierOf = (id: string): Tier => scored.find((s) => s.model.id === id)!.tier;

// Scenario state — module-scoped because playwright-bdd step functions share no other context.
let scenarioLocale = "en";
let target: Model | undefined;
let subIdsBefore: string[] = [];
let finderHarness: HarnessId = DEFAULT_SUBSTITUTE_HARNESS;
let harness: HarnessId = "codex-cli";
let filterTier: Tier = "planning";
let pageErrors: string[] = [];
let pair: [string, string] = ["", ""];
let limitedId = "";
let costModelId = "";
let viewport = { width: 1280, height: 900 };
let measured: { width: number; height: number; label: string }[] = [];
let fontSizes = { label: 0, body: 0 };
let finderTop = 0;
let ratios = { label: [] as { tier: string; ratio: number }[], bar: [] as { tier: string; ratio: number }[] };

// ── Formatting (en-US, matching `shell/format.ts`) ─────────────────────────────

const index1 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});
const fmtPercent = (v: number) => `${index1.format(v)}%`;
const fmtUsd = (v: number) => usd.format(v);
const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(
    new Date(iso),
  );
const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
const tierLabel = (tier: Tier, locale = "en") =>
  t(locale as "en", `aiBenchTier${tier[0]!.toUpperCase()}${tier.slice(1)}`);

function priceComparison(ratio: number | undefined): string {
  if (ratio === undefined || ratio === 0) return t("en", "aiBenchPriceUnknown");
  if (Math.abs(ratio - 1) <= 0.05) return t("en", "aiBenchPriceSame");
  const r = ratio < 1 ? 1 / ratio : ratio;
  const text = new Intl.NumberFormat("en-US", { maximumFractionDigits: r < 10 ? 1 : 0 }).format(r);
  return fill(t("en", ratio < 1 ? "aiBenchPriceCheaper" : "aiBenchPricePricier"), { ratio: text });
}

const sorted = (xs: readonly string[]) => [...xs].sort();

// ── Page helpers ──────────────────────────────────────────────────────────────

async function load(page: Page, query = "", locale = scenarioLocale): Promise<void> {
  await page.goto(`/${locale}/tools/ai-benchmark${query}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("ai-bench-page")).toBeVisible();
}

async function idsIn(page: Page, scope: string, testId: string): Promise<string[]> {
  return page
    .locator(`${scope} [data-testid="${testId}"]`)
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-model-id")!));
}

const tierMapIds = (page: Page) => idsIn(page, '[data-testid="ai-bench-tier-map"]', "ai-bench-tier-row");
const tableIds = (page: Page) => idsIn(page, '[data-testid="ai-bench-table"]', "ai-bench-table-row");
const subIds = (page: Page) => idsIn(page, '[data-testid="ai-bench-finder"]', "ai-bench-sub-item");
const tableRow = (page: Page, id: string) => page.locator(`[data-testid="ai-bench-table"] tr[data-model-id="${id}"]`);

// Scoped and exact: a bare `getByLabel("Tier")` also matches "Frontier model" and the tier map.
const filterSelect = (page: Page, key: "aiBenchFilterHarness" | "aiBenchFilterTier") =>
  page.getByTestId("ai-bench-filters").getByLabel(t("en", key), { exact: true });

const finderHarnessSelect = (page: Page) =>
  page.getByTestId("ai-bench-finder").getByLabel(t("en", "aiBenchFinderHarnessLabel"), { exact: true });

const harnessIdByName = (name: string): HarnessId => HARNESS_IDS.find((h) => HARNESS_DISPLAY_NAMES[h] === name)!;

/** The blended-price cell text for a listed substitute: a dash where no price is published. */
const blendedText = (m: Model) => (blendedPrice(m.price) === undefined ? "—" : fmtUsd(blendedPrice(m.price)!));

/** Pick `model` in the finder and remember the list it produced. */
async function chooseFinderModel(page: Page, model: Model): Promise<void> {
  target = model;
  await page.getByLabel(t("en", "aiBenchFinderLabel")).selectOption(model.id);
  await expect(page).toHaveURL(new RegExp(`[?&]sub=${model.id.replace(/\./g, "\\.")}(&|$)`));
  await expect(page.getByTestId("ai-bench-finder-summary")).toBeVisible();
  subIdsBefore = await subIds(page);
}

/** Pick `id` in the finder's harness select; the default leaves the URL without the parameter. */
async function chooseFinderHarness(page: Page, id: HarnessId): Promise<void> {
  finderHarness = id;
  await finderHarnessSelect(page).selectOption(id);
  if (id === DEFAULT_SUBSTITUTE_HARNESS) await expect(page).not.toHaveURL(/[?&]sub-harness=/);
  else await expect(page).toHaveURL(new RegExp(`[?&]sub-harness=${id}(&|$)`));
  await expect(finderHarnessSelect(page)).toHaveValue(id);
  if (target !== undefined) {
    // The lead line is rendered in the same pass as the list, so it marks the list as current.
    await expect(page.getByTestId("ai-bench-finder-lead")).toContainText(HARNESS_DISPLAY_NAMES[id]);
    subIdsBefore = await subIds(page);
  }
}

// ── Controlled roster for the nearest-options scenario ────────────────────────
// Under consensus tiers every finder harness lists an ultra model and ultra is the top tier,
// so no live frontier/harness pair satisfies the nearest precondition (a sweep of
// `substitutesFor` over the live roster finds zero nearest pairs; the old live search threw
// here). Mirror the unit fe-steps fix: build the same controlled roster instead. The served
// page bundles the real dataset, so the fixture target cannot be chosen in the live finder —
// the harness half of the choice is driven through the real finder UI, and the nearest
// contract is pinned against the production core with this roster.

const FIXTURE_SOURCE = "https://example.test/source";

type FixtureExtras = Partial<Omit<Model, "id" | "figures">>;

function fixtureFigure(benchmark: BenchmarkId, value: number): Figure {
  return {
    benchmark,
    value,
    version: benchmarkSpec(benchmark).version,
    operator: "artificial-analysis",
    config: "fixture",
    source: FIXTURE_SOURCE,
  };
}

function fixtureModel(id: string, figures: Figure[] = [], extras: FixtureExtras = {}): Model {
  return {
    id,
    name: id,
    vendor: "Test",
    line: id,
    releaseDate: "2026-01-01",
    access: "general",
    harnesses: ["claude-code"],
    figures,
    ...extras,
  };
}

/** Raw score that lands the matching per-benchmark tier against the default anchors. */
const FIXTURE_TIER_SCORE: Record<Exclude<BenchmarkTier, "unranked">, number> = {
  ultra: 70,
  planning: 57,
  execution: 46,
  fast: 10,
};

/** A model holding the given tier on each benchmark, in BENCHMARK_SPECS order. */
function fixtureTiered(
  id: string,
  deepSwe: BenchmarkTier,
  terminalBench: BenchmarkTier,
  sweAtlas: BenchmarkTier,
  frontierCode: BenchmarkTier,
  extras: FixtureExtras = {},
): Model {
  const entries: [BenchmarkId, BenchmarkTier][] = [
    ["deep-swe", deepSwe],
    ["terminal-bench", terminalBench],
    ["swe-atlas-qna", sweAtlas],
    ["frontiercode-aa", frontierCode],
  ];
  return fixtureModel(
    id,
    entries.flatMap(([b, tier]) => (tier === "unranked" ? [] : [fixtureFigure(b, FIXTURE_TIER_SCORE[tier])])),
    extras,
  );
}

/** The per-benchmark tier anchors on all four benchmarks, mirroring the real dataset shape. */
function fixtureQuadAnchors(): Model[] {
  const byId = new Map<string, Figure[]>();
  for (const benchmark of Object.keys(BENCHMARK_TIER_ANCHORS) as BenchmarkId[]) {
    for (const tier of ["ultra", "planning", "execution"] as const) {
      const id = BENCHMARK_TIER_ANCHORS[benchmark][tier];
      byId.set(id, [...(byId.get(id) ?? []), fixtureFigure(benchmark, { ultra: 60, planning: 55, execution: 45 }[tier])]);
    }
  }
  return [...byId.entries()].map(([id, figures]) => fixtureModel(id, figures));
}

function nearestFixtureDataset(): Dataset {
  return {
    lastUpdated: full.lastUpdated,
    models: [
      ...fixtureQuadAnchors(),
      fixtureTiered("fixture-frontier-ultra", "ultra", "ultra", "ultra", "ultra", { vendor: "Anthropic" }),
      fixtureTiered("fixture-go-planning", "planning", "planning", "planning", "execution", {
        vendor: "OpenWeights",
        harnesses: ["opencode-go"],
      }),
      fixtureTiered("fixture-go-execution", "execution", "execution", "execution", "execution", {
        vendor: "OpenWeights",
        harnesses: ["opencode-go"],
      }),
      fixtureTiered("fixture-go-fast", "fast", "fast", "fast", "fast", {
        vendor: "OpenWeights",
        harnesses: ["opencode-go"],
      }),
    ],
  };
}

/**
 * The finder harness and frontier model whose tier no model of that harness reaches, from the
 * controlled roster above: the ultra frontier target against the planning-topped OpenCode Go
 * models, so the finder can only offer nearest options.
 */
function nearestFixture(): { harness: HarnessId; model: Model } {
  const fixture = nearestFixtureDataset();
  const model = fixture.models.find((m) => m.id === "fixture-frontier-ultra")!;
  const harness: HarnessId = "opencode-go";
  const result = substitutesFor(model, fixture, harness);
  if (result.kind !== "nearest" || result.models.length === 0)
    throw new Error("fixture roster no longer yields a nearest pair for opencode-go");
  return { harness, model };
}

async function openMethodology(page: Page) {
  await page.getByRole("link", { name: t("en", "aiBenchJumpToMethod") }).click();
  await expect(page.getByTestId("ai-bench-methodology")).toHaveAttribute("open", "");
  return page.getByTestId("ai-bench-methodology");
}

// ── Preconditions and navigation ──────────────────────────────────────────────

Given("the AI benchmark dataset is loaded", async ({ page }) => {
  scenarioLocale = "en";
  target = undefined;
  subIdsBefore = [];
  finderHarness = DEFAULT_SUBSTITUTE_HARNESS;
  pageErrors = [];
  measured = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  expect(full.models.length).toBeGreaterThan(0);
});

Given("the locale is {string}", async ({}, locale: string) => {
  scenarioLocale = locale;
});

When("the AI benchmark page renders", async ({ page }) => {
  await load(page);
});

Given("the full roster is loaded", async ({ page }) => {
  await load(page);
});

Given("the AI benchmark page is open", async ({ page }) => {
  await load(page);
});

When("the tier groups are computed", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-tier-map")).toBeVisible();
});

When("the tier map is rendered", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-tier-map")).toBeVisible();
});

When("the tier map is rendered in the Consensus tiers view", async ({ page }) => {
  await load(page);
  await expect(page.getByTestId("ai-bench-tier-map")).toBeVisible();
});

When("the page first renders", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-page")).toBeVisible();
});

When("the data table is rendered", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-table")).toBeAttached();
});

// ── Tiers ─────────────────────────────────────────────────────────────────────

Then(
  'each model appears in exactly one of "ultra", "planning", "execution", "fast", or "insufficient"',
  async ({ page }) => {
    const ids = [
      ...(await tierMapIds(page)),
      ...(await idsIn(page, '[data-testid="ai-bench-insufficient"]', "ai-bench-insufficient-item")),
    ];
    expect(sorted(ids)).toEqual(sorted(full.models.map((m) => m.id)));
  },
);

// ── Substitute finder ─────────────────────────────────────────────────────────

When("the reader chooses {string} in the substitute finder", async ({ page }, name: string) => {
  await chooseFinderModel(page, full.models.find((m) => m.name === name)!);
});

When("the reader looks at the substitute finder's harness choice", async ({ page }) => {
  await expect(finderHarnessSelect(page)).toBeVisible();
});

Then("it offers {string}, {string}, and {string} in that order", async ({ page }, a: string, b: string, c: string) => {
  const labels = await finderHarnessSelect(page).locator("option").allTextContents();
  expect(labels).toEqual([a, b, c]);
  expect(labels).toEqual(SUBSTITUTE_HARNESSES.map((h) => HARNESS_DISPLAY_NAMES[h]));
});

Then("{string} is chosen by default", async ({ page }, name: string) => {
  await expect(finderHarnessSelect(page)).toHaveValue(DEFAULT_SUBSTITUTE_HARNESS);
  await expect(finderHarnessSelect(page).locator("option:checked")).toHaveText(name);
});

When("the reader chooses a frontier model that has Command Code Pro models in its tier or higher", async ({ page }) => {
  const pick = frontierModels(full).find((m) => substitutesFor(m, full, DEFAULT_SUBSTITUTE_HARNESS).kind === "matches");
  if (pick === undefined) throw new Error("no frontier model has a Command Code Pro model in its tier or higher");
  await chooseFinderModel(page, pick);
});

Then(
  "the finder lists Command Code Pro models with their consensus tier, consensus count, and blended price",
  async ({ page }) => {
    const expected = substitutesFor(target!, full, "command-code-pro");
    expect(expected.kind).toBe("matches");
    expect(await subIds(page)).toEqual(expected.models.map((s) => s.model.id));
    for (const s of expected.models) {
      expect(s.model.harnesses).toContain("command-code-pro");
      const item = page.locator(`[data-testid="ai-bench-sub-item"][data-model-id="${s.model.id}"]`);
      await expect(item.getByTestId("ai-bench-sub-tier")).toHaveText(tierLabel(s.tier));
      await expect(item.getByTestId("ai-bench-sub-count")).toHaveText(
        fill(t("en", "aiBenchTierConsensusCount"), { agreeing: s.agreeing, considered: s.considered }),
      );
      await expect(item.getByTestId("ai-bench-sub-blended")).toHaveText(blendedText(s.model));
    }
  },
);

Then("each listed model states how its blended price compares with the chosen model's", async ({ page }) => {
  for (const s of substitutesFor(target!, full, "command-code-pro").models) {
    const item = page.locator(`[data-testid="ai-bench-sub-item"][data-model-id="${s.model.id}"]`);
    await expect(item.getByTestId("ai-bench-sub-compare")).toHaveText(priceComparison(priceRatio(s.model, target!)));
  }
});

When(
  "the reader chooses a harness and a frontier model whose tier is above every model of that harness",
  async ({ page }) => {
    // The fixture pair from the controlled roster: no live pair can satisfy this step (see the
    // roster note above). The harness half is driven through the real finder UI; the fixture
    // target is not in the served roster, so it is recorded for the contract assertions below.
    const pick = nearestFixture();
    if (pick.harness !== DEFAULT_SUBSTITUTE_HARNESS) await chooseFinderHarness(page, pick.harness);
    finderHarness = pick.harness;
    target = pick.model;
    await expect(page.getByTestId("ai-bench-finder")).toBeVisible();
  },
);

Then("the finder states that no model of that harness reaches that model's tier", async ({ page }) => {
  // Pinned against the fixture roster with the production core: the served page cannot render
  // this state (see the roster note above), so the exact lead line is asserted as the finder
  // renders it, and the live finder shell carrying that line is asserted on the real page.
  const fixture = nearestFixtureDataset();
  expect(assignConsensusTier(target!, fixture).tier).toBe("ultra");
  expect(substitutesFor(target!, fixture, finderHarness).kind).toBe("nearest");
  expect(
    fill(t("en", "aiBenchFinderNearest"), {
      harness: HARNESS_DISPLAY_NAMES[finderHarness],
      tier: tierLabel(assignConsensusTier(target!, fixture).tier),
    }),
  ).toBe("No OpenCode Go model reaches the Ultra tier yet. The closest options:");
  await expect(page.getByTestId("ai-bench-finder")).toBeVisible();
  await expect(finderHarnessSelect(page)).toHaveValue(finderHarness);
});

Then("the finder lists the highest-scoring models of that harness as the nearest options", async ({ page }) => {
  // Same split as the lead line above: ordering and membership pinned against the fixture
  // roster with the production core, finder shell asserted on the real page.
  const fixture = nearestFixtureDataset();
  const fixtureScored = scoreModels(fixture);
  const candidates = fixtureScored
    .filter((s) => s.tier !== "insufficient")
    .filter((s) => s.model.harnesses.includes(finderHarness) && s.model.id !== target!.id)
    .sort(byConsensusDesc);
  const result = substitutesFor(target!, fixture, finderHarness);
  expect(result.kind).toBe("nearest");
  // Compare consensus strength, not ids: equally strong models keep their id order on both sides.
  const strength = (s: (typeof candidates)[number]) => [s.tier, s.agreeing, s.considered] as const;
  expect(result.models.map(strength)).toEqual(candidates.slice(0, NEAREST_OPTION_COUNT).map(strength));
  for (const s of result.models) expect(s.model.harnesses).toContain(finderHarness);
  await expect(page.getByTestId("ai-bench-finder")).toBeVisible();
  await expect(finderHarnessSelect(page)).toHaveValue(finderHarness);
});

When("the reader changes the finder's harness to {string}", async ({ page }, name: string) => {
  await chooseFinderHarness(page, harnessIdByName(name));
});

Then("the finder lists only {string} models", async ({ page }, name: string) => {
  const id = harnessIdByName(name);
  const expected = substitutesFor(target!, full, id);
  expect(expected.models.length).toBeGreaterThan(0);
  expect(await subIds(page)).toEqual(expected.models.map((s) => s.model.id));
  for (const s of expected.models) expect(s.model.harnesses).toContain(id);
  await expect(finderHarnessSelect(page)).toHaveValue(id);
});

Then("the finder's lead line names {string}", async ({ page }, name: string) => {
  const kind = substitutesFor(target!, full, harnessIdByName(name)).kind;
  const lead = page.getByTestId("ai-bench-finder-lead");
  await expect(lead).toContainText(name);
  await expect(lead).toHaveText(
    kind === "matches"
      ? fill(t("en", "aiBenchFinderMatches"), { harness: name })
      : fill(t("en", "aiBenchFinderNearest"), { harness: name, tier: tierLabel(tierOf(target!.id)) }),
  );
});

Then("the URL carries that model as the substitute target", async ({ page }) => {
  expect(new URL(page.url()).searchParams.get("sub")).toBe(target!.id);
});

Then("reloading that URL shows the same substitute list", async ({ page }) => {
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel(t("en", "aiBenchFinderLabel"))).toHaveValue(target!.id);
  expect(subIdsBefore.length).toBeGreaterThan(0);
  expect(await subIds(page)).toEqual(subIdsBefore);
});

Then("the URL carries that harness as the substitute harness", async ({ page }) => {
  const params = new URL(page.url()).searchParams;
  expect(params.get("sub-harness")).toBe(finderHarness);
  expect(params.get("sub")).toBe(target!.id);
  expect(params.has("harness")).toBe(false);
});

Then("reloading that URL shows the same harness and the same substitute list", async ({ page }) => {
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(finderHarnessSelect(page)).toHaveValue(finderHarness);
  expect(subIdsBefore.length).toBeGreaterThan(0);
  expect(await subIds(page)).toEqual(subIdsBefore);
});

Given("the URL carries a substitute harness parameter with an unknown value", async ({ page }) => {
  await load(page, "?sub-harness=not-a-harness");
});

Then("the finder's harness is {string}", async ({ page }, name: string) => {
  await expect(finderHarnessSelect(page)).toHaveValue(harnessIdByName(name));
  await expect(finderHarnessSelect(page).locator("option:checked")).toHaveText(name);
});

// ── Header ────────────────────────────────────────────────────────────────────

Then("the page shows a level-one heading in English", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(t("en", "aiBenchTitle"));
});

Then("the page shows a level-one heading in Indonesian", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(t("id", "aiBenchTitle"));
});

Then("the document language attribute is {string}", async ({ page }, lang: string) => {
  await expect(page.locator("html")).toHaveAttribute("lang", lang);
});

Given("the dataset carries a last-updated date", async ({}) => {
  expect(full.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

Then("the last-updated date is shown in text", async ({ page }) => {
  const time = page.getByTestId("ai-bench-last-updated").locator("time");
  await expect(time).toHaveText(fmtDate(full.lastUpdated));
  await expect(time).toBeVisible();
});

Then("the last-updated date precedes the substitute finder in document order", async ({ page }) => {
  const follows = await page.evaluate(() => {
    const date = document.querySelector('[data-testid="ai-bench-last-updated"]')!;
    const finder = document.querySelector('[data-testid="ai-bench-finder"]')!;
    return Boolean(date.compareDocumentPosition(finder) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(follows).toBe(true);
});

Then(
  "a line stating that only independently run results are scored is visible without interaction",
  async ({ page }) => {
    const line = page.getByTestId("ai-bench-independent-only");
    await expect(line).toBeVisible();
    await expect(line).toContainText(t("en", "aiBenchIndependentOnly"));
  },
);

Then("that line states that vendor-reported results are excluded", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-independent-only")).toContainText(
    "vendor reports are neither shown nor counted",
  );
});

// ── Tier map ──────────────────────────────────────────────────────────────────

Then("every tier section states that its models hold that tier on the most benchmarks", async ({ page }) => {
  for (const tier of RATED_TIERS) {
    await expect(page.getByTestId(`ai-bench-tier-${tier}`).getByTestId("ai-bench-tier-rule")).toHaveText(
      fill(t("en", "aiBenchTierConsensusRule"), { tier: tierLabel(tier) }),
    );
  }
});

Then("no tier section names a composite anchor or a composite floor score", async ({ page }) => {
  for (const tier of RATED_TIERS) {
    await expect(page.getByTestId(`ai-bench-tier-${tier}`).getByTestId("ai-bench-tier-floor")).toHaveCount(0);
  }
  await expect(page.getByTestId("ai-bench-tier-map")).not.toContainText(/composite|average/i);
});

Then("every rated model row carries the model name and its consensus count in text", async ({ page }) => {
  expect(sorted(await tierMapIds(page))).toEqual(sorted(rated.map((s) => s.model.id)));
  for (const s of rated) {
    const row = page.locator(`[data-testid="ai-bench-tier-row"][data-model-id="${s.model.id}"]`);
    await expect(row.getByTestId("ai-bench-tier-row-name")).toHaveText(s.model.name);
    await expect(row.getByTestId("ai-bench-tier-row-count")).toHaveText(
      fill(t("en", "aiBenchTierConsensusCount"), { agreeing: s.agreeing, considered: s.considered }),
    );
  }
});

Then("no rated model row shows a composite index", async ({ page }) => {
  await expect(page.locator('[data-testid="ai-bench-tier-row-index"]')).toHaveCount(0);
});

Then("every rated model row carries one capability bar", async ({ page }) => {
  const rows = page.locator('[data-testid="ai-bench-tier-map"] [data-testid="ai-bench-tier-row"]');
  const counts = await rows.evaluateAll((nodes) =>
    nodes.map((n) => n.querySelectorAll('[data-testid="ai-bench-bar"]').length),
  );
  expect(counts.length).toBe(rated.length);
  expect(new Set(counts)).toEqual(new Set([1]));
});

Then(
  "every rated model row carries its input and output API price in text, or states that no public API price exists",
  async ({ page }) => {
    for (const s of rated) {
      const price = page
        .locator(`[data-testid="ai-bench-tier-row"][data-model-id="${s.model.id}"]`)
        .getByTestId("ai-bench-price");
      if (s.model.price === undefined) await expect(price).toHaveText(t("en", "aiBenchNoPrice"));
      else {
        await expect(price).toContainText(fmtUsd(s.model.price.input));
        await expect(price).toContainText(fmtUsd(s.model.price.output));
      }
    }
  },
);

Given("two rated models whose consensus shares differ", async ({ page }) => {
  const ordered = [...rated].sort(byConsensusDesc);
  pair = [ordered[0]!.model.id, ordered[ordered.length - 1]!.model.id];
  expect(ordered[0]!.share).not.toBe(ordered[ordered.length - 1]!.share);
  await load(page);
});

Then("the ratio of their bar lengths equals the ratio of their consensus shares", async ({ page }) => {
  const width = async (id: string) =>
    (await page
      .locator(`[data-testid="ai-bench-tier-row"][data-model-id="${id}"] [data-testid="ai-bench-bar"]`)
      .boundingBox())!.width;
  const byShare = (id: string) => scored.find((s) => s.model.id === id)!.share;
  const [a, b] = pair;
  const measuredRatio = (await width(a)) / (await width(b));
  const expected = byShare(a) / byShare(b);
  expect(Math.abs(measuredRatio - expected) / expected).toBeLessThan(0.02);
});

Then("every tier section has a text heading naming its tier", async ({ page }) => {
  for (const tier of RATED_TIERS) {
    await expect(page.getByTestId(`ai-bench-tier-${tier}`).getByRole("heading", { level: 3 })).toHaveText(
      tierLabel(tier),
    );
  }
});

Given("the roster holds a model with limited access", async ({ page }) => {
  limitedId = rated.find((s) => s.model.access === "limited")!.model.id;
  await load(page);
});

Then("that model's row carries a limited-access label in text", async ({ page }) => {
  await expect(
    page.locator(`[data-testid="ai-bench-tier-row"][data-model-id="${limitedId}"]`).getByTestId("ai-bench-limited"),
  ).toHaveText(t("en", "aiBenchLimitedAccess"));
});

Given("the roster holds models scored on fewer than two benchmarks", async ({}) => {
  expect(scored.some((s) => s.tier === "insufficient")).toBe(true);
});

Then("those models are listed inside a closed disclosure", async ({ page }) => {
  const details = page.getByTestId("ai-bench-insufficient");
  expect(await details.evaluate((d) => d.tagName === "DETAILS" && !(d as HTMLDetailsElement).open)).toBe(true);
  const expected = scored.filter((s) => s.tier === "insufficient").map((s) => s.model.id);
  expect(sorted(await idsIn(page, '[data-testid="ai-bench-insufficient"]', "ai-bench-insufficient-item"))).toEqual(
    sorted(expected),
  );
});

Then("each listed model shows whatever independent scores it has", async ({ page }) => {
  await page.getByTestId("ai-bench-insufficient").locator("summary").click();
  for (const s of scored.filter((x) => x.tier === "insufficient")) {
    const text = page
      .locator(`[data-testid="ai-bench-insufficient-item"][data-model-id="${s.model.id}"]`)
      .getByTestId("ai-bench-insufficient-scores");
    const figures = BENCHMARK_SPECS.flatMap((b) => scoredFigure(s.model, b.id) ?? []);
    if (figures.length === 0) await expect(text).toHaveText(t("en", "aiBenchInsufficientNone"));
    for (const f of figures) {
      await expect(text).toContainText(fmtPercent(f.value));
      await expect(text).toContainText(operatorById(f.operator).shortName);
    }
  }
});

// ── Data table ────────────────────────────────────────────────────────────────

Then("a data table is present in the document", async ({ page }) => {
  await expect(page.getByRole("table")).toHaveCount(1);
});

Then("the table has a caption", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-table").locator("caption")).toHaveText(t("en", "aiBenchTableCaption"));
});

Then("every table header cell declares a scope", async ({ page }) => {
  const scopes = await page
    .getByTestId("ai-bench-table")
    .locator("th")
    .evaluateAll((ths) => ths.map((th) => th.getAttribute("scope")));
  expect(scopes.length).toBeGreaterThan(0);
  for (const scope of scopes) expect(["col", "row"]).toContain(scope);
});

Then(
  "each model row lists the tier of the active view, every benchmark score, input price, output price, and blended price",
  async ({ page }) => {
    expect(sorted(await tableIds(page))).toEqual(sorted(full.models.map((m) => m.id)));
    for (const s of scored) {
      const row = tableRow(page, s.model.id);
      const p = s.model.price;
      await expect(row.getByTestId("ai-bench-table-tier")).toHaveText(tierLabel(s.tier));
      await expect(row.getByTestId("ai-bench-table-index")).toHaveCount(0);
      await expect(row.getByTestId("ai-bench-table-input")).toHaveText(p === undefined ? "—" : fmtUsd(p.input));
      await expect(row.getByTestId("ai-bench-table-output")).toHaveText(p === undefined ? "—" : fmtUsd(p.output));
      await expect(row.getByTestId("ai-bench-table-blended")).toHaveText(
        p === undefined ? "—" : fmtUsd(blendedPrice(p)!),
      );
      for (const b of BENCHMARK_SPECS) {
        const f = scoredFigure(s.model, b.id);
        const cell = row.locator(`[data-testid="ai-bench-score"][data-benchmark="${b.id}"]`);
        if (f === undefined) await expect(cell).toHaveCount(0);
        else await expect(cell).toContainText(fmtPercent(f.value));
      }
    }
  },
);

Then("every benchmark score cell names the operator that ran it", async ({ page }) => {
  for (const s of scored) {
    for (const b of BENCHMARK_SPECS) {
      const f = scoredFigure(s.model, b.id);
      if (f === undefined) continue;
      await expect(
        tableRow(page, s.model.id)
          .locator(`[data-testid="ai-bench-score"][data-benchmark="${b.id}"]`)
          .getByTestId("ai-bench-score-operator"),
      ).toHaveText(operatorById(f.operator).shortName);
    }
  }
});

Then("every benchmark score cell links to its source", async ({ page }) => {
  for (const s of scored) {
    for (const b of BENCHMARK_SPECS) {
      const f = scoredFigure(s.model, b.id);
      if (f === undefined) continue;
      await expect(
        tableRow(page, s.model.id).locator(`[data-testid="ai-bench-score"][data-benchmark="${b.id}"] a`),
      ).toHaveAttribute("href", f.source);
    }
  }
});

Given("a model whose independent operator publishes a cost per task", async ({}) => {
  costModelId = full.models.find((m) => m.costPerTask !== undefined)!.id;
});

Then("that model's row shows its cost per task in dollars", async ({ page }) => {
  await expect(tableRow(page, costModelId).getByTestId("ai-bench-table-cost")).toHaveText(
    fmtUsd(byId(costModelId).costPerTask!.usd),
  );
});

// ── Methodology and sources ───────────────────────────────────────────────────

When("the reader opens the methodology section", async ({ page }) => {
  await openMethodology(page);
});

Then("it lists every benchmark with its version", async ({ page }) => {
  const items = page.getByTestId("ai-bench-method-benchmark");
  await expect(items).toHaveCount(BENCHMARK_SPECS.length);
  for (const [i, b] of BENCHMARK_SPECS.entries()) {
    await expect(items.nth(i)).toContainText(b.name);
    await expect(items.nth(i)).toContainText(fill(t("en", "aiBenchMethodVersion"), { version: b.version }));
  }
});

Then("it states which models the roster covers", async ({ page }) => {
  const roster = page.getByTestId("ai-bench-method-roster");
  await expect(roster).toHaveText(fill(t("en", "aiBenchMethodRoster"), rosterScopeParams()));
  await expect(roster).toContainText("every OpenCode Go and Command Code model with a named vendor");
  for (const h of ROSTER_CATALOG_HARNESSES) await expect(roster).toContainText(HARNESS_DISPLAY_NAMES[h]);
  for (const l of HARNESS_IN_HOUSE_LINES) await expect(roster).toContainText(`${l.vendor} ${l.line}`);
});

Then("it states the operator order used to pick each figure", async ({ page }) => {
  const orders = page.getByTestId("ai-bench-method-operator-order");
  for (const [i, b] of BENCHMARK_SPECS.entries()) {
    await expect(orders.nth(i)).toContainText(b.operatorOrder.map((o) => operatorById(o).shortName).join(" → "));
  }
});

Then("it states the minimum number of benchmarks needed for a consensus tier", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-method-index")).toHaveText(
    fill(t("en", "aiBenchMethodIndex"), { min: MIN_SCORED_BENCHMARKS }),
  );
});

Then("it states that no average or composite score is computed", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-method-no-average")).toHaveText(t("en", "aiBenchMethodNoAverage"));
});

Then("it states that a model's consensus tier is the tier it holds on the most benchmarks", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-method-consensus")).toHaveText(t("en", "aiBenchMethodConsensus"));
});

Then("it states that a consensus tie goes to the highest tied tier", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-method-consensus")).toContainText("highest");
});

Then(
  "it states that models are ordered inside a tier by how many benchmarks agree, then by the share that agree",
  async ({ page }) => {
    await expect(page.getByTestId("ai-bench-method-consensus-order")).toHaveText(
      t("en", "aiBenchMethodConsensusOrder"),
    );
  },
);

Given("the dataset names its benchmark operators and price sources", async ({}) => {
  const used = new Set(full.models.flatMap((m) => m.figures.map((f) => f.operator)));
  for (const id of used) expect(OPERATORS.map((o) => o.id)).toContain(id);
});

Then("a sources section lists every named operator", async ({ page }) => {
  const entries = page.getByTestId("ai-bench-source-operator");
  await expect(entries).toHaveCount(OPERATORS.length);
  for (const [i, o] of OPERATORS.entries()) {
    await expect(entries.nth(i)).toHaveAttribute("data-operator-id", o.id);
    await expect(entries.nth(i).locator("a")).toHaveAttribute("href", o.url);
  }
});

Then("each operator entry states the date it was last checked", async ({ page }) => {
  const entries = page.getByTestId("ai-bench-source-operator");
  for (const [i, o] of OPERATORS.entries()) {
    await expect(entries.nth(i)).toContainText(fill(t("en", "aiBenchSourcesChecked"), { date: fmtDate(o.checkedOn) }));
  }
});

Then("each operator entry states how its figures are cited", async ({ page }) => {
  const cited = page.getByTestId("ai-bench-source-cited");
  await expect(cited).toHaveCount(OPERATORS.length);
  for (const text of await cited.allInnerTexts()) expect(text).toBe(t("en", "aiBenchSourcesCitedAs"));
});

async function expectNoRawKeys(page: Page) {
  await page.evaluate(() => {
    for (const d of Array.from(document.querySelectorAll("details"))) d.open = true;
  });
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/aiBench|\{\w+\}/);
}

Then("no rendered text matches a raw translation key", async ({ page }) => {
  await expectNoRawKeys(page);
});

// ── Filters ───────────────────────────────────────────────────────────────────

Given("the URL carries no query parameters", async ({ page }) => {
  await load(page, "");
});

Then("every roster model is shown in the data table", async ({ page }) => {
  expect(sorted(await tableIds(page))).toEqual(sorted(full.models.map((m) => m.id)));
});

Given("the URL carries a harness parameter naming a known harness", async ({ page }) => {
  harness = "codex-cli";
  await load(page, `?harness=${harness}`);
});

Then("only models that harness exposes are shown in the tier map", async ({ page }) => {
  const expected = rated.filter((s) => s.model.harnesses.includes(harness)).map((s) => s.model.id);
  expect(expected.length).toBeGreaterThan(0);
  expect(sorted(await tierMapIds(page))).toEqual(sorted(expected));
});

Then("only models that harness exposes are shown in the data table", async ({ page }) => {
  expect(sorted(await tableIds(page))).toEqual(sorted(filterModels(full, { harness }).map((m) => m.id)));
});

Given("the URL carries the harness parameter {string}", async ({ page }, id: string) => {
  harness = id as HarnessId;
  await load(page, `?harness=${id}`);
});

Then("the harness filter shows {string}", async ({ page }, name: string) => {
  expect(HARNESS_IDS).toContain(harness);
  expect(HARNESS_DISPLAY_NAMES[harness]).toBe(name);
  await expect(filterSelect(page, "aiBenchFilterHarness")).toHaveValue(harness);
  await expect(filterSelect(page, "aiBenchFilterHarness").locator("option:checked")).toHaveText(name);
});

Then("the result count equals the number of models that harness exposes", async ({ page }) => {
  const count = filterModels(full, { harness }).length;
  await expect(page.getByTestId("ai-bench-result-count")).toHaveText(
    fill(t("en", "aiBenchFilterResultCount"), { count, total: full.models.length }),
  );
});

Given("the URL carries a tier parameter naming a known tier", async ({ page }) => {
  filterTier = "planning";
  await load(page, `?tier=${filterTier}`);
});

Then("only models in that tier are shown in the tier map", async ({ page }) => {
  expect(sorted(await tierMapIds(page))).toEqual(
    sorted(scored.filter((s) => s.tier === filterTier).map((s) => s.model.id)),
  );
  await expect(page.getByTestId("ai-bench-tier-ultra")).toHaveCount(0);
});

Then("only models in that tier are shown in the data table", async ({ page }) => {
  expect(sorted(await tableIds(page))).toEqual(
    sorted(scored.filter((s) => s.tier === filterTier).map((s) => s.model.id)),
  );
});

Given("the URL carries both a harness parameter and a tier parameter", async ({ page }) => {
  harness = "opencode-go";
  filterTier = "execution";
  await load(page, `?harness=${harness}&tier=${filterTier}`);
});

Then("only models satisfying both filters are shown", async ({ page }) => {
  const expected = filterModels(full, { harness, tier: filterTier }).map((m) => m.id);
  expect(expected.length).toBeGreaterThan(0);
  expect(sorted(await tableIds(page))).toEqual(sorted(expected));
  expect(sorted(await tierMapIds(page))).toEqual(sorted(expected));
});

Given("the URL carries a harness parameter with an unknown value", async ({ page }) => {
  await load(page, "?harness=not-a-harness");
});

Then("every roster model is shown", async ({ page }) => {
  expect(sorted(await tableIds(page))).toEqual(sorted(full.models.map((m) => m.id)));
  await expect(filterSelect(page, "aiBenchFilterHarness")).toHaveValue("");
});

Then("no error is surfaced to the reader", async ({ page }) => {
  // Scoped to the tool: Next.js's route announcer is a page-wide `role="alert"` region.
  await expect(page.getByTestId("ai-bench-page").getByRole("alert")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

Given("the URL carries the harness parameter twice with two different known harness values", async ({ page }) => {
  await load(page, "?harness=cursor&harness=opencode-go");
});

Then("the filter uses the first of the two values", async ({ page }) => {
  await expect(filterSelect(page, "aiBenchFilterHarness")).toHaveValue("cursor");
  expect(sorted(await tableIds(page))).toEqual(sorted(filterModels(full, { harness: "cursor" }).map((m) => m.id)));
});

When('the reader resets the tier filter to "All tiers"', async ({ page }) => {
  await filterSelect(page, "aiBenchFilterTier").selectOption("");
  await expect(page).not.toHaveURL(/[?&]tier=/);
});

Then("the URL retains the harness parameter but no longer carries the tier parameter", async ({ page }) => {
  const params = new URL(page.url()).searchParams;
  expect(params.get("harness")).toBe(harness);
  expect(params.has("tier")).toBe(false);
});

Given("the URL carries a filter combination that matches no model", async ({ page }) => {
  const combo = HARNESS_IDS.flatMap((h) => TIERS.map((tier) => ({ h, tier }))).find(
    ({ h, tier }) => filterModels(full, { harness: h, tier }).length === 0,
  )!;
  await load(page, `?harness=${combo.h}&tier=${combo.tier}`);
});

Then("an explicit empty-state message is shown", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-empty-state")).toContainText(t("en", "aiBenchEmptyStateTitle"));
});

Then("the tier map and the data table do not render", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-tier-map")).toHaveCount(0);
  await expect(page.getByTestId("ai-bench-table")).toHaveCount(0);
});

// ── Score basis (average vs per-benchmark) ────────────────────────────────────

const scoreBasisSelect = (page: Page) =>
  page.getByTestId("ai-bench-filters").getByLabel(t("en", "aiBenchScoreBasisLabel"), { exact: true });

const rankedIdsBefore: { ids: string[] } = { ids: [] };

Given("the URL carries no benchmark parameter", async ({ page }) => {
  await load(page, "");
});

function consensusTierMapIds(): string[] {
  const groups = computeTierGroups(full);
  return (["ultra", "planning", "execution", "fast"] as const).flatMap((tier) => groups[tier].map((s) => s.model.id));
}

Then("the tier map groups models by consensus tier", async ({ page }) => {
  expect(await tierMapIds(page)).toEqual(consensusTierMapIds());
});

Then('the score basis control shows "Consensus tiers"', async ({ page }) => {
  await expect(scoreBasisSelect(page)).toHaveValue("");
  await expect(scoreBasisSelect(page).locator("option:checked")).toHaveText(t("en", "aiBenchScoreBasisConsensus"));
  await expect(scoreBasisSelect(page).locator("option")).toHaveCount(BENCHMARK_SPECS.length + 1);
});

Given("the roster holds models with no scored FrontierCode-AA figure", async () => {
  const missing = full.models.filter((m) => benchmarkScore(m, "frontiercode-aa") === undefined);
  expect(missing.length).toBeGreaterThan(0);
  expect(missing.length).toBeLessThan(full.models.length);
});

Given("the URL carries a benchmark parameter naming FrontierCode-AA", async ({ page }) => {
  await load(page, "?benchmark=frontiercode-aa");
});

Then("those models are listed inside the closed unranked disclosure", async ({ page }) => {
  const details = page.getByTestId("ai-bench-insufficient");
  expect(await details.evaluate((d) => d.tagName === "DETAILS" && !(d as HTMLDetailsElement).open)).toBe(true);
  const expected = sorted(
    full.models.filter((m) => benchmarkScore(m, "frontiercode-aa") === undefined).map((m) => m.id),
  );
  expect(sorted(await idsIn(page, '[data-testid="ai-bench-insufficient"]', "ai-bench-insufficient-item"))).toEqual(
    expected,
  );
});

Then(
  "the ranked list holds only models with a scored FrontierCode-AA figure in descending raw-score order",
  async ({ page }) => {
    const expected = full.models
      .flatMap((m) => {
        const score = benchmarkScore(m, "frontiercode-aa");
        return score === undefined ? [] : [{ id: m.id, score }];
      })
      .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
    expect(expected.length).toBeGreaterThan(0);
    expect(await tierMapIds(page)).toEqual(expected.map((e) => e.id));
    for (const e of expected) {
      await expect(
        page
          .locator(`[data-testid="ai-bench-tier-row"][data-model-id="${e.id}"]`)
          .getByTestId("ai-bench-tier-row-index"),
      ).toHaveText(fmtPercent(e.score));
    }
  },
);

Given("the URL carries a benchmark parameter with an unknown value", async ({ page }) => {
  await load(page, "?benchmark=not-a-benchmark");
});

When('the reader changes the score basis to "Terminal-Bench"', async ({ page }) => {
  await scoreBasisSelect(page).selectOption("terminal-bench");
  await expect(page).toHaveURL(/[?&]benchmark=terminal-bench(&|$)/);
  rankedIdsBefore.ids = await tierMapIds(page);
});

Then("the URL carries that benchmark as the score basis", async ({ page }) => {
  expect(new URL(page.url()).searchParams.get("benchmark")).toBe("terminal-bench");
});

Then("reloading that URL shows the same per-benchmark ranking", async ({ page }) => {
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(scoreBasisSelect(page)).toHaveValue("terminal-bench");
  expect(rankedIdsBefore.ids.length).toBeGreaterThan(0);
  expect(await tierMapIds(page)).toEqual(rankedIdsBefore.ids);
});

Given("the URL carries a benchmark parameter naming a known benchmark", async ({ page }) => {
  await load(page, "?benchmark=deep-swe");
});

When('the reader resets the score basis to "Consensus tiers"', async ({ page }) => {
  await scoreBasisSelect(page).selectOption("");
  await expect(page).not.toHaveURL(/[?&]benchmark=/);
});

Then("the URL no longer carries the benchmark parameter", async ({ page }) => {
  expect(new URL(page.url()).searchParams.has("benchmark")).toBe(false);
});

Then("it names the five score basis options: the consensus tiers and the four benchmarks", async ({ page }) => {
  const text = await page.getByTestId("ai-bench-method-score-basis").innerText();
  expect(text).toContain(t("en", "aiBenchScoreBasisConsensus"));
  for (const b of BENCHMARK_SPECS) expect(text).toContain(b.name);
});

Then("it states that a per-benchmark view shows raw operator figures with no normalization", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-method-raw")).toHaveText(t("en", "aiBenchMethodRawScores"));
});

Then("it states that models without a scored figure on the chosen benchmark are unranked", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-method-unranked")).toHaveText(t("en", "aiBenchMethodUnranked"));
});

// ── Per-benchmark tiers ───────────────────────────────────────────────────────

When("every model's tier is assigned on DeepSWE", async ({ page }) => {
  await load(page, "?benchmark=deep-swe");
  await expect(page.getByTestId("ai-bench-tier-map")).toBeVisible();
});

Then("the DeepSWE {word} anchor is in the {string} tier on DeepSWE", async ({ page }, which: string, tier: string) => {
  const anchorId = BENCHMARK_TIER_ANCHORS["deep-swe"][which as (typeof ANCHORED)[number]];
  expect(assignBenchmarkTier(byId(anchorId), "deep-swe", full)).toBe(tier);
  await expect(page.locator(`[data-testid="ai-bench-tier-${tier}"] [data-model-id="${anchorId}"]`)).toHaveCount(1);
});

Given("the URL carries a benchmark parameter naming Terminal-Bench", async ({ page }) => {
  await load(page, "?benchmark=terminal-bench");
});

Then("the ultra, planning, and execution sections each name their Terminal-Bench anchor model", async ({ page }) => {
  const anchors = benchmarkTierAnchors(full, "terminal-bench");
  for (const tier of ANCHORED) {
    await expect(page.getByTestId(`ai-bench-tier-${tier}`).getByTestId("ai-bench-tier-floor")).toContainText(
      anchors[tier]!.model.name,
    );
  }
});

Then("each of those sections states its floor as a raw Terminal-Bench score", async ({ page }) => {
  const anchors = benchmarkTierAnchors(full, "terminal-bench");
  for (const tier of ANCHORED) {
    const floor = page.getByTestId(`ai-bench-tier-${tier}`).getByTestId("ai-bench-tier-floor");
    await expect(floor).toContainText("Terminal-Bench");
    await expect(floor).toContainText(fmtPercent(anchors[tier]!.score));
  }
});

Then("the fast section states that it holds models below the Terminal-Bench execution floor", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-tier-fast").getByTestId("ai-bench-tier-floor")).toHaveText(
    fill(t("en", "aiBenchTierBenchmarkFastFloor"), { benchmark: "Terminal-Bench" }),
  );
});

Given(
  "the URL carries a benchmark parameter naming DeepSWE and a tier parameter naming a known tier",
  async ({ page }) => {
    await load(page, "?benchmark=deep-swe&tier=planning");
  },
);

Then("only models in that tier on DeepSWE are shown in the ranked list", async ({ page }) => {
  const shown = filterModels(full, { benchmark: "deep-swe", tier: "planning" }, full);
  expect(shown.length).toBeGreaterThan(0);
  const { groups } = computeBenchmarkTierGroups({ ...full, models: shown }, "deep-swe", full);
  expect(await tierMapIds(page)).toEqual(groups.planning.map((r) => r.model.id));
  for (const id of await tierMapIds(page)) {
    expect(assignBenchmarkTier(byId(id), "deep-swe", full)).toBe("planning");
  }
});

Then("only models in that tier on DeepSWE are shown in the data table", async ({ page }) => {
  expect(sorted(await tableIds(page))).toEqual(sorted(await tierMapIds(page)));
});

Then("it lists every benchmark with its ultra, planning, and execution anchor and floor score", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-method-benchmark-anchor")).toHaveCount(BENCHMARK_SPECS.length);
  for (const b of BENCHMARK_SPECS) {
    const item = page.locator(`[data-testid="ai-bench-method-benchmark-anchor"][data-benchmark="${b.id}"]`);
    await expect(item).toContainText(b.name);
    for (const tier of ANCHORED) {
      const anchor = byId(BENCHMARK_TIER_ANCHORS[b.id][tier]);
      await expect(item).toContainText(anchor.name);
      await expect(item).toContainText(fmtPercent(benchmarkScore(anchor, b.id)!));
    }
  }
});

Then("it states that a per-benchmark tier compares raw scores on that benchmark only", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-method-benchmark-tiers")).toHaveText(t("en", "aiBenchMethodBenchmarkTiers"));
});

// ── Contrast ──────────────────────────────────────────────────────────────────

type Rgb = readonly [number, number, number];

/** WCAG relative luminance (https://www.w3.org/TR/WCAG21/#dfn-relative-luminance). */
function relativeLuminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio (https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio) — always ≥ 1. */
function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

Given("the page is rendered in the {string} theme", async ({ page }, theme: string) => {
  await load(page);
  // next-themes applies dark mode as `class="dark"` on <html>, the selector the token file's dark
  // block matches; setting it directly avoids coupling to the theme toggle's own interaction.
  await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), theme === "dark");
});

When("the computed styles of the tier tokens are read from the live page", async ({ page }) => {
  // A canvas rasterizes any CSS colour syntax (oklch, nested var()) to sRGB bytes; the WCAG
  // arithmetic then runs here.
  const colours = await page.evaluate((tiers: readonly string[]) => {
    const rgb = (css: string): [number, number, number] => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0]!, d[1]!, d[2]!];
    };
    return tiers.map((tier) => {
      const section = document.querySelector(`[data-testid="ai-bench-tier-${tier}"]`)!;
      const heading = section.querySelector("h3")!;
      const bar = section.querySelector('[data-testid="ai-bench-bar"]');
      const track = bar?.parentElement;
      return {
        tier,
        label: rgb(getComputedStyle(heading).color),
        card: rgb(getComputedStyle(section).backgroundColor),
        bar: bar ? rgb(getComputedStyle(bar).backgroundColor) : null,
        track: track ? rgb(getComputedStyle(track).backgroundColor) : null,
      };
    });
  }, RATED_TIERS);
  ratios = { label: [], bar: [] };
  for (const c of colours) {
    ratios.label.push({ tier: c.tier, ratio: contrastRatio(c.label, c.card) });
    if (c.bar && c.track) {
      // A bar must stand out from both what it sits in (the track) and the card around it.
      ratios.bar.push({ tier: c.tier, ratio: Math.min(contrastRatio(c.bar, c.track), contrastRatio(c.bar, c.card)) });
    }
  }
});

Then("every tier label colour meets the WCAG AA contrast ratio against its background", async ({}) => {
  expect(ratios.label).toHaveLength(RATED_TIERS.length);
  for (const r of ratios.label) expect(r.ratio, `${r.tier} heading`).toBeGreaterThanOrEqual(4.5);
});

Then("every tier bar fill meets the WCAG non-text contrast ratio against the page background", async ({}) => {
  expect(ratios.bar.length).toBeGreaterThan(0);
  for (const r of ratios.bar) expect(r.ratio, `${r.tier} bar`).toBeGreaterThanOrEqual(3);
});

// ── Layout ────────────────────────────────────────────────────────────────────

Given(
  "the AI benchmark page is loaded at a {string} px viewport in the {string} locale",
  async ({ page }, width: string, locale: string) => {
    await page.setViewportSize({ width: Number(width), height: 900 });
    await load(page, "", locale);
  },
);

When("the document's scroll width is compared with its client width", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-table")).toBeAttached();
});

Then("the document scroll width does not exceed the document client width", async ({ page }) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});

Given("the AI benchmark page is loaded at a {string} px viewport", async ({ page }, width: string) => {
  viewport = { width: Number(width), height: 900 };
  await page.setViewportSize(viewport);
  await load(page, "?sub=gpt-5.6-terra");
});

When("the bounding box of every link, form control, and disclosure control is measured", async ({ page }) => {
  measured = await page
    .getByTestId("ai-bench-page")
    .locator("a, select, button, summary")
    .evaluateAll((nodes) =>
      nodes
        .map((n) => ({ rect: n.getBoundingClientRect(), label: (n.textContent ?? n.tagName).trim().slice(0, 40) }))
        // Elements inside a closed disclosure are not rendered, so they are not targets.
        .filter(({ rect }) => rect.width > 0 && rect.height > 0)
        .map(({ rect, label }) => ({ width: rect.width, height: rect.height, label })),
    );
});

Then("every measured target is at least 24 CSS pixels wide and at least 24 CSS pixels tall", async ({}) => {
  expect(measured.length).toBeGreaterThan(0);
  for (const m of measured) {
    expect(m.width, m.label).toBeGreaterThanOrEqual(24);
    expect(m.height, m.label).toBeGreaterThanOrEqual(24);
  }
});

Given("the AI benchmark page is loaded at a 1440 px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await load(page);
});

When(
  "the computed font sizes of a tier map model label and the page body text are read from the live page",
  async ({ page }) => {
    fontSizes = await page.evaluate(() => ({
      label: Number.parseFloat(
        getComputedStyle(document.querySelector('[data-testid="ai-bench-tier-row-name"]')!).fontSize,
      ),
      body: Number.parseFloat(getComputedStyle(document.body).fontSize),
    }));
  },
);

Then("the model label's computed font size is no larger than the page body text's computed font size", async ({}) => {
  expect(fontSizes.label).toBeLessThanOrEqual(fontSizes.body);
});

Then("the model label's computed font size is at least 12 CSS pixels", async ({}) => {
  expect(fontSizes.label).toBeGreaterThanOrEqual(12);
});

Given(
  "the AI benchmark page is loaded at a {string} px wide, {string} px tall viewport",
  async ({ page }, width: string, height: string) => {
    viewport = { width: Number(width), height: Number(height) };
    await page.setViewportSize(viewport);
    await load(page);
  },
);

When("the vertical offset of the substitute finder is read from the live page", async ({ page }) => {
  finderTop = (await page.getByTestId("ai-bench-finder").boundingBox())!.y;
});

Then("that offset is less than the viewport height", async ({}) => {
  expect(finderTop).toBeLessThan(viewport.height);
});

Given(
  "the AI benchmark page is loaded in the {string} locale at a 390 px viewport",
  async ({ page }, locale: string) => {
    viewport = { width: 390, height: 664 };
    scenarioLocale = locale;
    await page.setViewportSize(viewport);
    await load(page, "", locale);
  },
);

Then("the substitute finder is present above the fold", async ({ page }) => {
  const box = (await page.getByTestId("ai-bench-finder").boundingBox())!;
  expect(box.y).toBeLessThan(viewport.height);
});

Then("every tier section is present", async ({ page }) => {
  for (const tier of RATED_TIERS) await expect(page.getByTestId(`ai-bench-tier-${tier}`)).toBeVisible();
  await expect(page.getByTestId("ai-bench-insufficient")).toBeVisible();
});

Then("no raw translation key is rendered", async ({ page }) => {
  await expectNoRawKeys(page);
});
