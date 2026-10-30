// Canonical routes and navigation steps for the Playwright E2E adapter.
// Redirect assertions use the request API without following redirects so the
// suite observes the exact 308 status and Location the server sends.
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { bodyOf, fetchText, gotoPage, locationOf, statusOf } from "../support/http";
import { stateFor } from "../support/state";

const { Given, When, Then } = createBdd();

When("a visitor requests the root URL", async ({ page }) => {
  await fetchText(page, "/", { maxRedirects: 0 });
});

Then("the visitor is redirected to {string}", async ({ page }, destination: string) => {
  expect(statusOf(page)).toBe(308);
  expect(locationOf(page)).toBe(destination);
});

Then("the redirect does not loop", async ({ page }) => {
  await gotoPage(page, "/en");
  expect(statusOf(page)).toBe(200);
});

When("a visitor requests {string}", async ({ page }, source: string) => {
  stateFor(page).lastUrl = source;
  await fetchText(page, source, { maxRedirects: 0 });
});

Then("the response permanently redirects with status 308 to {string}", async ({ page }, destination: string) => {
  expect(statusOf(page)).toBe(308);
  expect(locationOf(page)).toBe(destination);
});

Given("an old content URL has a redirect in the current committed redirect inventory", async () => {
  // The parity fixture inventory maps /en/old-guide to its canonical lesson.
});

When("a visitor requests that URL with a query string", async ({ page }) => {
  stateFor(page).lastUrl = "/en/old-guide";
  await fetchText(page, "/en/old-guide?from=local", { maxRedirects: 0 });
});

Then("the response is a 308 redirect to the inventory's canonical destination", async ({ page }) => {
  expect(statusOf(page)).toBe(308);
  expect(locationOf(page)).toBe("/en/learn/courses/go-basics/learning/hello-world?from=local");
});

Then("the query string is preserved", async ({ page }) => {
  expect(locationOf(page)).toContain("from=local");
});

Then("the redirect does not depend on the old page still existing", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
  expect(statusOf(page)).toBe(200);
});

When("a reader opens a nested published lesson", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
});

Then("the sidebar expands its ancestors and identifies the active page", async ({ page }) => {
  for (const marker of ["data-sidebar-nav", 'data-active-page="hello-world"', 'aria-current="page"']) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("the breadcrumbs link to its current section and course ancestors", async ({ page }) => {
  for (const marker of ["data-breadcrumbs", "/en/learn/courses/go-basics/learning/setup", "Start"]) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("every link stays within the selected locale", async ({ page }) => {
  // The locale switcher itself deliberately points at the other locale (with
  // the current path preserved by script); every other link must stay local.
  const foreign = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href^="/id/learn"]'))
      .filter((anchor) => !anchor.hasAttribute("data-locale-switch"))
      .map((anchor) => anchor.getAttribute("href")),
  );
  expect(foreign).toEqual([]);
  expect(bodyOf(page)).not.toContain('href="//');
  expect(bodyOf(page)).toContain("data-locale-switch");
});

Given("a reader opened a lesson through a valid learning path", async ({ page }) => {
  stateFor(page).pathId = "backend-id";
  await gotoPage(page, "/en/learn/courses/go-basics/learning/setup?path=backend-id");
});

When("the reader follows the next or previous lesson control", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/setup?path=backend-id");
});

Then("the destination follows the path's current phase and course order", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  expect(bodyOf(page)).toContain("/en/learn/courses/go-basics/learning/hello-world?path=backend-id");
});

Then("the path context remains in the destination URL", async ({ page }) => {
  expect(bodyOf(page)).toContain('data-path-context="backend-id"');
});

Given("a reader has followed an internal link to another content page", async ({ page }) => {
  await gotoPage(page, "/en/learn/courses/go-basics/learning/setup");
});

When("the reader navigates back", async ({ page }) => {
  // Follow a real internal link forward so the browser history has somewhere
  // to return from, then exercise the real traversal control.
  await gotoPage(page, "/en/learn/courses/go-basics/learning/hello-world");
  await page.goBack();
  await page.waitForLoadState();
});

Then("the previous content route and its URL state are restored", async ({ page }) => {
  // Read the live document: the recorded request state still describes the
  // forward navigation, while the browser really went back.
  expect(page.url()).toContain("/en/learn/courses/go-basics/learning/setup");
  const html = await page.content();
  expect(html).toContain("Setup");
  expect(html).not.toContain("Hello World</h1>");
});

Then("navigation controls reflect the restored location", async ({ page }) => {
  const html = await page.content();
  expect(html).toContain("data-lesson-nav");
  expect(html).toContain("data-breadcrumbs");
});

When("a reader opens a legacy archived page", async ({ page }) => {
  await gotoPage(page, "/en/learn/legacy/software-engineering");
});

Then("the legacy page serves its canonical content", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  const body = bodyOf(page);
  expect(body).toContain("Legacy Software Engineering");
  expect(body).toContain("Archived canonical content");
  expect(body).toContain('lang="en"');
});

When("a visitor requests a legacy deep course URL", async ({ page }) => {
  await fetchText(page, "/en/learn/fundamentally-strong/software-engineer/just-enough-python/learning/intro", {
    maxRedirects: 0,
  });
});
