import { createBdd } from "playwright-bdd";
import { expect, type Page } from "@playwright/test";

const { Given, When, Then } = createBdd();

type EntryFormData = {
  amount: string;
  currency: string;
  category: string;
  description: string;
  date: string;
  type?: string;
  quantity?: number | string;
  unit?: string;
};

async function fillEntryForm(page: Page, data: EntryFormData): Promise<void> {
  const amountInput = page.getByRole("textbox", { name: /amount/i }).or(page.getByLabel(/amount/i));
  await amountInput.fill(data.amount);

  const currencyInput = page
    .getByRole("combobox", { name: /currency/i })
    .or(page.getByLabel(/currency/i))
    .or(page.getByRole("textbox", { name: /currency/i }));
  await currencyInput.fill(data.currency);

  const categoryInput = page
    .getByRole("combobox", { name: /category/i })
    .or(page.getByLabel(/category/i))
    .or(page.getByRole("textbox", { name: /category/i }));
  await categoryInput.fill(data.category);

  const descriptionInput = page.getByRole("textbox", { name: /description/i }).or(page.getByLabel(/description/i));
  await descriptionInput.fill(data.description);

  const dateInput = page.getByRole("textbox", { name: /date/i }).or(page.getByLabel(/date/i));
  await dateInput.fill(data.date);

  if (data.type) {
    const typeInput = page
      .getByRole("combobox", { name: /type/i })
      .or(page.getByLabel(/type/i))
      .or(page.getByRole("textbox", { name: /type/i }));
    if (await typeInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await typeInput.fill(data.type);
    } else {
      await page.getByRole("radio", { name: new RegExp(data.type, "i") }).click();
    }
  }

  if (data.quantity !== undefined) {
    const quantityInput = page.getByRole("textbox", { name: /quantity/i }).or(page.getByLabel(/quantity/i));
    if (await quantityInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await quantityInput.fill(String(data.quantity));
    }
  }

  if (data.unit) {
    const unitInput = page
      .getByRole("combobox", { name: /unit/i })
      .or(page.getByLabel(/unit/i))
      .or(page.getByRole("textbox", { name: /unit/i }));
    if (await unitInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await unitInput.fill(data.unit);
    }
  }
}

When(
  "{word} fills in amount {string}, currency {string}, category {string}, description {string}, date {string}, and type {string}",
  async (
    { page },
    _username: string,
    amount: string,
    currency: string,
    category: string,
    description: string,
    date: string,
    type: string,
  ) => {
    await fillEntryForm(page, {
      amount,
      currency,
      category,
      description,
      date,
      type,
    });
  },
);

// Used in expense-management only (navigates to new entry then redirects after logged out)
When("{word} navigates to the new entry form URL directly", async ({ page }) => {
  await page.goto("/expenses/new");
});

When("{word} clicks the entry {string} in the list", async ({ page }, _username: string, description: string) => {
  await page.goto("/expenses");
  await page.getByText(description).first().click();
});

When(
  "{word} clicks the edit button on the entry {string}",
  async ({ page }, _username: string, description: string) => {
    // Edit button is only on the detail page, not the list
    await page.goto("/expenses");
    await page.waitForLoadState("networkidle");
    await page.getByText(description).first().click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /edit/i }).first().click();
  },
);

When(
  "{word} changes the amount to {string} and description to {string}",
  async ({ page }, _username: string, amount: string, description: string) => {
    await page
      .getByRole("textbox", { name: /amount/i })
      .or(page.getByLabel(/amount/i))
      .fill(amount);
    await page
      .getByRole("textbox", { name: /description/i })
      .or(page.getByLabel(/description/i))
      .fill(description);
  },
);

When("{word} saves the changes", async ({ page }) => {
  await page.getByRole("button", { name: /save|update/i }).click();
});

When(
  "{word} clicks the delete button on the entry {string}",
  async ({ page }, _username: string, description: string) => {
    await page.goto("/expenses");
    const row = page.getByText(description).first();
    await row.hover();
    await page
      .getByRole("button", { name: /delete|remove/i })
      .first()
      .click();
  },
);

Then("the entry detail should display amount {string}", async ({ page }, amount: string) => {
  await expect(page.getByText(amount)).toBeVisible();
});

Then("the entry detail should display currency {string}", async ({ page }, currency: string) => {
  await expect(page.getByText(currency)).toBeVisible();
});

Then("the entry detail should display category {string}", async ({ page }, category: string) => {
  await expect(page.getByText(new RegExp(category, "i"))).toBeVisible();
});

Then("the entry detail should display description {string}", async ({ page }, description: string) => {
  await expect(page.getByText(description)).toBeVisible();
});

Then("the entry detail should display date {string}", async ({ page }, date: string) => {
  await expect(page.getByText(date)).toBeVisible();
});

Then("the entry detail should display type {string}", async ({ page }, type: string) => {
  await expect(page.getByText(new RegExp(type, "i")).first()).toBeVisible();
});

Then("the entry list should show the total count", async ({ page }) => {
  await expect(page.getByText(/total|\d+ entries|\d+ records/i)).toBeVisible();
});

// "Given alice has created an entry..." is in common.steps.ts
// "Given alice has created 3 entries" is in common.steps.ts
// "When alice submits the entry form" is in common.steps.ts
// "When alice confirms the deletion" is in common.steps.ts
// "Then the entry list should contain..." is in common.steps.ts
// "Then the entry list should not contain..." is in common.steps.ts
// "Then the entry list should display pagination controls" is in common.steps.ts
// "Then alice should be redirected to the login page" is in common.steps.ts

// Explicit use to prevent TS "no unused" errors
void Given;
