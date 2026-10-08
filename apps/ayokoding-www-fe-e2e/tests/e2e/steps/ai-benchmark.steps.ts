import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  BENCHMARK_SPECS,
  DEFAULT_SUBSTITUTE_HARNESS,
  HARNESS_DISPLAY_NAMES,
  HARNESS_IN_HOUSE_LINES,
  METHOD_EXAMPLE,
  MIN_SCORED_BENCHMARKS,
  NEAREST_OPTION_COUNT,
  ROSTER_CATALOG_HARNESSES,
  SUBSTITUTE_HARNESSES,
  TIER_ANCHORS,
  TIERS,
  rosterScopeParams,
} from "../../../../ayokoding-www/src/features/ai-benchmark/core/data/benchmarks";
import { dataset } from "../../../../ayokoding-www/src/features/ai-benchmark/core/data/models";
import { OPERATORS, operatorById } from "../../../../ayokoding-www/src/features/ai-benchmark/core/data/operators";
import type { HarnessId, Model, Tier } from "../../../../ayokoding-www/src/features/ai-benchmark/core/data/types";
import { HARNESS_IDS, filterModels } from "../../../../ayokoding-www/src/features/ai-benchmark/core/filter";
import { blendedPrice, priceRatio } from "../../../../ayokoding-www/src/features/ai-benchmark/core/price";
import {
  compositeIndex,
  scoredBenchmarks,
  scoredFigure,
} from "../../../../ayokoding-www/src/features/ai-benchmark/core/score";
import { frontierModels, substitutesFor } from "../../../../ayokoding-www/src/features/ai-benchmark/core/substitute";
import { byIndexDesc, scoreModels, tierAnchors } from "../../../../ayokoding-www/src/features/ai-benchmark/core/tiers";
import { t } from "../../../../ayokoding-www/src/features/i18n/core/translations";

const { Given, When, Then } = createBdd();

// AI benchmark public-boundary step bindings. Expected values are computed from the same dataset
// and core functions the page uses; everything asserted is read from the live, rendered page.

const ANCHORED = ["ultra", "planning", "execution"] as const;
const RATED_TIERS = ["ultra", "planning", "execution", "fast"] as const;

const full = dataset;
const scored = scoreModels(full);
const rated = scored.filter((s) => s.index !== undefined);
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
const fmtIndex = (v: number) => index1.format(v);
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

/**
 * The first finder harness (default first) and frontier model whose tier no model of that harness
 * reaches, so the finder can only offer nearest options. Picked from the live roster, so the check
 * holds whatever each harness lists.
 */
function nearestCombination(): { harness: HarnessId; model: Model } {
  for (const h of SUBSTITUTE_HARNESSES) {
    for (const model of frontierModels(full)) {
      const result = substitutesFor(model, full, h);
      if (result.kind === "nearest" && result.models.length > 0) return { harness: h, model };
    }
  }
  throw new Error("every frontier model has a same-tier substitute in every finder harness");
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
  await load(page, "", "en");
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

When("every model's tier is assigned", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-tier-map")).toBeVisible();
});

When("the tier groups are computed", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-tier-map")).toBeVisible();
});

When("the tier map is rendered", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-tier-map")).toBeVisible();
});

When("the page first renders", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-page")).toBeVisible();
});

When("the data table is rendered", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-table")).toBeAttached();
});

// ── Tiers ─────────────────────────────────────────────────────────────────────

Then("the {word} anchor is in the {string} tier", async ({ page }, which: string, tier: string) => {
  const anchorId = TIER_ANCHORS[which as (typeof ANCHORED)[number]];
  await expect(page.locator(`[data-testid="ai-bench-tier-${tier}"] [data-model-id="${anchorId}"]`)).toHaveCount(1);
});

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
  "the finder lists Command Code Pro models with their tier, composite index, and blended price",
  async ({ page }) => {
    const expected = substitutesFor(target!, full, "command-code-pro");
    expect(expected.kind).toBe("matches");
    expect(await subIds(page)).toEqual(expected.models.map((s) => s.model.id));
    for (const s of expected.models) {
      expect(s.model.harnesses).toContain("command-code-pro");
      const item = page.locator(`[data-testid="ai-bench-sub-item"][data-model-id="${s.model.id}"]`);
      await expect(item.getByTestId("ai-bench-sub-tier")).toHaveText(tierLabel(s.tier));
      await expect(item.getByTestId("ai-bench-sub-index")).toHaveText(fmtIndex(s.index!));
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
    const pick = nearestCombination();
    if (pick.harness !== DEFAULT_SUBSTITUTE_HARNESS) await chooseFinderHarness(page, pick.harness);
    finderHarness = pick.harness;
    await chooseFinderModel(page, pick.model);
  },
);

Then("the finder states that no model of that harness reaches that model's tier", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-finder-lead")).toHaveText(
    fill(t("en", "aiBenchFinderNearest"), {
      harness: HARNESS_DISPLAY_NAMES[finderHarness],
      tier: tierLabel(tierOf(target!.id)),
    }),
  );
});

Then("the finder lists the highest-scoring models of that harness as the nearest options", async ({ page }) => {
  const candidates = rated
    .filter((s) => s.model.harnesses.includes(finderHarness) && s.model.id !== target!.id)
    .sort(byIndexDesc);
  const listed = (await subIds(page)).map((id) => scored.find((s) => s.model.id === id)!);
  // Compare indexes, not ids: equal-index models may swap places without changing the claim.
  expect(listed.map((s) => s.index)).toEqual(candidates.slice(0, NEAREST_OPTION_COUNT).map((s) => s.index));
  for (const s of listed) expect(s.model.harnesses).toContain(finderHarness);
  await expect(page.getByTestId("ai-bench-sub-list")).toHaveAttribute("data-kind", "nearest");
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

Then("the ultra, planning, and execution sections each name their anchor model", async ({ page }) => {
  for (const tier of ANCHORED) {
    await expect(page.getByTestId(`ai-bench-tier-${tier}`).getByTestId("ai-bench-tier-floor")).toContainText(
      byId(TIER_ANCHORS[tier]).name,
    );
  }
});

Then("each of those sections states its floor score", async ({ page }) => {
  const a = tierAnchors(full);
  for (const tier of ANCHORED) {
    await expect(page.getByTestId(`ai-bench-tier-${tier}`).getByTestId("ai-bench-tier-floor")).toContainText(
      fmtIndex(a[tier]!.index!),
    );
  }
});

Then("the fast section states that it holds rated models below the execution floor", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-tier-fast").getByTestId("ai-bench-tier-floor")).toHaveText(
    t("en", "aiBenchTierFastFloor"),
  );
});

Then("every rated model row carries the model name and its composite index in text", async ({ page }) => {
  expect(sorted(await tierMapIds(page))).toEqual(sorted(rated.map((s) => s.model.id)));
  for (const s of rated) {
    const row = page.locator(`[data-testid="ai-bench-tier-row"][data-model-id="${s.model.id}"]`);
    await expect(row.getByTestId("ai-bench-tier-row-name")).toHaveText(s.model.name);
    await expect(row.getByTestId("ai-bench-tier-row-index")).toHaveText(fmtIndex(s.index!));
  }
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

Given("two rated models whose composite indices differ", async ({ page }) => {
  const ordered = [...rated].sort(byIndexDesc);
  pair = [ordered[0]!.model.id, ordered[ordered.length - 1]!.model.id];
  expect(ordered[0]!.index).not.toBe(ordered[ordered.length - 1]!.index);
  await load(page);
});

Then("the ratio of their bar lengths equals the ratio of their composite indices", async ({ page }) => {
  const width = async (id: string) =>
    (await page
      .locator(`[data-testid="ai-bench-tier-row"][data-model-id="${id}"] [data-testid="ai-bench-bar"]`)
      .boundingBox())!.width;
  const [a, b] = pair;
  const measuredRatio = (await width(a)) / (await width(b));
  const expected = compositeIndex(byId(a))! / compositeIndex(byId(b))!;
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
  "each model row lists its tier, every benchmark score, composite index, input price, output price, and blended price",
  async ({ page }) => {
    expect(sorted(await tableIds(page))).toEqual(sorted(full.models.map((m) => m.id)));
    for (const s of scored) {
      const row = tableRow(page, s.model.id);
      const p = s.model.price;
      await expect(row.getByTestId("ai-bench-table-tier")).toHaveText(tierLabel(s.tier));
      await expect(row.getByTestId("ai-bench-table-index")).toHaveText(s.index === undefined ? "—" : fmtIndex(s.index));
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

Then("it lists every composite benchmark with its version and weight", async ({ page }) => {
  const items = page.getByTestId("ai-bench-method-benchmark");
  await expect(items).toHaveCount(BENCHMARK_SPECS.length);
  for (const [i, b] of BENCHMARK_SPECS.entries()) {
    await expect(items.nth(i)).toContainText(b.name);
    await expect(items.nth(i)).toContainText(fill(t("en", "aiBenchMethodVersion"), { version: b.version }));
    await expect(items.nth(i)).toContainText(fill(t("en", "aiBenchMethodWeight"), { weight: b.weight }));
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

Then("it states the minimum number of benchmarks needed for a tier", async ({ page }) => {
  await expect(page.getByTestId("ai-bench-method-index")).toHaveText(
    fill(t("en", "aiBenchMethodIndex"), { min: MIN_SCORED_BENCHMARKS }),
  );
});

Then("it lists every tier anchor with its floor score", async ({ page }) => {
  const a = tierAnchors(full);
  for (const tier of ANCHORED) {
    const item = page.locator(`[data-testid="ai-bench-method-anchor"][data-tier="${tier}"]`);
    await expect(item).toContainText(a[tier]!.model.name);
    await expect(item).toContainText(fmtIndex(a[tier]!.index!));
  }
});

Then("the worked example shows a model's benchmark scores and the resulting composite index", async ({ page }) => {
  const m = byId(METHOD_EXAMPLE.indexModel);
  const example = page.getByTestId("ai-bench-method-example-index");
  await expect(example).toBeVisible();
  await expect(example).toContainText(m.name);
  for (const b of scoredBenchmarks(m)) await expect(example).toContainText(fmtIndex(scoredFigure(m, b)!.value));
  await expect(example).toContainText(fmtIndex(compositeIndex(m)!));
});

Then("the worked example's composite index equals that model's index in the data table", async ({ page }) => {
  const tableIndex = await tableRow(page, METHOD_EXAMPLE.indexModel).getByTestId("ai-bench-table-index").innerText();
  await expect(page.getByTestId("ai-bench-method-example-index")).toContainText(`index ${tableIndex}.`);
});

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
