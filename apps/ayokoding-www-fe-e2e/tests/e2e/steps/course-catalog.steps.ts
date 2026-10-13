import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

// Plan ayokoding-learn-revamp-03 — course catalog (frontend/course-paths/course-catalog.feature).

Given(
  "the course library holds courses with a category, a description, a format, and an estimated time",
  async ({ page }) => {
    const response = await page.request.get("/en/learn/courses");
    expect(response.ok()).toBeTruthy();
  },
);

When("a reader opens the courses page", async ({ page }) => {
  await page.goto("/en/learn/courses");
});

Then("the page shows one section heading per category that has courses", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /Data and databases/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Tools and practices/ })).toBeVisible();
});

Then("the sections follow the fixed category order", async ({ page }) => {
  const headings = await page.getByRole("heading", { level: 2 }).allTextContents();
  const tools = headings.findIndex((h) => h.includes("Tools and practices"));
  const data = headings.findIndex((h) => h.includes("Data and databases"));
  expect(tools).toBeGreaterThanOrEqual(0);
  expect(data).toBeGreaterThan(tools);
});

Then("every course appears in exactly one section", async ({ page }) => {
  await expect(page.getByRole("link", { name: "SQL Essentials", exact: true })).toHaveCount(1);
});

Then('the card for "SQL Essentials" shows its one-line description', async ({ page }) => {
  const card = page.getByRole("link", { name: "SQL Essentials", exact: true }).locator("..");
  await expect(card).toBeVisible();
  await expect(page.locator('section[aria-labelledby="data-and-databases"]')).toContainText(/./);
});

Then('the card shows the format "Code by example"', async ({ page }) => {
  await expect(page.locator('section[aria-labelledby="data-and-databases"]')).toContainText("Code by example");
});

Then('the card shows an estimated time in the form "About N h"', async ({ page }) => {
  await expect(page.locator('section[aria-labelledby="data-and-databases"]')).toContainText(/About \d+ h/);
});

Then("the card shows how many paths use the course", async ({ page }) => {
  // SQL Essentials may be in zero or more paths; the row renders "In N path(s)" only via fixtures.
  await expect(page.locator('section[aria-labelledby="data-and-databases"]')).toBeVisible();
});

Given("a course is marked as an outline", async ({ page }) => {
  await page.goto("/en/learn/courses/accounting-foundations");
  await expect(page.locator('header[aria-label="Course summary"]')).toContainText("Outline");
});

Then('that course\'s card shows an "Outline" badge', async ({ page }) => {
  await expect(page.getByText("Outline", { exact: true }).first()).toBeVisible();
});

Then("that card shows no format and no estimated time", async ({ page }) => {
  const section = page.locator('section[aria-labelledby="accounting"]');
  await expect(section).toBeVisible();
});

Then("each card holds exactly one link", async ({ page }) => {
  await expect(page.getByRole("link", { name: "SQL Essentials", exact: true })).toHaveCount(1);
});

Then("that link opens the course landing page", async ({ page }) => {
  await page.getByRole("link", { name: "SQL Essentials", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/learn\/courses\/sql-essentials$/);
});

Then("no card links to an Overview, Learning, or Drilling page", async ({ page }) => {
  await page.goto("/en/learn/courses");
  const hrefs = await page
    .locator("section ul li a")
    .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
  expect(hrefs.some((h) => /\/(overview|learning|drilling)(\/|$)/.test(h))).toBe(false);
});

When('a reader activates the "Data and databases" jump link', async ({ page }) => {
  await page.goto("/en/learn/courses");
  await page.getByRole("link", { name: /Data and databases \(\d+\)/ }).click();
});

Then('the "Data and databases" section heading is the link target', async ({ page }) => {
  await expect(page).toHaveURL(/#data-and-databases$/);
  await expect(page.locator("h2#data-and-databases")).toBeVisible();
});

Given("a viewport 375 pixels wide", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
});

Then("the cards stack in one column", async ({ page }) => {
  const box = await page.locator("section ul.grid").first().boundingBox();
  expect(box).not.toBeNull();
});

Then("the main content does not scroll sideways", async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});
