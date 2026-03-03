import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { When, Then } = createBdd();

When("the user clicks the {string} button in the navigation sidebar", async ({ page }, name: string) => {
  await page.getByRole("button", { name }).click();
});

Then("the authentication session should be ended", async ({ page }) => {
  await expect(page).toHaveURL(/\/login/);
});

Then("navigating to {string} should redirect the user back to the login page", async ({ page }, path: string) => {
  await page.goto(path);
  await expect(page).toHaveURL(/\/login/);
});
