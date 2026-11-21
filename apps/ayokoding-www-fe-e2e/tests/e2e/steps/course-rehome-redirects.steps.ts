// @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A legacy fundamentally-strong URL redirects to the canonical course URL
// @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A legacy fundamentally-strong deep sub-page URL redirects to its canonical course sub-page
// @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: The retired fundamentally-strong browse roots permanently redirect to the course library
// @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: The course library the retired browse roots redirect to resolves every re-homed course
// @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A course reached via its legacy course URL resolves to the single canonical course body
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { getResilient } from "../support/resilient-request";

const { Then } = createBdd();

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
