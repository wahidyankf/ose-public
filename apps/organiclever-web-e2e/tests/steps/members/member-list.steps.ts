import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { When, Then } = createBdd();

Then("the member list should show {int} members", async ({ page }, count: number) => {
  await expect(page.locator("tbody tr")).toHaveCount(count);
});

When("the user types {string} in the search field", async ({ page }, term: string) => {
  // pressSequentially triggers React's onChange reliably for controlled inputs
  await page.getByPlaceholder("Search members").pressSequentially(term);
});

Then("only members whose name contains {string} should be displayed", async ({ page }, term: string) => {
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr td").first()).toContainText(term, { ignoreCase: true });
});

Then("only members whose role is {string} should be displayed", async ({ page }, role: string) => {
  const rows = page.locator("tbody tr");
  await expect(rows).not.toHaveCount(0);
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i).getByText(role)).toBeVisible();
  }
});

Then("only {string} should appear in the results", async ({ page }, name: string) => {
  await expect(page.getByText(name)).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(1);
});

When("the user clicks the row for {string}", async ({ page }, name: string) => {
  await page.locator("tbody tr").filter({ hasText: name }).locator("td").first().click();
});

Then("the user should be on the detail page for Alice Johnson", async ({ page }) => {
  await page.waitForURL(/\/dashboard\/members\/1/);
});

Then("{string} should appear in the member list", async ({ page }, name: string) => {
  await expect(page.getByText(name)).toBeVisible();
});

Then("{string} should no longer appear in the member list", async ({ page }, name: string) => {
  await expect(page.locator("tbody").getByText(name)).not.toBeVisible();
});

Then("{string} should still appear in the member list", async ({ page }, name: string) => {
  await expect(page.getByText(name)).toBeVisible();
});
