import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";

const { Given, When, Then } = createBdd();

// @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/tools-index.feature: Each tool entry on the tools index has a description distinct from its link text
// @scenario specs/apps/ayokoding/www/behaviours/frontend/tools/tools-index.feature: Exactly one main landmark renders on the Tools pages

// The tool entries of the tools index, keyed by the feature's Examples value: each entry's link
// name and the test id of its description element.
const TOOL_ENTRIES: Record<string, { link: RegExp; descriptionTestId: string }> = {
  "Cost of living calculator": { link: /cost of living/i, descriptionTestId: "tool-desc-calculator" },
  "AI benchmark": { link: /ai (model )?benchmark/i, descriptionTestId: "tool-desc-ai-benchmark" },
};

// ── Tool entries have a description distinct from their link text ─────────────

Given("I am on the tools index page", async ({ page }) => {
  await page.goto("/en/tools");
  await page.waitForLoadState("networkidle");
});

When("the {string} entry renders", async ({ page }, _tool: string) => {
  await page.waitForLoadState("networkidle");
});

Then("the {string} entry shows a description distinct from its link text", async ({ page }, tool: string) => {
  const entry = TOOL_ENTRIES[tool];
  if (entry === undefined) throw new Error(`unknown tool entry: ${tool}`);

  // Scope to the main content area to avoid matching the footer Tools column,
  // which also links to each tool.
  const main = page.locator("#main-content");
  const entryLink = main.getByRole("link", { name: entry.link });
  await expect(entryLink).toBeVisible();
  const linkText = (await entryLink.textContent())?.trim() ?? "";

  const descEl = page.locator(`[data-testid='${entry.descriptionTestId}']`);
  await expect(descEl).toBeVisible();
  const descText = (await descEl.textContent())?.trim() ?? "";

  // The description must be non-empty and differ from the link text
  expect(descText.length).toBeGreaterThan(0);
  expect(descText).not.toBe(linkText);
});

// ── EWT-001 regression: exactly one <main> landmark per page ───────────────────

Given("I navigate to {string}", async ({ page }, path: string) => {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
});

Then("exactly one main landmark is present", async ({ page }) => {
  await expect(page.locator("main")).toHaveCount(1);
});
