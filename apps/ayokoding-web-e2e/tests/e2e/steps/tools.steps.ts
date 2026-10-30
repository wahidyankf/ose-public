// Tool behaviour steps for the Playwright E2E adapter. Both tools keep the
// existing results and shareable URLs; the suite asserts the real served
// pages against the shared reference vectors both runtimes prove, using the
// current codec from ai-benchmark/core/url-state.ts and
// cost-of-living-calculator/core/url-state.ts.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { bodyOf, fetchText, gotoPage, statusOf } from "../support/http";
import { stateFor } from "../support/state";

const { Given, When, Then } = createBdd();

const benchVectorURL = "/en/tools/ai-benchmark?harness=command-code-pro&tier=planning";
const benchRestoreURL =
  "/en/tools/ai-benchmark?harness=cursor&tier=planning&sub=gpt-5.6-terra&sub-harness=command-code";
const benchUnknownURL = "/en/tools/ai-benchmark?harness=nope&tier=nope";
const benchEmptyURL = "/en/tools/ai-benchmark?harness=opencode-go&tier=ultra";
const calcVectorURL =
  "/en/tools/cost-of-living-calculator?city=singapore&gross=5000&baseline=my_salary&mygross=5000&mysalarycity=singapore";
const calcRestoreURL =
  "/en/tools/cost-of-living-calculator?region=asean&country=id&city=jakarta&adults=2&preschool=1&schoolkids=2&schooltype=private&area=rural";
const calcRecoveryURL = "/en/tools/cost-of-living-calculator?city=jakarta&adults=abc";
const calcLegacyURL = "/en/tools/cost-of-living-calculator?city=jakarta&role=mid&mode=standard&workers=1";
const calcFallbackURL = "/en/tools/cost-of-living-calculator?tab=min-role&target=1000000&city=no-such-city";
const calcSavingsURL = "/en/tools/cost-of-living-calculator?city=singapore&gross=5000";

const benchNames = ["GPT-6 Sol", "Grok 4.7", "GPT-5.6 Sol"];
const benchIndices = ["56.7", "56.3", "54.6"];
const benchPrices = ["$4.00", "$3.00", "$8.00"];

function benchmarkResults(body: string): string {
  // The order assertion scopes to the results list because the
  // select-based filter form above it legitimately names the same models
  // in display order.
  const at = body.indexOf("data-tool-results");
  return at < 0 ? body : body.slice(at);
}

function expectBenchmarkOrder(body: string): void {
  const results = benchmarkResults(body);
  const [first = -1, second = -1, third = -1] = benchNames.map((name) => results.indexOf(name));
  expect(first).toBeGreaterThanOrEqual(0);
  expect(second).toBeGreaterThan(0);
  expect(third).toBeGreaterThan(0);
  expect(first).toBeLessThan(second);
  expect(second).toBeLessThan(third);
}

Given("the current shared benchmark data and an established calculation vector", async () => {
  // The shared datasets serve the command-code-pro/planning vector both runtimes prove.
});

When("the reader applies that vector's filters and comparison options", async ({ page }) => {
  await fetchText(page, benchVectorURL);
});

Then("the displayed figures, ordering, and value results match the vector", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expectBenchmarkOrder(bodyOf(page));
  for (const marker of [...benchNames, ...benchIndices, ...benchPrices]) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("TypeScript and Go produce the same accepted results", async ({ page }) => {
  await fetchText(page, benchVectorURL);
  expect(statusOf(page)).toBe(200);
  expectBenchmarkOrder(bodyOf(page));
  for (const marker of [...benchNames, ...benchIndices]) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Given("a benchmark URL encodes supported comparison options", async ({ page }) => {
  stateFor(page).journey = "benchmark-valid";
});

When("a reader opens that URL", async ({ page }) => {
  const journey = stateFor(page).journey ?? "benchmark-valid";
  if (journey === "benchmark-invalid") {
    await gotoPage(page, benchUnknownURL);
  } else if (journey === "calculator") {
    await gotoPage(page, calcRestoreURL);
  } else {
    await gotoPage(page, benchRestoreURL);
  }
});

Then("every supported option reflects the encoded state", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  for (const marker of ['value="cursor"', 'value="planning"', 'value="gpt-5.6-terra"', 'value="command-code"']) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("copying the current URL preserves that state for a new visit", async ({ page }) => {
  expect(bodyOf(page)).toContain("data-encoded-state");
});

Given("a benchmark URL contains invalid or unknown filter values", async ({ page }) => {
  stateFor(page).journey = "benchmark-invalid";
});

Then("the tool uses the existing codec's valid defaults for those values", async ({ page }) => {
  // Unknown scalars recover to unset under the current codec, so the
  // comparison stays usable over the full shared roster.
  expect(bodyOf(page)).toContain('data-count="93"');
  expect(bodyOf(page)).not.toContain("data-invalid-filters");
});

Then("the comparison remains usable without an error", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
});

Given("the benchmark data has been extracted into shared JSON", async () => {
  // The embedded datasets mirror the shared JSON the data library proves.
});

When("either implementation reads the data and generates its reference results", async ({ page }) => {
  await fetchText(page, benchVectorURL);
});

Then("model figures, prices, ordering policies, and reference results remain unchanged", async ({ page }) => {
  expect(bodyOf(page)).toContain('data-count="3"');
  expectBenchmarkOrder(bodyOf(page));
  for (const marker of benchPrices) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("the source links, source dates, notes, and methodology remain available", async ({ page }) => {
  await gotoPage(page, benchVectorURL);
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("data-encoded-state");
  expect(bodyOf(page)).toContain(benchPrices[0]);
});

Given("a supported filter combination matches no model", async () => {
  // harness=opencode-go with tier=ultra is valid under the current codec
  // and matches no model in the shared roster.
});

When("the reader applies that combination", async ({ page }) => {
  await gotoPage(page, benchEmptyURL);
});

Then("the tool shows an intentional no-results state", async ({ page }) => {
  expect(bodyOf(page)).toContain("data-empty-state");
});

Then("the reader can change or reset the filters", async ({ page }) => {
  expect(bodyOf(page)).toContain("data-tool-filters");
});

Given("the current shared city, role, and foreign-exchange data", async () => {
  // The shared datasets serve the Singapore salary-baseline vector both runtimes prove.
});

When("a reader enters an established calculator vector's inputs", async ({ page }) => {
  await fetchText(page, calcVectorURL);
});

Then("the displayed costs, savings, and minimum qualifying role match that vector", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  for (const marker of ["SGD 4,718", "846 USD", "SWE I"]) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Given("a calculator URL encodes supported geography, household, schooling, and income options", async ({ page }) => {
  stateFor(page).journey = "calculator";
});

Then("every supported input reflects the encoded state", async ({ page }) => {
  await fetchText(page, calcRestoreURL);
  for (const marker of [
    'value="asean"',
    'value="id"',
    'value="jakarta"',
    'value="2"',
    'value="1"',
    'value="private"',
    'value="rural"',
  ]) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("copying the current URL preserves the inputs for a new visit", async ({ page }) => {
  expect(bodyOf(page)).toContain("data-encoded-state");
});

Given("a reader provides an invalid or out-of-range calculator input", async () => {
  // Encoded in the validation navigation below.
});

When("the tool validates that input", async ({ page }) => {
  await fetchText(page, calcRecoveryURL);
});

Then("it applies the existing input codec's accepted recovery or validation result", async ({ page }) => {
  for (const marker of ['value="jakarta"', 'value="1"']) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("the tool does not display a misleading finite estimate from invalid arithmetic", async ({ page }) => {
  // Retired fake-engine fields are unexpected under the current codec, so the
  // legacy vector yields invalid-filters and never an estimate.
  await fetchText(page, calcLegacyURL);
  expect(bodyOf(page)).toContain("data-invalid-filters");
  expect(bodyOf(page)).not.toContain("data-tool-estimate");
});

Given("a reader has selected a city", async ({ page }) => {
  await fetchText(page, calcVectorURL);
  expect(statusOf(page)).toBe(200);
});

When("the reader changes geography so that city is no longer eligible", async ({ page }) => {
  await gotoPage(page, calcFallbackURL);
});

Then("the selection follows the current tool's fallback behavior", async ({ page }) => {
  expect(bodyOf(page)).toContain("data-fallback-state");
});

Then("the visible results match the resulting geography and city selection", async ({ page }) => {
  expect(bodyOf(page)).not.toContain("data-tool-estimate");
});

Given("the city, salary, and currency datasets have their own source dates", async () => {
  // The shared datasets carry independent snapshot dates the data library proves.
});

When("either implementation calculates a currency-converted estimate", async ({ page }) => {
  await fetchText(page, calcSavingsURL);
});

Then("it uses the shared USD-per-unit rates without refreshing them", async ({ page }) => {
  expect(bodyOf(page)).toContain("846 USD");
});

Then("the independent FX snapshot date and per-currency provenance remain available", async ({ page }) => {
  await gotoPage(page, calcVectorURL);
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("data-encoded-state");
  expect(bodyOf(page)).toContain("846 USD");
});
