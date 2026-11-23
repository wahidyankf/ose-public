import { expect, type APIRequestContext } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData, state } from "./helpers";

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

async function getHtml(request: APIRequestContext, url: string): Promise<{ status: number; html: string }> {
  const response = await request.get(url);
  const html = await response.text();
  return { status: response.status(), html };
}

function updateLinkTexts(html: string): string[] {
  const links: string[] = [];
  const pattern = /<a[^>]*href="\/updates\/[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    links.push(
      match[1]!
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    );
  }
  return links;
}

Given("the OSE_WEB_CONTENT_DIR environment variable names the content directory", async ({ request }) => {
  // The e2e server is started with OSE_WEB_CONTENT_DIR pointing at the fixture directory.
  const response = await request.get(buildTrpcUrl("content.listUpdates", undefined));
  expect(response.ok()).toBeTruthy();
  const updates = extractTrpcData(await response.json()) as { title: string }[];
  expect(updates.map(({ title }) => title)).toContain("Phase 0 End");
  state.updatesResult = updates;
});

Then("every listed update is read from that directory", async () => {
  const updates = state.updatesResult as { title: string }[];
  expect(updates.map(({ title }) => title)).toEqual(FIXTURE_UPDATE_TITLES);
});

Given("the OSE_WEB_SEARCH_DATA_PATH environment variable names a search index file", async ({ request }) => {
  // The e2e server is started with OSE_WEB_SEARCH_DATA_PATH pointing at the fixture index file.
  const response = await request.get(buildTrpcUrl("search.query", { query: "synthetic", limit: 10 }));
  expect(response.ok()).toBeTruthy();
  state.searchResults = extractTrpcData(await response.json());
});

Then("the results contain the page indexed in that file", async () => {
  const results = state.searchResults as { slug: string; title: string }[];
  expect(results).toContainEqual(expect.objectContaining({ slug: "about" }));
});

When("a visitor opens the About page", async ({ request }) => {
  const { status, html } = await getHtml(request, "/about/");
  expect(status).toBe(200);
  state.pageHtml = html;
});

Then("the page heading is the title of the About page", async () => {
  expect(state.pageHtml as string).toContain("About OSE E2E Fixture");
});

Then("the page shows the headings of the About page", async () => {
  expect(state.pageHtml as string).toContain("Fixture scope");
});

When("a visitor opens the Updates page", async ({ request }) => {
  const { status, html } = await getHtml(request, "/updates/");
  expect(status).toBe(200);
  state.pageHtml = html;
});

Then("the update titles are listed newest first", async () => {
  const links = updateLinkTexts(state.pageHtml as string);
  const positions = FIXTURE_UPDATE_TITLES.map((title) => links.findIndex((text) => text.includes(title)));
  for (const position of positions) {
    expect(position).toBeGreaterThanOrEqual(0);
  }
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
});

When("a visitor opens the update page for the slug {string}", async ({ request }, slug: string) => {
  const { status } = await getHtml(request, `/updates/${slug}/`);
  state.pageStatus = status;
});

Then("the response status is {int}", async ({}, expected: number) => {
  expect(state.pageStatus).toBe(expected);
});
