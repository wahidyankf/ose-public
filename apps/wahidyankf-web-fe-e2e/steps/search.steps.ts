import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { When, Then } = createBdd();

When('the visitor types "TypeScript" in the search input', async ({ page }) => {
  const input = page.getByPlaceholder(/Search skills, languages, or frameworks/i);
  await input.fill("TypeScript");
});

Then("the URL becomes /?search=TypeScript", async ({ page }) => {
  await expect(page).toHaveURL(/\?search=TypeScript$/);
});

When('a visitor opens the home page with search term "TypeScript"', async ({ page }) => {
  await page.goto("/?search=TypeScript");
  await page.waitForLoadState("load");
});

Then('the matching pill wraps "TypeScript" in a mark element', async ({ page }) => {
  const mark = page
    .locator("mark")
    .filter({ hasText: /TypeScript/i })
    .first();
  await expect(mark).toBeVisible();
});

When('a visitor opens the home page with search term "NoSuchTerm"', async ({ page }) => {
  await page.goto("/?search=NoSuchTerm");
  await page.waitForLoadState("load");
});

Then('the About Me card shows "No matching content in the About Me section."', async ({ page }) => {
  await expect(page.getByText(/No matching content in the About Me section\./i)).toBeVisible();
});

When('the visitor clicks the "TypeScript" skill pill', async ({ page }) => {
  await page.goto("/?search=TypeScript");
  await page.waitForLoadState("load");
  const pill = page
    .getByRole("button")
    .filter({ hasText: /^TypeScript$/ })
    .first();
  await pill.click();
});

Then("the URL becomes /cv?search=TypeScript&scrollTop=true", async ({ page }) => {
  await expect(page).toHaveURL(/\/cv\?search=TypeScript&scrollTop=true/);
});
