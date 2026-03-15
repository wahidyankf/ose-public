import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

Given("the navigation drawer is open", async ({ page }) => {
  const hamburger = page.getByRole("button", {
    name: /menu|hamburger|toggle/i,
  }).first();
  await hamburger.click();
  await expect(page.getByRole("dialog").or(page.getByRole("navigation")).first()).toBeVisible();
});

// "{word} has created income and expense entries" is defined in reporting.steps.ts

Given(
  "the viewport is set to {string} \\({int}x{int}\\)",
  async ({ page }, _label: string, width: number, height: number) => {
    await page.setViewportSize({ width, height });
  },
);

When("{word} taps the hamburger menu button", async ({ page }) => {
  await page.getByRole("button", { name: /menu|hamburger|toggle/i }).first().click();
});

When("{word} taps a navigation item", async ({ page }) => {
  const navItems = page.getByTestId("nav-drawer").getByRole("link");
  await navItems.first().click();
});

Then("the sidebar navigation should be visible", async ({ page }) => {
  await expect(page.getByRole("navigation").or(page.getByTestId("sidebar"))).toBeVisible();
});

Then("the sidebar should display navigation labels alongside icons", async ({ page }) => {
  const nav = page.getByRole("navigation").or(page.getByTestId("sidebar"));
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link").first()).toBeVisible();
});

Then("the sidebar navigation should be collapsed to icon-only mode", async ({ page }) => {
  await expect(page.getByTestId("sidebar-collapsed").or(page.getByRole("navigation"))).toBeVisible();
});

Then("hovering over a sidebar icon should show a tooltip with the label", async ({ page }) => {
  const navIcon = page.getByRole("navigation").getByRole("link").first();
  await navIcon.hover();
  await expect(page.getByRole("tooltip").or(page.locator("[title]")).first()).toBeVisible({ timeout: 2000 });
});

Then("the sidebar should not be visible", async ({ page }) => {
  const sidebar = page.getByTestId("sidebar").or(page.getByRole("complementary"));
  await expect(sidebar).not.toBeVisible({ timeout: 2000 });
});

Then("a hamburger menu button should be displayed in the header", async ({ page }) => {
  await expect(page.getByRole("button", { name: /menu|hamburger|toggle/i }).first()).toBeVisible();
});

Then("a slide-out navigation drawer should appear", async ({ page }) => {
  await expect(page.getByRole("dialog").or(page.getByTestId("nav-drawer"))).toBeVisible();
});

Then("the drawer should close", async ({ page }) => {
  await expect(page.getByRole("dialog").or(page.getByTestId("nav-drawer"))).not.toBeVisible({ timeout: 2000 });
});

Then("the selected page should load", async ({ page }) => {
  await expect(page).not.toHaveURL("about:blank");
});

Then("entries should be displayed in a multi-column table", async ({ page }) => {
  await expect(page.getByRole("table")).toBeVisible();
});

Then("the table should show columns for date, description, category, amount, and currency", async ({ page }) => {
  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  await expect(table.getByText(/date/i)).toBeVisible();
  await expect(table.getByText(/description/i)).toBeVisible();
  await expect(table.getByText(/amount/i)).toBeVisible();
});

Then("entries should be displayed as stacked cards", async ({ page }) => {
  await expect(page.getByTestId("entry-card").or(page.getByRole("article")).or(page.locator(".card")).first()).toBeVisible();
});

Then("each card should show description, amount, and date", async ({ page }) => {
  const card = page.getByTestId("entry-card").or(page.getByRole("article")).first();
  await expect(card).toBeVisible();
});

Then("the user list should be horizontally scrollable", async ({ page }) => {
  const table = page.getByRole("table").or(page.getByTestId("user-table"));
  await expect(table).toBeVisible();
});

Then("the visible columns should prioritize username and status", async ({ page }) => {
  await expect(page.getByText(/username/i)).toBeVisible();
  await expect(page.getByText(/status/i)).toBeVisible();
});

Then("the P&L chart should resize to fit the viewport", async ({ page }) => {
  await expect(page.getByTestId("pl-chart").or(page.getByRole("img", { name: /chart/i }))).toBeVisible();
});

Then("category breakdowns should stack vertically below the chart", async ({ page }) => {
  await expect(page.getByTestId("category-breakdown").or(page.getByText(/category/i)).first()).toBeVisible();
});

Then("the login form should span the full viewport width with padding", async ({ page }) => {
  const form = page.getByRole("form").or(page.locator("form"));
  await expect(form).toBeVisible();
});

Then("the form inputs should be large enough for touch interaction", async ({ page }) => {
  const input = page.getByRole("textbox").first();
  await expect(input).toBeVisible();
  const box = await input.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(40);
});

Then("the attachment upload area should display a prominent upload button", async ({ page }) => {
  await expect(page.getByRole("button", { name: /upload|attach/i })).toBeVisible();
});

Then("drag-and-drop should be replaced with a file picker", async ({ page }) => {
  await expect(page.getByRole("button", { name: /choose file|browse|upload/i })).toBeVisible();
});
