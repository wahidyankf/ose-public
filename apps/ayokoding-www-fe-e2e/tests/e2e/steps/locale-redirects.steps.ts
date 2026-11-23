// @scenario specs/apps/ayokoding/www/behaviours/frontend/i18n/locale-redirects.feature: The root URL enters the default locale
// @scenario specs/apps/ayokoding/www/behaviours/frontend/i18n/locale-redirects.feature: Uppercase locale URLs redirect to lowercase canonical URLs
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import type { Page, Response } from "@playwright/test";

const { Given, When, Then } = createBdd();
const localeEntryResponses = new WeakMap<Page, Response>();

Given("a visitor requests the root URL", async ({ page }) => {
  await page.goto("/");
});

Given("a visitor requests the uppercase locale URL {string}", async ({ page }, sourceUrl: string) => {
  const redirectResponse = page.waitForResponse(
    (response) => response.request().isNavigationRequest() && new URL(response.url()).pathname === sourceUrl,
  );
  await page.goto(sourceUrl);
  localeEntryResponses.set(page, await redirectResponse);
});

When("locale redirects are applied", async ({ page }) => {
  await page.waitForLoadState("networkidle");
});

Then("the visitor reaches the default locale at {string}", async ({ page }, destinationUrl: string) => {
  await expect(page).toHaveURL(new RegExp(`${destinationUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
});

Then("the visitor is permanently redirected to {string}", async ({ page }, destinationUrl: string) => {
  const redirectResponse = localeEntryResponses.get(page);
  expect(redirectResponse, "the locale entry response should be captured").toBeDefined();
  expect(redirectResponse!.status()).toBe(308);
  expect(new URL(redirectResponse!.headers().location!, redirectResponse!.url()).pathname).toBe(destinationUrl);
  await expect(page).toHaveURL(new RegExp(`${destinationUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
});
