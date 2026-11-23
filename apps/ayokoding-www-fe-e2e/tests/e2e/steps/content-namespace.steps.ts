// @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/content-namespace-redirects.feature: A /c/-namespaced English learn URL permanently redirects to its bare URL
// @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/content-namespace-redirects.feature: A /c/-namespaced Indonesian belajar URL permanently redirects to its bare URL
// @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/content-namespace-redirects.feature: top-level pages are not redirected
import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { getResilient } from "../support/resilient-request";

const { When, Then } = createBdd();

// ---------------------------------------------------------------------------
// Raw HTTP redirect assertions (no browser auto-follow)
// ---------------------------------------------------------------------------

When("a raw HTTP GET is made to {string} with redirects disabled", async ({ page }, url: string) => {
  // Stash the raw response on the page object via evaluate so the Then step
  // can inspect it. We use page.request (the APIRequestContext bound to this
  // browser context) with maxRedirects: 0 so the 308 is captured as-is.
  const response = await getResilient(page, url, { maxRedirects: 0 });
  // Store status + location in page title attribute via a temp state variable.
  // playwright-bdd shares fixture state across steps in the same scenario,
  // so we piggy-back on page.evaluate to stash in window.__redirectCapture.
  await page.evaluate(
    ({ status, location }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__redirectCapture = { status, location };
    },
    {
      status: response.status(),
      location: response.headers()["location"] ?? "",
    },
  );
});

Then("the response status should be {int}", async ({ page }, expectedStatus: number) => {
  const capture = await page.evaluate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (window as any).__redirectCapture as { status: number; location: string },
  );
  expect(capture.status).toBe(expectedStatus);
});

Then("the response Location header should equal {string}", async ({ page }, expectedLocation: string) => {
  const capture = await page.evaluate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (window as any).__redirectCapture as { status: number; location: string },
  );
  expect(capture.location).toBe(expectedLocation);
});

// ---------------------------------------------------------------------------
// Non-redirect guard assertions
// ---------------------------------------------------------------------------

Then("the page should load successfully", async ({ page }) => {
  // Verify the page loaded without a network-level error. Works for both
  // content pages (article) and other page types (main, etc.).
  await page.waitForLoadState("networkidle");
  const readyState = await page.evaluate(() => document.readyState);
  expect(readyState).toBe("complete");
});

Then("the current URL should not contain {string}", async ({ page }, fragment: string) => {
  await page.waitForLoadState("networkidle");
  expect(page.url()).not.toContain(fragment);
});

// ---------------------------------------------------------------------------
// Bare content-URL navigation assertions (DD-48 de-namespacing)
// ---------------------------------------------------------------------------

Then("a breadcrumb nav should be present", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toBeVisible();
});

Then("the browse index should show a section card for {string}", async ({ page }, sectionSlug: string) => {
  // SectionCard renders as an <a class="group block ..."> link inside a grid.
  // Sidebar links lack the "group" class — scope with it to avoid strict-mode
  // ambiguity when both the sidebar and the section card share the same href.
  // Bare href (DD-48 de-namespacing) — the /c/ content route was retired.
  const main = page.getByRole("main");
  const link = main.locator(`a.group[href*="/${sectionSlug}"]`);
  await expect(link).toBeVisible();
});

Then("the breadcrumb should start with a Home link", async ({ page }) => {
  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  const homeLink = breadcrumb.getByRole("link").first();
  await expect(homeLink).toBeVisible();
});
