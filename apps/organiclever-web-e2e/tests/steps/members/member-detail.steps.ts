import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { When, Then } = createBdd();

When("the user navigates to the detail page for member {int}", async ({ page }, id: number) => {
  // Navigate client-side via sidebar link to avoid auth race condition on full page load
  await page.locator("a[href='/dashboard/members']").click();
  await page.waitForURL(/\/dashboard\/members$/);
  await expect(page.locator("tbody tr")).toHaveCount(6);
  // Click the Eye (view) button — index 0 — in the row at position id-1
  await page
    .locator("tbody tr")
    .nth(id - 1)
    .locator("button")
    .nth(0)
    .click();
  await page.waitForURL(new RegExp(`/dashboard/members/${id}`));
  await page.waitForLoadState("networkidle");
});

Then("the page should display the name {string}", async ({ page }, name: string) => {
  await expect(page.getByText(name)).toBeVisible();
});

Then("the page should display the role {string}", async ({ page }, role: string) => {
  await expect(page.getByText(role)).toBeVisible();
});

Then("the page should display the email {string}", async ({ page }, email: string) => {
  await expect(page.getByText(email)).toBeVisible();
});

Then("the page should display a GitHub link for {string}", async ({ page }, handle: string) => {
  await expect(page.getByRole("link", { name: handle })).toBeVisible();
});

When("the user navigates to the detail page for a member id that does not exist", async ({ page }) => {
  await page.goto("/dashboard/members/99999");
});

Then("the user should be redirected to the members list page", async ({ page }) => {
  await page.waitForURL(/\/dashboard\/members$/);
});
