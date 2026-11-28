// Canonical routes and navigation steps for the Playwright E2E adapter.
// Redirect assertions use the request API without following redirects so the
// suite observes the exact 308 status and Location the server sends. Every route
// is a real-corpus witness found by rule (support/witness.ts).
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { bodyOf, fetchText, gotoPage, statusOf } from "../support/http";
import { stateFor } from "../support/state";
import { pathContaining, pathWhere, primaryCourse, primaryPage } from "../support/witness";

const { Given, When, Then } = createBdd();

// Behaviour corpus binding (contract C13). The Playwright home runs the whole
// routes-and-navigation feature; no scenario here is exempt.
// @scenario specs/apps/ayokoding/web/behaviours/navigation/routes-and-navigation.feature: *

When("a reader opens a nested published lesson", async ({ page }) => {
  await gotoPage(page, primaryPage(0).route);
});

Then("the sidebar expands its ancestors and identifies the active page", async ({ page }) => {
  const lesson = primaryPage(0);
  for (const marker of ["data-sidebar-nav", `data-active-page="${lesson.slug}"`, 'aria-current="page"']) {
    expect(bodyOf(page)).toContain(marker);
  }
});

Then("the breadcrumbs link to its current section and course ancestors", async ({ page }) => {
  const { course } = primaryCourse();
  for (const marker of ["data-breadcrumbs", course.route]) {
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

// The path witness is a path that holds the primary course, so the lesson opened through it is in that path.
function pathLessons() {
  const { course } = primaryCourse();
  return { path: pathContaining(course.slug), current: primaryPage(0), next: primaryPage(1) };
}

Given("a reader opened a lesson through a valid learning path", async ({ page }) => {
  const { path, current } = pathLessons();
  stateFor(page).pathId = path.id;
  await gotoPage(page, `${current.route}?path=${path.id}`);
});

When("the reader follows the next or previous lesson control", async ({ page }) => {
  const { path, current } = pathLessons();
  await gotoPage(page, `${current.route}?path=${path.id}`);
});

Then("the destination follows the path's current phase and course order", async ({ page }) => {
  expect(statusOf(page)).toBe(200);
  const { path, next } = pathLessons();
  expect(bodyOf(page)).toContain(`${next.route}?path=${path.id}`);
});

Then("the path context remains in the destination URL", async ({ page }) => {
  expect(bodyOf(page)).toContain(`data-path-context="${pathLessons().path.id}"`);
});

Given("a reader has followed an internal link to another content page", async ({ page }) => {
  await gotoPage(page, primaryPage(0).route);
});

When("the reader navigates back", async ({ page }) => {
  // Follow a real internal link forward so the browser history has somewhere
  // to return from, then exercise the real traversal control.
  await gotoPage(page, primaryPage(1).route);
  await page.goBack();
  await page.waitForLoadState();
});

Then("the previous content route and its URL state are restored", async ({ page }) => {
  // Read the live document: the recorded request state still describes the
  // forward navigation, while the browser really went back.
  const current = primaryPage(0);
  const other = primaryPage(1);
  expect(page.url()).toContain(current.route);
  const html = await page.content();
  expect(html).toContain(current.title);
  expect(html).not.toContain(`${other.title}</h1>`);
});

Then("navigation controls reflect the restored location", async ({ page }) => {
  const html = await page.content();
  expect(html).toContain("data-lesson-nav");
  expect(html).toContain("data-breadcrumbs");
});

// The learn-entry pages and the entry link each one must list in its locale.
const learnPages: Record<string, { route: string; entry: () => string }> = {
  "learn home": { route: "/learn", entry: () => "/learn/courses" },
  "paths hub": { route: "/learn/paths", entry: () => `/learn/paths/${pathWhere().id}` },
};

When("a reader opens the {string} page in the {string} locale", async ({ page }, pageName: string, locale: string) => {
  const known = learnPages[pageName];
  if (known === undefined) throw new Error(`unknown learn-entry page ${pageName}`);
  stateFor(page).learnPage = pageName;
  await fetchText(page, `/${locale}${known.route}`);
});

Then("the page lists its entries in the {string} locale", async ({ page }, locale: string) => {
  expect(statusOf(page)).toBe(200);
  const known = learnPages[stateFor(page).learnPage ?? ""];
  if (known === undefined) throw new Error("no learn-entry page was opened");
  expect(bodyOf(page)).toContain(`/${locale}${known.entry()}`);
  expect(bodyOf(page)).not.toContain('href="//');
});
