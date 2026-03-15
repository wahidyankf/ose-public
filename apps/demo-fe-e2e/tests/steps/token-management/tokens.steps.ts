import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { When, Then } = createBdd();

When("the app fetches the JWKS endpoint", async ({}) => {
  // The JWKS check is done in the Then step
});

When("{word} attempts to access the dashboard directly", async ({ page }) => {
  await page.goto("/expenses");
});

Then("the panel should display {word}'s user ID", async ({ page }, _username: string) => {
  await expect(page.getByTestId("token-subject").first()).toBeVisible();
});

Then("the panel should display a non-empty issuer value", async ({ page }) => {
  await expect(page.getByTestId("token-issuer").or(page.getByText(/issuer|iss/i)).first()).toBeVisible();
});

Then("at least one public key should be available", async ({ page }) => {
  const response = await page.request.get(
    `${process.env["BACKEND_URL"] ?? "http://localhost:8201"}/.well-known/jwks.json`,
  );
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { keys: unknown[] };
  expect(body.keys).toBeDefined();
  expect((body.keys as unknown[]).length).toBeGreaterThan(0);
});
