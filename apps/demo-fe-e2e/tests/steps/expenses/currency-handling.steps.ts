import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { loginUser, createExpense } from "@/utils/api-helpers.js";

const { Given, When, Then } = createBdd();

Given(
  "{word} has created an expense with amount {string}, currency {string}, category {string}, description {string}, and date {string}",
  async (
    {},
    username: string,
    amount: string,
    currency: string,
    category: string,
    description: string,
    date: string,
  ) => {
    const { accessToken } = await loginUser(username, "Str0ng#Pass1");
    await createExpense(accessToken, {
      amount,
      currency,
      category,
      description,
      date,
      type: "expense",
    });
  },
);

Given("{word} has created expenses in both USD and IDR", async ({}, username: string) => {
  const { accessToken } = await loginUser(username, "Str0ng#Pass1");
  await createExpense(accessToken, {
    amount: "50.00",
    currency: "USD",
    category: "food",
    description: "USD expense",
    date: "2025-01-15",
    type: "expense",
  });
  await createExpense(accessToken, {
    amount: "100000",
    currency: "IDR",
    category: "transport",
    description: "IDR expense",
    date: "2025-01-15",
    type: "expense",
  });
});

When("{word} views the entry detail for {string}", async ({ page }, _username: string, description: string) => {
  await page.goto("/expenses");
  await page.getByText(description).first().click();
});

When("{word} navigates to the expense summary page", async ({ page }) => {
  await page.goto("/expenses/summary");
});

// "{word} fills in amount..." is defined in expense-management.steps.ts

Then("the amount should display as {string}", async ({ page }, amount: string) => {
  await expect(page.getByText(amount)).toBeVisible();
});

Then("the currency should display as {string}", async ({ page }, currency: string) => {
  await expect(page.getByText(currency)).toBeVisible();
});

Then("a validation error for the currency field should be displayed", async ({ page }) => {
  await expect(page.getByText(/invalid currency|unsupported currency|currency.*invalid/i)).toBeVisible();
});

Then("the summary should display a separate total for {string}", async ({ page }, currency: string) => {
  await expect(page.getByText(currency).first()).toBeVisible();
});

Then("no cross-currency total should be shown", async ({ page }) => {
  await expect(page.getByText(/total.*all|combined total/i)).not.toBeVisible();
});

Then("a validation error for the amount field should be displayed", async ({ page }) => {
  await expect(page.getByText(/invalid amount|negative|amount.*invalid|must be positive/i)).toBeVisible();
});
