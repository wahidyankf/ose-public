import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData, backendState } from "./backend-helpers";

// @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: The About page renders at /about with its title and content
// @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: The Updates page lists the published updates newest first
// @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Opening an unknown update URL returns 404
// @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Content is read from the directory named by OSE_WEB_CONTENT_DIR
// @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Search reads the index at the path named by OSE_WEB_SEARCH_DATA_PATH

const { Given, When, Then } = createBdd();

// Fixture update titles, newest first, as the e2e server lists them from tests/e2e-fixtures/content.
const FIXTURE_UPDATE_TITLES = [
  "Phase 0 End",
  "Phase 1 Fixture",
  "Phase 2 Fixture",
  "Phase 3 Fixture",
  "Phase 4 Fixture",
];

Given("the OSE_WEB_CONTENT_DIR environment variable names the content directory", async ({ request }) => {
  // The e2e server is started with OSE_WEB_CONTENT_DIR pointing at the fixture directory.
  const response = await request.get(buildTrpcUrl("content.listUpdates", undefined));
  expect(response.ok()).toBeTruthy();
  const titles = (extractTrpcData(await response.json()) as { title: string }[]).map(({ title }) => title);
  expect(titles).toContain("Phase 0 End");
});

Then("every listed update is read from that directory", async () => {
  const updates = backendState.updatesResult as { title: string }[];
  expect(updates.map(({ title }) => title)).toEqual(FIXTURE_UPDATE_TITLES);
});

Given("the OSE_WEB_SEARCH_DATA_PATH environment variable names a search index file", async ({ request }) => {
  // The e2e server is started with OSE_WEB_SEARCH_DATA_PATH pointing at the fixture index file.
  const response = await request.get(buildTrpcUrl("search.query", { query: "synthetic", limit: 10 }));
  expect(response.ok()).toBeTruthy();
});

Then("the results contain the page indexed in that file", async () => {
  const results = backendState.searchResults as { slug: string; title: string }[];
  expect(results).toContainEqual(expect.objectContaining({ slug: "about", title: "Enterprise Compliance Fixture" }));
});

When("a visitor opens the About page", async ({ page }) => {
  await page.goto("/about/");
});

Then("the page heading is the title of the About page", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 }).first()).toHaveText("About OSE E2E Fixture");
});

Then("the page shows the headings of the About page", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Fixture scope" })).toBeVisible();
});

When("a visitor opens the Updates page", async ({ page }) => {
  await page.goto("/updates/");
});

Then("the update titles are listed newest first", async ({ page }) => {
  const links = await page.locator('a[href^="/updates/"]').allTextContents();
  const positions = FIXTURE_UPDATE_TITLES.map((title) => links.findIndex((text) => text.includes(title)));
  for (const position of positions) {
    expect(position).toBeGreaterThanOrEqual(0);
  }
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
});

When("a visitor opens the update page for the slug {string}", async ({ page }, slug: string) => {
  const response = await page.goto(`/updates/${slug}/`);
  backendState.pageStatus = response?.status();
});

Then("the response status is 404", async () => {
  expect(backendState.pageStatus).toBe(404);
});
