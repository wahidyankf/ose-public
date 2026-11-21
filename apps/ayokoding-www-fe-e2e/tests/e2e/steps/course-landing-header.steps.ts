import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

// Plan ayokoding-learn-revamp-03 — course landing header (course-landing-header.feature).

// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-landing-header.feature: The header shows description, format, time, and category
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-landing-header.feature: The header lists the paths that use the course
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-landing-header.feature: Start course opens the best first page
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-landing-header.feature: The course contents list follows the header
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-landing-header.feature: A course page shows its prerequisites list and its paths list at most once
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-landing-header.feature: An outline course header says it is an outline
// @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/course-landing-header.feature: Pages inside a course have no header

Given("a course with a description, a format, an estimated time, a category, and prerequisites", async ({ page }) => {
  await page.goto("/en/learn/courses/sql-essentials");
});

When("a reader opens the course landing page", async ({ page }) => {
  await page.goto("/en/learn/courses/sql-essentials");
  await expect(page.locator('header[aria-label="Course summary"]')).toBeVisible();
});

Then("the header shows the description under the title", async ({ page }) => {
  await expect(page.locator('header[aria-label="Course summary"]')).toBeVisible();
  await expect(page.locator('header[aria-label="Course summary"] p').first()).not.toBeEmpty();
});

Then("the header shows the format, the estimated time, and the category", async ({ page }) => {
  const header = page.locator('header[aria-label="Course summary"]');
  await expect(header).toContainText("Code by example");
  await expect(header).toContainText(/About \d+ h/);
  await expect(header).toContainText("Data and databases");
});

Then("the header lists the paths that use the course as links", async ({ page }) => {
  await expect(page.locator('header[aria-label="Course summary"]')).toBeVisible();
});

// Start course: one Outline, one row per starting point. The course slug in each row is opened first.
Given(/^the course (\S+) is open on its landing page$/, async ({ page }, course: string) => {
  await page.goto(`/en/learn/courses/${course}`);
  await expect(page.getByRole("link", { name: "Start course" })).toBeVisible();
});

When('a reader activates "Start course" on the course landing page', async ({ page }) => {
  await page.getByRole("link", { name: "Start course" }).click();
});

Then(/^the page (\/\S+) opens$/, async ({ page }, expectedPath: string) => {
  const escaped = expectedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await expect(page).toHaveURL(new RegExp(`${escaped}$`));
});

Then("that page is not inside a folder that has no index page", async ({ page }) => {
  await expect(page).not.toHaveURL(/artifacts/);
});

Then('the "Course contents" heading and the list of course pages appear after the header', async ({ page }) => {
  await page.goto("/en/learn/courses/sql-essentials");
  await expect(page.getByRole("heading", { name: "Course contents" })).toBeVisible();
});

Then("the page has exactly one prerequisites list", async ({ page }) => {
  await expect(page.getByRole("navigation", { name: "Prerequisites" })).toHaveCount(1);
});

Then('the page has at most one "This course is part of" list', async ({ page }) => {
  expect(await page.getByRole("navigation", { name: "This course is part of" }).count()).toBeLessThanOrEqual(1);
});

Then('the header shows an "Outline" badge', async ({ page }) => {
  await expect(page.locator('header[aria-label="Course summary"]')).toContainText("Outline");
});

Then("the header shows no estimated time", async ({ page }) => {
  await expect(page.locator('header[aria-label="Course summary"]')).not.toContainText(/About \d+ h/);
});

When("a reader opens a learning page inside a course", async ({ page }) => {
  await page.goto("/en/learn/courses/sql-essentials/learning/overview");
});

Then("no course header is shown", async ({ page }) => {
  await expect(page.getByRole("link", { name: "Start course" })).toHaveCount(0);
});
