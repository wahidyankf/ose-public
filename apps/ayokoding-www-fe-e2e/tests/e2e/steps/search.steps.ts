// @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: Cmd+K keyboard shortcut opens the search dialog
// @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: Typing a query shows matching results that update as the query changes
// @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: Clicking a search result navigates to that page
// @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: Escape key closes the search dialog
// @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: Search results show title, section path, and excerpt
// @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: Global search surfaces the Tools pages
// @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: Ctrl+K opens the search dialog on non-Mac platforms
// @scenario specs/apps/ayokoding/www/behaviours/frontend/search/search.feature: A query with no match shows a no-results message
import { createBdd } from "playwright-bdd";
import { expect, type Locator } from "@playwright/test";

const { Given, When, Then } = createBdd();
let initialResultTexts: string[] = [];
let selectedResultSlug = "";
let searchTrigger: Locator;

When("a visitor presses Cmd+K on the page", async ({ page }) => {
  await page.goto("/en");
  await page.keyboard.press("ControlOrMeta+k");
});

Then("the search dialog should open", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  await expect(searchDialog).toBeVisible({ timeout: 5000 });
});

Then("the search input should have focus", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  const searchInput = searchDialog.getByRole("combobox");
  await expect(searchInput).toBeFocused({ timeout: 5000 });
});

Given("the search dialog is open", async ({ page }) => {
  await page.goto("/en");
  searchTrigger = page.getByRole("button", { name: /search/i }).first();
  await searchTrigger.focus();
  await searchTrigger.click();
  const searchDialog = page.getByRole("dialog");
  await expect(searchDialog).toBeVisible({ timeout: 5000 });
});

When("the visitor types a query into the search input", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  const searchInput = searchDialog.getByRole("combobox");
  await searchInput.fill("programming");
});

Then("search results should appear after a debounce delay", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  const results = searchDialog.getByRole("listbox");
  await expect(results).toBeVisible({ timeout: 15000 });
  await expect(results.getByRole("option").first()).toBeVisible({
    timeout: 15000,
  });
  initialResultTexts = await results.getByRole("option").allTextContents();
});

Then("results should update when the visitor changes the query", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  const searchInput = searchDialog.getByRole("combobox");
  await searchInput.fill("golang");
  const results = searchDialog.getByRole("listbox");
  await expect(results.getByRole("option").first()).toBeVisible({ timeout: 15000 });
  await expect.poll(() => results.getByRole("option").allTextContents()).not.toEqual(initialResultTexts);
});

Given("the visitor has typed a query that returns at least one result", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  const searchInput = searchDialog.getByRole("combobox");
  await searchInput.fill("programming");
  const results = searchDialog.getByRole("listbox");
  await expect(results.getByRole("option").first()).toBeVisible({
    timeout: 15000,
  });
});

When("the visitor clicks a search result", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  const firstResult = searchDialog.getByRole("option").first();
  selectedResultSlug = (await firstResult.getAttribute("data-result-slug")) ?? "";
  expect(selectedResultSlug).not.toBe("");
  await firstResult.scrollIntoViewIfNeeded();
  await firstResult.click();
});

Then("the search dialog should close", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  await expect(searchDialog).toBeHidden({ timeout: 5000 });
});

Then("the visitor should be navigated to the page for that result", async ({ page }) => {
  await expect(page).toHaveURL(
    new RegExp(`/en/${selectedResultSlug.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}(?:[?#]|$)`),
  );
});

When("the visitor presses Escape", async ({ page }) => {
  await page.keyboard.press("Escape");
});

Then("focus should return to the page behind the dialog", async () => {
  await expect(searchTrigger).toBeFocused({ timeout: 3000 });
});

When("the visitor types a query that returns results", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  const searchInput = searchDialog.getByRole("combobox");
  await searchInput.fill("programming");
  const results = searchDialog.getByRole("listbox");
  await expect(results.getByRole("option").first()).toBeVisible({
    timeout: 15000,
  });
});

Then("each result should display the page title", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  const options = searchDialog.getByRole("option");
  expect(await options.count()).toBeGreaterThan(0);
  for (const option of await options.all()) {
    await expect(option.getByTestId("search-result-title")).not.toHaveText("");
  }
});

Then("each result should display the section path indicating where the page lives", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  for (const option of await searchDialog.getByRole("option").all()) {
    await expect(option.getByTestId("search-result-path")).not.toHaveText("");
  }
});

Then("each result should display a text excerpt showing the matching content", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  for (const option of await searchDialog.getByRole("option").all()) {
    await expect(option.getByTestId("search-result-excerpt")).not.toHaveText("");
  }
});

// USS-001 (Rule-15 fix): the search index used to be built entirely from markdown `content/`
// files, structurally excluding the Tools section; `staticSearchDocs()` now merges the two tool
// pages into the index for both locales.
When("the visitor types a query naming the AI Model Benchmark tool", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  const searchInput = searchDialog.getByRole("combobox");
  await searchInput.fill("AI Model Benchmark");
  const results = searchDialog.getByRole("listbox");
  await expect(results.getByRole("option").first()).toBeVisible({ timeout: 15000 });
});

Then("a result linking to the AI Model Benchmark tool page is shown", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  const benchmarkResult = searchDialog.getByRole("option", { name: /AI Model Benchmark/i });
  await expect(benchmarkResult).toBeVisible({ timeout: 15000 });
});

// AYW-019: the handler accepts Control as well as Meta, so the same shortcut works on Windows and Linux.
When("a visitor presses Ctrl+K on the page", async ({ page }) => {
  await page.goto("/en");
  await page.keyboard.press("Control+k");
});

When("the visitor types a query that matches no page", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  const searchInput = searchDialog.getByRole("combobox");
  await searchInput.fill("zzqxqwerty");
});

// AYW-022: the empty-state line the dialog renders when a finished query returns no result.
Then("the search dialog should show a no-results message", async ({ page }) => {
  const searchDialog = page.getByRole("dialog");
  await expect(searchDialog).toContainText("No results found", { timeout: 15000 });
});
