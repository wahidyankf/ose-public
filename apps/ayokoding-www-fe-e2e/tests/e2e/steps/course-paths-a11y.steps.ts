import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/accessibility.feature: Path navigation surfaces are labelled landmarks
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/accessibility.feature: Path navigation works by keyboard with visible focus
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/accessibility.feature: The page language matches the locale

// course-paths plan (ayokoding-learning-path-03-navigation-ui), Cycle 3.3 — accessibility contract
// for the path-aware navigation surfaces (rail, banner, breadcrumb, prerequisite list, prev/next).
// Runs against the same fixture manifest set as `course-paths.steps.ts` (see
// apps/ayokoding-www-fe-e2e/fixtures/manifests/README.md).

const FIXTURE_COURSE_IN_PATH_URL =
  "/en/learn/courses/backend-essentials?path=careers/immediately-effective/backend-track";
const FIXTURE_RAIL_LABEL = "Backend Track (Immediately-Effective) course list";
const PHONE_VIEWPORT = { width: 375, height: 812 };

Given("a reader uses a keyboard and a screen reader on a course in path context", async ({ page }) => {
  await page.goto(FIXTURE_COURSE_IN_PATH_URL);
  await page.waitForLoadState("networkidle");
});

When("they navigate the path rail, banner, breadcrumb, prerequisite list, and prev\\/next", async ({ page }) => {
  const landmarks = [
    page.getByRole("navigation", { name: FIXTURE_RAIL_LABEL }),
    page.getByRole("navigation", { name: "Breadcrumb" }),
    page.getByRole("navigation", { name: "Prerequisites" }),
    page.getByRole("navigation", { name: "Page navigation" }),
  ];
  for (const landmark of landmarks) {
    await expect(landmark).toBeVisible();
    const firstLink = landmark.getByRole("link").first();
    await firstLink.focus();
    await expect(firstLink).toBeFocused();
  }
});

Then("each is a labelled landmark", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: FIXTURE_RAIL_LABEL })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Prerequisites" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Page navigation" })).toBeVisible();
});

Then("each is reachable and operable by keyboard with visible focus", async ({ page }) => {
  // Path rail — desktop viewport (Playwright's default project runs at >= md width).
  const rail = page.getByRole("navigation", { name: FIXTURE_RAIL_LABEL });
  await expect(rail).toBeVisible();
  // Playwright's `getByRole` does not support a `current` filter option — filter by the actual
  // `aria-current="page"` DOM attribute instead.
  const currentRailLink = rail.locator('a[aria-current="page"]');
  await expect(currentRailLink).toBeVisible();
  await currentRailLink.focus();
  await expect(currentRailLink).toBeFocused();
  await expectVisibleFocusRing(currentRailLink);

  // Breadcrumb.
  const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(breadcrumb).toBeVisible();
  const breadcrumbLink = breadcrumb.getByRole("link").first();
  await breadcrumbLink.focus();
  await expect(breadcrumbLink).toBeFocused();
  await expectVisibleFocusRing(breadcrumbLink);

  // Prerequisite list.
  const prerequisites = page.getByRole("navigation", { name: "Prerequisites" });
  await expect(prerequisites).toBeVisible();
  const prerequisiteLink = prerequisites.getByRole("link").first();
  await prerequisiteLink.focus();
  await expect(prerequisiteLink).toBeFocused();
  await expectVisibleFocusRing(prerequisiteLink);

  // Prev/next.
  const pageNav = page.getByRole("navigation", { name: "Page navigation" });
  await expect(pageNav).toBeVisible();
  const pageNavLink = pageNav.getByRole("link").first();
  await pageNavLink.focus();
  await expect(pageNavLink).toBeFocused();
  await expectVisibleFocusRing(pageNavLink);

  // Path banner (the rail's mobile form, `md:hidden`) — re-check at phone width, where it is the
  // visible surface instead of the rail.
  await page.setViewportSize(PHONE_VIEWPORT);
  const bannerTrigger = page.getByRole("button", { name: /Open path course list/ });
  await expect(bannerTrigger).toBeVisible();
  await bannerTrigger.focus();
  await expect(bannerTrigger).toBeFocused();
  await expectVisibleFocusRing(bannerTrigger);
  await page.setViewportSize({ width: 1280, height: 800 });
});

Then("the document language attribute matches the active locale", async ({ page }) => {
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

async function expectVisibleFocusRing(locator: import("@playwright/test").Locator) {
  const style = await locator.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return { outline: computed.outline, outlineWidth: computed.outlineWidth, boxShadow: computed.boxShadow };
  });
  const hasFocusIndicator = (style.outline !== "none" && style.outlineWidth !== "0px") || style.boxShadow !== "none";
  expect(hasFocusIndicator, "focused element should have a visible outline or box-shadow").toBe(true);
}
