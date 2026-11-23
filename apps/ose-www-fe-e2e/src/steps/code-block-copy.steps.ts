import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

// @scenario specs/apps/ose/www/behaviours/frontend/content/code-block-copy.feature: Code blocks in site content show a copy button
// @scenario specs/apps/ose/www/behaviours/frontend/content/code-block-copy.feature: Mermaid diagrams show no copy button
// @scenario specs/apps/ose/www/behaviours/frontend/content/code-block-copy.feature: Clicking the copy button copies the code to the clipboard and confirms it

const { Given, When, Then } = createBdd();

// The about fixture page carries one fenced code sample and one mermaid diagram (tests/e2e-fixtures/content).
const CODE_SAMPLE = 'const greeting = "hello";';

Given("a reader opens the about page with a code sample", async ({ page }) => {
  // Record what the copy button writes, instead of relying on the browser clipboard permission.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: (text: string) => {
          (window as unknown as { __copiedText?: string }).__copiedText = text;
          return Promise.resolve();
        },
      },
      configurable: true,
    });
  });
  await page.goto("/about/");
  await expect(page.locator('[data-slot="code-block-copy"]').first()).toBeVisible();
});

Given("a reader opens the about page with a mermaid diagram", async ({ page }) => {
  await page.goto("/about/");
  await expect(page.getByRole("heading", { name: "Mermaid diagram" })).toBeVisible();
});

Then("the code sample shows a copy button", async ({ page }) => {
  await expect(page.locator('[data-slot="code-block-copy"]').first()).toBeVisible();
});

Then("the mermaid diagram shows no copy button", async ({ page }) => {
  // The fixture has one code sample, so the only copy button on the page belongs to it.
  await expect(page.locator('[data-slot="code-block-copy"]')).toHaveCount(1);
});

When("the reader clicks the copy button of the code sample", async ({ page }) => {
  await page.locator('[data-slot="code-block-copy"]').first().click();
});

Then("the code sample is copied to the clipboard", async ({ page }) => {
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __copiedText?: string }).__copiedText))
    .toContain(CODE_SAMPLE);
});

Then("the copy button confirms the copy", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
});
