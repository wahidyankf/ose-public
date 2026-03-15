import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { loginUser, createExpense } from "@/utils/api-helpers.js";

const { Given, When, Then } = createBdd();

Given(
  "{word} has created an income entry of {string} USD on {string}",
  async ({}, username: string, amount: string, date: string) => {
    const { accessToken } = await loginUser(username, "Str0ng#Pass1");
    await createExpense(accessToken, {
      amount,
      currency: "USD",
      category: "salary",
      description: `Income ${amount}`,
      date,
      type: "income",
    });
  },
);

Given(
  "{word} has created an expense entry of {string} USD on {string}",
  async ({}, username: string, amount: string, date: string) => {
    const { accessToken } = await loginUser(username, "Str0ng#Pass1");
    await createExpense(accessToken, {
      amount,
      currency: "USD",
      category: "food",
      description: `Expense ${amount}`,
      date,
      type: "expense",
    });
  },
);

Given(
  "{word} has created income entries in categories {string} and {string}",
  async ({}, username: string, cat1: string, cat2: string) => {
    const { accessToken } = await loginUser(username, "Str0ng#Pass1");
    await createExpense(accessToken, {
      amount: "1000.00",
      currency: "USD",
      category: cat1,
      description: `${cat1} income`,
      date: "2025-03-01",
      type: "income",
    });
    await createExpense(accessToken, {
      amount: "500.00",
      currency: "USD",
      category: cat2,
      description: `${cat2} income`,
      date: "2025-03-01",
      type: "income",
    });
  },
);

Given("{word} has created expense entries in category {string}", async ({}, username: string, category: string) => {
  const { accessToken } = await loginUser(username, "Str0ng#Pass1");
  await createExpense(accessToken, {
    amount: "200.00",
    currency: "USD",
    category,
    description: `${category} expense`,
    date: "2025-03-01",
    type: "expense",
  });
});

Given(
  "{word} has created only an income entry of {string} USD on {string}",
  async ({}, username: string, amount: string, date: string) => {
    const { accessToken } = await loginUser(username, "Str0ng#Pass1");
    await createExpense(accessToken, {
      amount,
      currency: "USD",
      category: "salary",
      description: `Income only ${amount}`,
      date,
      type: "income",
    });
  },
);

Given(
  "{word} has created only an expense entry of {string} USD on {string}",
  async ({}, username: string, amount: string, date: string) => {
    const { accessToken } = await loginUser(username, "Str0ng#Pass1");
    await createExpense(accessToken, {
      amount,
      currency: "USD",
      category: "food",
      description: `Expense only ${amount}`,
      date,
      type: "expense",
    });
  },
);

Given("{word} has created income entries in both USD and IDR", async ({}, username: string) => {
  const { accessToken } = await loginUser(username, "Str0ng#Pass1");
  await createExpense(accessToken, {
    amount: "1000.00",
    currency: "USD",
    category: "salary",
    description: "USD income",
    date: "2025-05-01",
    type: "income",
  });
  await createExpense(accessToken, {
    amount: "5000000",
    currency: "IDR",
    category: "salary",
    description: "IDR income",
    date: "2025-05-01",
    type: "income",
  });
});

Given("{word} has created income and expense entries", async ({}, username: string) => {
  const { accessToken } = await loginUser(username, "Str0ng#Pass1");
  await createExpense(accessToken, {
    amount: "1000.00",
    currency: "USD",
    category: "salary",
    description: "Salary",
    date: "2025-01-15",
    type: "income",
  });
  await createExpense(accessToken, {
    amount: "150.00",
    currency: "USD",
    category: "food",
    description: "Food",
    date: "2025-01-20",
    type: "expense",
  });
});

When(
  "{word} selects date range {string} to {string} with currency {string}",
  async ({ page }, _username: string, startDate: string, endDate: string, currency: string) => {
    const startInput = page
      .getByRole("textbox", { name: /start.?date|from/i })
      .or(page.getByLabel(/start.?date|from/i));
    await startInput.fill(startDate);

    const endInput = page.getByRole("textbox", { name: /end.?date/i }).or(page.getByLabel(/end.?date/i));
    await endInput.fill(endDate);

    const currencySelect = page.getByRole("combobox", { name: /currency/i }).or(page.getByLabel(/currency/i));
    await currencySelect.selectOption(currency);

    await page.getByRole("button", { name: /apply|filter|search|generate/i }).click();
  },
);

When(
  "{word} selects the appropriate date range and currency {string}",
  async ({ page }, _username: string, currency: string) => {
    const startInput = page
      .getByRole("textbox", { name: /start.?date|from/i })
      .or(page.getByLabel(/start.?date|from/i));
    await startInput.fill("2025-01-01");

    const endInput = page.getByRole("textbox", { name: /end.?date/i }).or(page.getByLabel(/end.?date/i));
    await endInput.fill("2025-12-31");

    const currencySelect = page.getByRole("combobox", { name: /currency/i }).or(page.getByLabel(/currency/i));
    await currencySelect.selectOption(currency);

    await page.getByRole("button", { name: /apply|filter|search|generate/i }).click();
  },
);

When("{word} views the P&L report for March 2025 in USD", async ({ page }) => {
  await page.goto("/reporting");
  await page
    .getByRole("textbox", { name: /start.?date|from/i })
    .or(page.getByLabel(/start.?date|from/i))
    .fill("2025-03-01");
  await page
    .getByRole("textbox", { name: /end.?date/i })
    .or(page.getByLabel(/end.?date/i))
    .fill("2025-03-31");
  await page
    .getByRole("combobox", { name: /currency/i })
    .or(page.getByLabel(/currency/i))
    .selectOption("USD");
  await page.getByRole("button", { name: /apply|filter|search|generate/i }).click();
});

When("{word} views the P&L report for April 2025 in USD", async ({ page }) => {
  await page.goto("/reporting");
  await page
    .getByRole("textbox", { name: /start.?date|from/i })
    .or(page.getByLabel(/start.?date|from/i))
    .fill("2025-04-01");
  await page
    .getByRole("textbox", { name: /end.?date/i })
    .or(page.getByLabel(/end.?date/i))
    .fill("2025-04-30");
  await page
    .getByRole("combobox", { name: /currency/i })
    .or(page.getByLabel(/currency/i))
    .selectOption("USD");
  await page.getByRole("button", { name: /apply|filter|search|generate/i }).click();
});

When("{word} views the P&L report filtered to {string} only", async ({ page }, _username: string, currency: string) => {
  await page.goto("/reporting");
  await page
    .getByRole("textbox", { name: /start.?date|from/i })
    .or(page.getByLabel(/start.?date|from/i))
    .fill("2025-01-01");
  await page
    .getByRole("textbox", { name: /end.?date/i })
    .or(page.getByLabel(/end.?date/i))
    .fill("2025-12-31");
  await page
    .getByRole("combobox", { name: /currency/i })
    .or(page.getByLabel(/currency/i))
    .selectOption(currency);
  await page.getByRole("button", { name: /apply|filter|search|generate/i }).click();
});

Then("the report should display income total {string}", async ({ page }, amount: string) => {
  await expect(page.getByText(amount).first()).toBeVisible();
});

Then("the report should display expense total {string}", async ({ page }, amount: string) => {
  await expect(page.getByText(amount).first()).toBeVisible();
});

Then("the report should display net {string}", async ({ page }, amount: string) => {
  await expect(page.getByText(amount).first()).toBeVisible();
});

Then(
  "the income breakdown should list {string} and {string} categories",
  async ({ page }, cat1: string, cat2: string) => {
    await expect(page.getByText(new RegExp(cat1, "i"))).toBeVisible();
    await expect(page.getByText(new RegExp(cat2, "i"))).toBeVisible();
  },
);

Then("the expense breakdown should list {string} category", async ({ page }, category: string) => {
  await expect(page.getByText(new RegExp(category, "i"))).toBeVisible();
});

Then("the report should display only USD amounts", async ({ page }) => {
  await expect(page.getByTestId("pl-chart").getByText("USD").first()).toBeVisible();
});

Then("no IDR amounts should be included", async ({ page }) => {
  await expect(page.getByText("IDR")).not.toBeVisible();
});
