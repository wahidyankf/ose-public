// @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: legacy course URLs reach the canonical course
// @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: The retired fundamentally-strong browse roots permanently redirect to the course library
// @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: The course library the retired browse roots redirect to resolves every re-homed course
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { getResilient } from "../support/resilient-request";

const { Then } = createBdd();

// Folded in from the former course-paths breadcrumb scenario: a visitor's ?path= query survives the legacy redirect.
Then("the redirect preserves any path context query parameter", async ({ page }) => {
  const legacyUrl =
    "/en/learn/fundamentally-strong/software-engineer/just-enough-python?path=careers/interview-ready/backend-track";
  const response = await page.request.get(legacyUrl, { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  await page.goto(legacyUrl);
  await page.waitForLoadState("networkidle");
  expect(new URL(page.url()).pathname).toBe("/en/learn/courses/just-enough-python");
  expect(new URL(page.url()).searchParams.get("path")).toBe("careers/interview-ready/backend-track");
});

Then(
  "every course catalog entry should resolve to live content, not a drained or missing location",
  async ({ page }) => {
    await page.waitForLoadState("networkidle");
    const main = page.getByRole("main");
    // Bare href (DD-48 de-namespacing) — the /c/ content route was retired.
    const links = main.locator("a[href*='/learn/courses/']");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    const hrefs = new Set<string>();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href) hrefs.add(href);
    }

    await Promise.all(
      [...hrefs].map(async (href) => {
        // See `getResilient` — retries once on a load-induced ECONNRESET; the 30s timeout
        // (vs. the 10s default) additionally tolerates slow-but-successful responses under
        // full-suite contention. A genuine 404/drained route still fails on the retry.
        const response = await getResilient(page, href, { timeout: 30000 });
        expect(response.status(), `Course catalog entry ${href} should not be a drained/missing location`).not.toBe(
          404,
        );
      }),
    );
  },
);

Then(
  "the resolved page title should equal the canonical course page title at {string}",
  async ({ page }, canonicalUrl: string) => {
    await page.waitForLoadState("networkidle");
    const legacyTitle = await page.title();
    expect(legacyTitle.length).toBeGreaterThan(0);

    await page.goto(canonicalUrl);
    await page.waitForLoadState("networkidle");
    const canonicalTitle = await page.title();

    expect(legacyTitle).toBe(canonicalTitle);
  },
);

// The page the legacy URL lands on carries the canonical course's authored title.
Then("the canonical course page is titled {string}", async ({ page }, title: string) => {
  await page.waitForLoadState("networkidle");
  expect(await page.title()).toContain(title);
});
