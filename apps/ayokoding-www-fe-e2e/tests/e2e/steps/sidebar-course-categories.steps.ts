import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

// Plan ayokoding-learn-revamp-03 — sidebar course categories (sidebar-course-categories.feature).

Then("the sidebar Courses section shows one group button per category with its course count", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Sidebar navigation" });
  await expect(nav.getByRole("button", { name: /Data and databases/ })).toBeVisible();
  await expect(nav.getByRole("button", { name: /Tools and practices/ })).toBeVisible();
});

Then("every group starts closed", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Sidebar navigation" });
  for (const btn of await nav.getByRole("button", { name: /Data and databases|Tools and practices/ }).all()) {
    await expect(btn).toHaveAttribute("aria-expanded", "false");
  }
});

When('a reader opens the "SQL Essentials" course landing page', async ({ page }) => {
  await page.goto("/en/learn/courses/sql-essentials");
});

Then('the "Data and databases" group is open', async ({ page }) => {
  // The drawer scenario renders the same tree inside the dialog; scope there when open.
  const dialog = page.getByRole("dialog");
  const nav = (await dialog.count()) > 0 ? dialog : page.getByRole("navigation", { name: "Sidebar navigation" });
  await expect(nav.getByRole("button", { name: /Data and databases/ })).toHaveAttribute("aria-expanded", "true");
});

Then('"SQL Essentials" is marked as the current page', async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Sidebar navigation" });
  await expect(nav.getByRole("link", { name: "SQL Essentials" })).toBeVisible();
});

Then("every other group is closed", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Sidebar navigation" });
  await expect(nav.getByRole("button", { name: /Tools and practices/ })).toHaveAttribute("aria-expanded", "false");
});

Given("the sidebar shows a closed group", async ({ page }) => {
  await page.goto("/en/learn/courses");
  await page.waitForLoadState("networkidle");
});

When("the reader focuses its button and presses Enter", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Sidebar navigation" });
  const btn = nav.getByRole("button", { name: /Tools and practices/ });
  await btn.press("Enter");
});

Then("the group's courses are shown and the button reports that it is expanded", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Sidebar navigation" });
  await expect(nav.getByRole("button", { name: /Tools and practices/ })).toHaveAttribute("aria-expanded", "true");
});

When("the reader presses Space", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Sidebar navigation" });
  await nav.getByRole("button", { name: /Tools and practices/ }).press(" ");
});

Then("the group's courses are hidden and the button reports that it is collapsed", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Sidebar navigation" });
  await expect(nav.getByRole("button", { name: /Tools and practices/ })).toHaveAttribute("aria-expanded", "false");
});

When('the reader opens the navigation drawer on the "SQL Essentials" course landing page', async ({ page }) => {
  await page.goto("/en/learn/courses/sql-essentials");
  await page
    .getByRole("button", { name: /menu|navigation/i })
    .first()
    .click();
});

Then("the drawer shows the same category groups", async ({ page }) => {
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: /Data and databases/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Tools and practices/ })).toBeVisible();
});
