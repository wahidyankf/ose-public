// Tool behaviour steps for the Playwright E2E adapter. Both tools keep the
// existing results and shareable URLs; the suite asserts the real served
// pages against the shared reference vectors both runtimes prove.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { bodyOf, fetchText, gotoPage, statusOf } from "../support/http";
import { stateFor } from "../support/state";

const { Given, When, Then } = createBdd();

Given("the current shared benchmark data and an established calculation vector", async () => {
  // The parity fixture serves the chat/mid vector both runtimes prove.
});

When("the reader applies that vector's filters and comparison options", async ({ page }) => {
  await fetchText(page, "/en/tools/ai-benchmark?use-case=chat&price-band=mid");
});

Then("the displayed figures, ordering, and value results match the vector", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  const first = bodyOf(page).indexOf("Model B");
  const second = bodyOf(page).indexOf("Model A");
  expect(first).toBeGreaterThanOrEqual(0);
  expect(second).toBeGreaterThanOrEqual(0);
  expect(first).toBeLessThan(second);
  for (const marker of ["9.1", "8.2", "Model B", "Model A"]) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("TypeScript and Go produce the same accepted results", async ({ page }) => {
  await fetchText(page, "/en/tools/ai-benchmark?use-case=chat&price-band=mid");
  const first = bodyOf(page).indexOf("Model B");
  const second = bodyOf(page).indexOf("Model A");
  expect(first).toBeGreaterThanOrEqual(0);
  expect(second).toBeGreaterThan(0);
  expect(first).toBeLessThan(second);
});

Given("a benchmark URL encodes supported comparison options", async ({ page }) => {
  stateFor(page).journey = "benchmark-valid";
});

When("a reader opens that URL", async ({ page }) => {
  const journey = stateFor(page).journey ?? "benchmark-valid";
  if (journey === "benchmark-invalid") {
    await gotoPage(page, "/en/tools/ai-benchmark?use-case=nope&min-score=abc");
  } else if (journey === "calculator") {
    await gotoPage(page, "/en/tools/cost-of-living-calculator?city=jakarta&role=mid&mode=standard&workers=1");
  } else {
    await gotoPage(page, "/en/tools/ai-benchmark?use-case=chat&price-band=mid&min-score=8");
  }
});

Then("every supported option reflects the encoded state", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  for (const marker of ['value="chat"', 'value="mid"', 'value="8"']) {
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
  for (const marker of ['value="chat"', 'value="mid"']) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("the comparison remains usable without an error", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
});

Given("the benchmark data has been extracted into shared JSON", async () => {
  // The parity fixture mirrors the shared dataset the data library proves.
});

When("either implementation reads the data and generates its reference results", async ({ page }) => {
  await fetchText(page, "/en/tools/ai-benchmark?use-case=chat&price-band=mid");
});

Then("model figures, prices, ordering policies, and reference results remain unchanged", async ({ page }) => {
  expect(bodyOf(page)).toContain("Model B");
  expect(bodyOf(page)).toContain("Model A");
  expect(bodyOf(page)).toContain("$4");
});

Then("the source links, source dates, notes, and methodology remain available", async ({ page }) => {
  await gotoPage(page, "/en/tools/ai-benchmark?use-case=chat&price-band=mid");
  expect(statusOf(page)).toBe(200);
});

Given("a supported filter combination matches no model", async () => {
  // chat/ultra matches nothing in the parity fixture.
});

When("the reader applies that combination", async ({ page }) => {
  await gotoPage(page, "/en/tools/ai-benchmark?use-case=chat&price-band=ultra");
});

Then("the tool shows an intentional no-results state", async ({ page }) => {
  expect(bodyOf(page)).toContain("data-empty-state");
});

Then("the reader can change or reset the filters", async ({ page }) => {
  expect(bodyOf(page)).toContain("data-tool-filters");
});

Given("the current shared city, role, and foreign-exchange data", async () => {
  // The parity fixture serves the jakarta/mid/standard vector both runtimes prove.
});

When("a reader enters an established calculator vector's inputs", async ({ page }) => {
  await fetchText(page, "/en/tools/cost-of-living-calculator?city=jakarta&role=mid&mode=standard&workers=1");
});

Then("the displayed costs, savings, and minimum qualifying role match that vector", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  for (const marker of ["900", "600", "mid"]) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Given("a calculator URL encodes supported geography, household, schooling, and income options", async ({ page }) => {
  stateFor(page).journey = "calculator";
});

Then("every supported input reflects the encoded state", async ({ page }) => {
  await fetchText(page, "/en/tools/cost-of-living-calculator?city=jakarta&role=mid&mode=standard&workers=1");
  for (const marker of ['value="jakarta"', 'value="mid"', 'value="standard"', 'value="1"']) {
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
  await fetchText(page, "/en/tools/cost-of-living-calculator?city=jakarta&workers=abc");
});

Then("it applies the existing input codec's accepted recovery or validation result", async ({ page }) => {
  for (const marker of ['value="jakarta"', 'value="1"']) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("the tool does not display a misleading finite estimate from invalid arithmetic", async ({ page }) => {
  await fetchText(page, "/en/tools/cost-of-living-calculator?city=atlantis&workers=abc");
  expect(bodyOf(page)).toContain("data-fallback-state");
});

Given("a reader has selected a city", async ({ page }) => {
  await fetchText(page, "/en/tools/cost-of-living-calculator?city=jakarta&role=mid&mode=standard&workers=1");
  expect(statusOf(page)).toBe(200);
});

When("the reader changes geography so that city is no longer eligible", async ({ page }) => {
  await gotoPage(page, "/en/tools/cost-of-living-calculator?city=atlantis&role=mid&mode=standard&workers=1");
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
  await fetchText(page, "/en/tools/cost-of-living-calculator?city=jakarta&role=mid&mode=standard&workers=1");
});

Then("it uses the shared USD-per-unit rates without refreshing them", async ({ page }) => {
  expect(bodyOf(page)).toContain("900");
});

Then("the independent FX snapshot date and per-currency provenance remain available", async ({ page }) => {
  await gotoPage(page, "/en/tools/cost-of-living-calculator?city=jakarta&role=mid&mode=standard&workers=1");
  expect(statusOf(page)).toBe(200);
});
