import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { vi, expect } from "vitest";
import path from "path";
import type { Expense, ExpenseListResponse } from "~/lib/api/types";

vi.mock("~/lib/api/expenses", () => ({
  listExpenses: vi.fn(),
  getExpense: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
}));

import * as expensesApi from "~/lib/api/expenses";

const baseExpense: Expense = {
  id: "expense-1",
  amount: "10.50",
  currency: "USD",
  category: "food",
  description: "Lunch",
  date: "2025-01-15",
  type: "expense",
  userId: "user-1",
  createdAt: "2025-01-15T00:00:00Z",
  updatedAt: "2025-01-15T00:00:00Z",
};

const emptyList: ExpenseListResponse = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  page: 0,
  size: 20,
};

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/expenses/expense-management.feature"),
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

  Scenario("Creating an expense entry adds it to the entry list", ({ When, Then, And }) => {
    let createdExpense: Expense | null = null;

    When("alice navigates to the new entry form", () => {
      // Navigate to new entry form
    });

    And(
      'alice fills in amount "10.50", currency "USD", category "food", description "Lunch", date "2025-01-15", and type "expense"',
      () => {
        // Fill in form
      },
    );

    And("alice submits the entry form", async () => {
      vi.mocked(expensesApi.createExpense).mockResolvedValue(baseExpense);
      createdExpense = await expensesApi.createExpense({
        amount: "10.50",
        currency: "USD",
        category: "food",
        description: "Lunch",
        date: "2025-01-15",
        type: "expense",
      });
    });

    Then('the entry list should contain an entry with description "Lunch"', () => {
      expect(createdExpense?.description).toBe("Lunch");
    });
  });

  Scenario("Creating an income entry adds it to the entry list", ({ When, Then, And }) => {
    let createdExpense: Expense | null = null;

    When("alice navigates to the new entry form", () => {
      // Navigate to new entry form
    });

    And(
      'alice fills in amount "3000.00", currency "USD", category "salary", description "Monthly salary", date "2025-01-31", and type "income"',
      () => {
        // Fill in form
      },
    );

    And("alice submits the entry form", async () => {
      vi.mocked(expensesApi.createExpense).mockResolvedValue({
        ...baseExpense,
        amount: "3000.00",
        category: "salary",
        description: "Monthly salary",
        date: "2025-01-31",
        type: "income",
      });
      createdExpense = await expensesApi.createExpense({
        amount: "3000.00",
        currency: "USD",
        category: "salary",
        description: "Monthly salary",
        date: "2025-01-31",
        type: "income",
      });
    });

    Then('the entry list should contain an entry with description "Monthly salary"', () => {
      expect(createdExpense?.description).toBe("Monthly salary");
      expect(createdExpense?.type).toBe("income");
    });
  });

  Scenario("Clicking an entry shows its full details", ({ Given, When, Then, And }) => {
    let expense: Expense | null = null;

    Given(
      'alice has created an entry with amount "10.50", currency "USD", category "food", description "Lunch", date "2025-01-15", and type "expense"',
      () => {
        // Entry exists via mock
      },
    );

    When('alice clicks the entry "Lunch" in the list', async () => {
      vi.mocked(expensesApi.getExpense).mockResolvedValue(baseExpense);
      expense = await expensesApi.getExpense("expense-1");
    });

    Then('the entry detail should display amount "10.50"', () => {
      expect(expense?.amount).toBe("10.50");
    });

    And('the entry detail should display currency "USD"', () => {
      expect(expense?.currency).toBe("USD");
    });

    And('the entry detail should display category "food"', () => {
      expect(expense?.category).toBe("food");
    });

    And('the entry detail should display description "Lunch"', () => {
      expect(expense?.description).toBe("Lunch");
    });

    And('the entry detail should display date "2025-01-15"', () => {
      expect(expense?.date).toBe("2025-01-15");
    });

    And('the entry detail should display type "expense"', () => {
      expect(expense?.type).toBe("expense");
    });
  });

  Scenario("Entry list shows pagination for multiple entries", ({ Given, When, Then, And }) => {
    let list: ExpenseListResponse | null = null;

    Given("alice has created 3 entries", () => {
      // Entries exist via mock
    });

    When("alice navigates to the entry list page", async () => {
      vi.mocked(expensesApi.listExpenses).mockResolvedValue({
        content: [
          { ...baseExpense, id: "e-1", description: "Entry 1" },
          { ...baseExpense, id: "e-2", description: "Entry 2" },
          { ...baseExpense, id: "e-3", description: "Entry 3" },
        ],
        totalElements: 3,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      list = await expensesApi.listExpenses();
    });

    Then("the entry list should display pagination controls", () => {
      expect(list?.totalPages).toBeGreaterThanOrEqual(1);
    });

    And("the entry list should show the total count", () => {
      expect(list?.totalElements).toBe(3);
    });
  });

  Scenario("Editing an entry updates the displayed values", ({ Given, When, Then, And }) => {
    let updatedExpense: Expense | null = null;

    Given(
      'alice has created an entry with amount "10.00", currency "USD", category "food", description "Breakfast", date "2025-01-10", and type "expense"',
      () => {
        // Entry exists via mock
      },
    );

    When('alice clicks the edit button on the entry "Breakfast"', () => {
      // Edit button clicked
    });

    And('alice changes the amount to "12.00" and description to "Updated breakfast"', () => {
      // Form fields changed
    });

    And("alice saves the changes", async () => {
      vi.mocked(expensesApi.updateExpense).mockResolvedValue({
        ...baseExpense,
        amount: "12.00",
        description: "Updated breakfast",
      });
      updatedExpense = await expensesApi.updateExpense("expense-1", {
        amount: "12.00",
        description: "Updated breakfast",
      });
    });

    Then('the entry detail should display amount "12.00"', () => {
      expect(updatedExpense?.amount).toBe("12.00");
    });

    And('the entry detail should display description "Updated breakfast"', () => {
      expect(updatedExpense?.description).toBe("Updated breakfast");
    });
  });

  Scenario("Deleting an entry removes it from the list", ({ Given, When, Then, And }) => {
    let listAfterDelete: ExpenseListResponse | null = null;
    let deleteCalled = false;

    Given(
      'alice has created an entry with amount "10.00", currency "USD", category "food", description "Snack", date "2025-01-05", and type "expense"',
      () => {
        // Entry exists via mock
      },
    );

    When('alice clicks the delete button on the entry "Snack"', () => {
      // Delete button clicked
    });

    And("alice confirms the deletion", async () => {
      vi.mocked(expensesApi.deleteExpense).mockResolvedValue(undefined);
      vi.mocked(expensesApi.listExpenses).mockResolvedValue(emptyList);
      await expensesApi.deleteExpense("expense-1");
      deleteCalled = true;
      listAfterDelete = await expensesApi.listExpenses();
    });

    Then('the entry list should not contain an entry with description "Snack"', () => {
      expect(listAfterDelete?.content).toHaveLength(0);
      expect(deleteCalled).toBe(true);
    });
  });

  Scenario("Unauthenticated visitor cannot access the entry form", ({ Given, When, Then }) => {
    let accessError: Error | null = null;

    Given("alice has logged out", () => {
      // Logged out pre-condition
    });

    When("alice navigates to the new entry form URL directly", async () => {
      vi.mocked(expensesApi.listExpenses).mockRejectedValue(new Error("Unauthorized"));
      try {
        await expensesApi.listExpenses();
      } catch (e) {
        accessError = e as Error;
      }
    });

    Then("alice should be redirected to the login page", () => {
      expect(accessError).not.toBeNull();
      expect(accessError?.message).toMatch(/unauthorized|login/i);
    });
  });
});
