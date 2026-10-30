import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Then } = createBdd();

Then("the current URL should contain {string}", async ({ page }, expectedPath: string) => {
  await expect(page).toHaveURL((url) => url.href.includes(expectedPath));
});
