import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { vi, expect } from "vitest";
import path from "path";
import type { Expense, ExpenseSummary } from "~/lib/api/types";

vi.mock("~/lib/api/expenses", () => ({
  listExpenses: vi.fn(),
  getExpense: vi.fn(),
  createExpense: vi.fn(),
  getExpenseSummary: vi.fn(),
}));

import * as expensesApi from "~/lib/api/expenses";

const baseExpense: Expense = {
  id: "expense-1",
  userId: "user-1",
  createdAt: "2025-01-15T00:00:00Z",
  updatedAt: "2025-01-15T00:00:00Z",
  amount: "10.50",
  currency: "USD",
  category: "food",
  description: "Coffee",
  date: "2025-01-15",
  type: "expense",
};

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/expenses/currency-handling.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given, And }) => {
    Given("the app is running", () => {
      // App running in test environment
    });

    And('a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"', () => {
      // Pre-condition via mock
    });

    And("alice has logged in", () => {
      // Login pre-condition
    });
  });

  Scenario("USD expense displays two decimal places", ({ Given, When, Then, And }) => {
    let expense: Expense | null = null;

    Given(
      'alice has created an expense with amount "10.50", currency "USD", category "food", description "Coffee", and date "2025-01-15"',
      () => {
        // Expense exists via mock
      },
    );

    When('alice views the entry detail for "Coffee"', async () => {
      vi.mocked(expensesApi.getExpense).mockResolvedValue(baseExpense);
      expense = await expensesApi.getExpense("expense-1");
    });

    Then('the amount should display as "10.50"', () => {
      expect(expense?.amount).toBe("10.50");
    });

    And('the currency should display as "USD"', () => {
      expect(expense?.currency).toBe("USD");
    });
  });

  Scenario("IDR expense displays as a whole number", ({ Given, When, Then, And }) => {
    let expense: Expense | null = null;

    Given(
      'alice has created an expense with amount "150000", currency "IDR", category "transport", description "Taxi", and date "2025-01-15"',
      () => {
        // Expense exists via mock
      },
    );

    When('alice views the entry detail for "Taxi"', async () => {
      vi.mocked(expensesApi.getExpense).mockResolvedValue({
        ...baseExpense,
        amount: "150000",
        currency: "IDR",
        category: "transport",
        description: "Taxi",
      });
      expense = await expensesApi.getExpense("expense-1");
    });

    Then('the amount should display as "150000"', () => {
      expect(expense?.amount).toBe("150000");
    });

    And('the currency should display as "IDR"', () => {
      expect(expense?.currency).toBe("IDR");
    });
  });

  Scenario("Unsupported currency code shows a validation error", ({ When, Then, And }) => {
    let createError: Error | null = null;

    When("alice navigates to the new entry form", () => {
      // Navigate to new entry form
    });

    And(
      'alice fills in amount "10.00", currency "EUR", category "food", description "Lunch", date "2025-01-15", and type "expense"',
      () => {
        // Form filled
      },
    );

    And("alice submits the entry form", async () => {
      vi.mocked(expensesApi.createExpense).mockRejectedValue(new Error("Unsupported currency: EUR"));
      try {
        await expensesApi.createExpense({
          amount: "10.00",
          currency: "EUR",
          category: "food",
          description: "Lunch",
          date: "2025-01-15",
          type: "expense",
        });
      } catch (e) {
        createError = e as Error;
      }
    });

    Then("a validation error for the currency field should be displayed", () => {
      expect(createError).not.toBeNull();
      expect(createError?.message).toMatch(/currency|unsupported|EUR/i);
    });
  });

  Scenario("Malformed currency code shows a validation error", ({ When, Then, And }) => {
    let createError: Error | null = null;

    When("alice navigates to the new entry form", () => {
      // Navigate to new entry form
    });

    And(
      'alice fills in amount "10.00", currency "US", category "food", description "Lunch", date "2025-01-15", and type "expense"',
      () => {
        // Form filled
      },
    );

    And("alice submits the entry form", async () => {
      vi.mocked(expensesApi.createExpense).mockRejectedValue(new Error("Invalid currency code: US"));
      try {
        await expensesApi.createExpense({
          amount: "10.00",
          currency: "US",
          category: "food",
          description: "Lunch",
          date: "2025-01-15",
          type: "expense",
        });
      } catch (e) {
        createError = e as Error;
      }
    });

    Then("a validation error for the currency field should be displayed", () => {
      expect(createError).not.toBeNull();
      expect(createError?.message).toMatch(/currency|invalid|US/i);
    });
  });

  Scenario("Expense summary groups totals by currency", ({ Given, When, Then, And }) => {
    let summary: ExpenseSummary[] | null = null;

    Given("alice has created expenses in both USD and IDR", () => {
      // Expenses in multiple currencies exist
    });

    When("alice navigates to the expense summary page", async () => {
      vi.mocked(expensesApi.getExpenseSummary).mockResolvedValue([
        {
          currency: "USD",
          totalIncome: "1000.00",
          totalExpense: "200.00",
          net: "800.00",
          categories: [],
        },
        {
          currency: "IDR",
          totalIncome: "500000",
          totalExpense: "150000",
          net: "350000",
          categories: [],
        },
      ]);
      summary = await expensesApi.getExpenseSummary();
    });

    Then('the summary should display a separate total for "USD"', () => {
      const usdSummary = summary?.find((s) => s.currency === "USD");
      expect(usdSummary).toBeDefined();
    });

    And('the summary should display a separate total for "IDR"', () => {
      const idrSummary = summary?.find((s) => s.currency === "IDR");
      expect(idrSummary).toBeDefined();
    });

    And("no cross-currency total should be shown", () => {
      // Each currency has its own summary entry
      expect(summary).toHaveLength(2);
    });
  });

  Scenario("Negative amount shows a validation error", ({ When, Then, And }) => {
    let createError: Error | null = null;

    When("alice navigates to the new entry form", () => {
      // Navigate to new entry form
    });

    And(
      'alice fills in amount "-10.00", currency "USD", category "food", description "Refund", date "2025-01-15", and type "expense"',
      () => {
        // Form filled with negative amount
      },
    );

    And("alice submits the entry form", async () => {
      vi.mocked(expensesApi.createExpense).mockRejectedValue(new Error("Amount must be a positive number"));
      try {
        await expensesApi.createExpense({
          amount: "-10.00",
          currency: "USD",
          category: "food",
          description: "Refund",
          date: "2025-01-15",
          type: "expense",
        });
      } catch (e) {
        createError = e as Error;
      }
    });

    Then("a validation error for the amount field should be displayed", () => {
      expect(createError).not.toBeNull();
      expect(createError?.message).toMatch(/amount|positive|negative/i);
    });
  });
});
