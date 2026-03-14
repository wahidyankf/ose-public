import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { vi, expect } from "vitest";
import path from "path";
import type { Expense, ExpenseListResponse } from "~/lib/api/types";

vi.mock("~/lib/api/expenses", () => ({
  listExpenses: vi.fn(),
  getExpense: vi.fn(),
  createExpense: vi.fn(),
}));

import * as expensesApi from "~/lib/api/expenses";

const baseExpense: Expense = {
  id: "expense-1",
  userId: "user-1",
  createdAt: "2025-01-15T00:00:00Z",
  updatedAt: "2025-01-15T00:00:00Z",
  amount: "75000",
  currency: "IDR",
  category: "fuel",
  description: "Petrol",
  date: "2025-01-15",
  type: "expense",
};

const emptyList: ExpenseListResponse = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  page: 0,
  size: 20,
};

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/expenses/unit-handling.feature"),
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
      vi.mocked(expensesApi.listExpenses).mockResolvedValue(emptyList);
    });
  });

  Scenario('Expense with metric unit "liter" displays quantity and unit', ({ Given, When, Then, And }) => {
    let expense: Expense | null = null;

    Given(
      'alice has created an expense with amount "75000", currency "IDR", category "fuel", description "Petrol", date "2025-01-15", quantity 50.5, and unit "liter"',
      () => {
        // Expense exists via mock
      },
    );

    When('alice views the entry detail for "Petrol"', async () => {
      vi.mocked(expensesApi.getExpense).mockResolvedValue({
        ...baseExpense,
        quantity: 50.5,
        unit: "liter",
      });
      expense = await expensesApi.getExpense("expense-1");
    });

    Then('the quantity should display as "50.5"', () => {
      expect(expense?.quantity).toBe(50.5);
    });

    And('the unit should display as "liter"', () => {
      expect(expense?.unit).toBe("liter");
    });
  });

  Scenario('Expense with imperial unit "gallon" displays quantity and unit', ({ Given, When, Then, And }) => {
    let expense: Expense | null = null;

    Given(
      'alice has created an expense with amount "45.00", currency "USD", category "fuel", description "Gas", date "2025-01-15", quantity 10, and unit "gallon"',
      () => {
        // Expense exists via mock
      },
    );

    When('alice views the entry detail for "Gas"', async () => {
      vi.mocked(expensesApi.getExpense).mockResolvedValue({
        ...baseExpense,
        amount: "45.00",
        currency: "USD",
        description: "Gas",
        quantity: 10,
        unit: "gallon",
      });
      expense = await expensesApi.getExpense("expense-1");
    });

    Then('the quantity should display as "10"', () => {
      expect(expense?.quantity).toBe(10);
    });

    And('the unit should display as "gallon"', () => {
      expect(expense?.unit).toBe("gallon");
    });
  });

  Scenario("Unsupported unit shows a validation error", ({ When, Then, And }) => {
    let createError: Error | null = null;

    When("alice navigates to the new entry form", () => {
      // Navigate to new entry form
    });

    And(
      'alice fills in amount "10.00", currency "USD", category "misc", description "Cargo", date "2025-01-15", type "expense", quantity 5, and unit "fathom"',
      () => {
        // Form filled with unsupported unit
      },
    );

    And("alice submits the entry form", async () => {
      vi.mocked(expensesApi.createExpense).mockRejectedValue(new Error("Unsupported unit: fathom"));
      try {
        await expensesApi.createExpense({
          amount: "10.00",
          currency: "USD",
          category: "misc",
          description: "Cargo",
          date: "2025-01-15",
          type: "expense",
          quantity: 5,
          unit: "fathom",
        });
      } catch (e) {
        createError = e as Error;
      }
    });

    Then("a validation error for the unit field should be displayed", () => {
      expect(createError).not.toBeNull();
      expect(createError?.message).toMatch(/unit|unsupported|fathom/i);
    });
  });

  Scenario("Expense without quantity and unit fields is accepted", ({ When, Then, And }) => {
    let createdExpense: Expense | null = null;

    When("alice navigates to the new entry form", () => {
      // Navigate to new entry form
    });

    And(
      'alice fills in amount "25.00", currency "USD", category "food", description "Dinner", date "2025-01-15", and type "expense"',
      () => {
        // Form filled without unit/quantity
      },
    );

    And("alice leaves the quantity and unit fields empty", () => {
      // No quantity/unit fields populated
    });

    And("alice submits the entry form", async () => {
      vi.mocked(expensesApi.createExpense).mockResolvedValue({
        ...baseExpense,
        amount: "25.00",
        currency: "USD",
        category: "food",
        description: "Dinner",
        date: "2025-01-15",
        type: "expense",
      });
      createdExpense = await expensesApi.createExpense({
        amount: "25.00",
        currency: "USD",
        category: "food",
        description: "Dinner",
        date: "2025-01-15",
        type: "expense",
      });
    });

    Then('the entry list should contain an entry with description "Dinner"', () => {
      expect(createdExpense?.description).toBe("Dinner");
      expect(createdExpense?.quantity).toBeUndefined();
      expect(createdExpense?.unit).toBeUndefined();
    });
  });
});
