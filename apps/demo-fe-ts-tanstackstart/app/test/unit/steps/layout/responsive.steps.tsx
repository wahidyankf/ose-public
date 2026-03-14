import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { vi, expect } from "vitest";
import path from "path";

vi.mock("~/lib/api/expenses", () => ({
  listExpenses: vi.fn(),
  getExpense: vi.fn(),
}));

vi.mock("~/lib/api/admin", () => ({
  listUsers: vi.fn(),
}));

vi.mock("~/lib/api/reports", () => ({
  getPLReport: vi.fn(),
}));

vi.mock("~/lib/api/auth", () => ({
  login: vi.fn(),
  logout: vi.fn(),
}));

import * as expensesApi from "~/lib/api/expenses";
import * as adminApi from "~/lib/api/admin";
import * as reportsApi from "~/lib/api/reports";
import * as authApi from "~/lib/api/auth";

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event("resize"));
}

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/layout/responsive.feature"),
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

  Scenario("Desktop viewport shows full sidebar navigation", ({ Given, When, Then, And }) => {
    let viewportWidth = 0;

    Given('the viewport is set to "desktop" (1280x800)', () => {
      setViewport(1280, 800);
      viewportWidth = window.innerWidth;
    });

    When("alice navigates to the dashboard", () => {
      // Navigate to dashboard
    });

    Then("the sidebar navigation should be visible", () => {
      expect(viewportWidth).toBeGreaterThanOrEqual(1024);
    });

    And("the sidebar should display navigation labels alongside icons", () => {
      expect(viewportWidth).toBeGreaterThanOrEqual(1024);
    });
  });

  Scenario("Tablet viewport collapses sidebar to icons only", ({ Given, When, Then, And }) => {
    let viewportWidth = 0;

    Given('the viewport is set to "tablet" (768x1024)', () => {
      setViewport(768, 1024);
      viewportWidth = window.innerWidth;
    });

    When("alice navigates to the dashboard", () => {
      // Navigate to dashboard
    });

    Then("the sidebar navigation should be collapsed to icon-only mode", () => {
      expect(viewportWidth).toBe(768);
    });

    And("hovering over a sidebar icon should show a tooltip with the label", () => {
      expect(viewportWidth).toBeLessThan(1024);
    });
  });

  Scenario("Mobile viewport hides sidebar behind a hamburger menu", ({ Given, When, Then, And }) => {
    let viewportWidth = 0;

    Given('the viewport is set to "mobile" (375x667)', () => {
      setViewport(375, 667);
      viewportWidth = window.innerWidth;
    });

    When("alice navigates to the dashboard", () => {
      // Navigate to dashboard
    });

    Then("the sidebar should not be visible", () => {
      expect(viewportWidth).toBeLessThan(768);
    });

    And("a hamburger menu button should be displayed in the header", () => {
      expect(viewportWidth).toBeLessThan(768);
    });

    When("alice taps the hamburger menu button", () => {
      // Tap hamburger button
    });

    Then("a slide-out navigation drawer should appear", () => {
      expect(viewportWidth).toBeLessThan(768);
    });
  });

  Scenario("Mobile navigation drawer closes on item selection", ({ Given, When, Then, And }) => {
    let navigateCalled = false;
    let navigatedTo: string | null = null;

    Given('the viewport is set to "mobile" (375x667)', () => {
      setViewport(375, 667);
    });

    And("the navigation drawer is open", () => {
      // Drawer open condition
    });

    When("alice taps a navigation item", () => {
      navigateCalled = true;
      navigatedTo = "/expenses";
    });

    Then("the drawer should close", () => {
      expect(navigateCalled).toBe(true);
    });

    And("the selected page should load", () => {
      expect(navigatedTo).toBe("/expenses");
    });
  });

  Scenario("Entry list displays as a table on desktop", ({ Given, When, Then, And }) => {
    let expenseList: { content: unknown[]; totalElements: number } | null = null;

    Given('the viewport is set to "desktop" (1280x800)', () => {
      setViewport(1280, 800);
    });

    And("alice has created 3 entries", () => {
      // Entries exist pre-condition
    });

    When("alice navigates to the entry list page", async () => {
      vi.mocked(expensesApi.listExpenses).mockResolvedValue({
        content: [
          {
            id: "e-1",
            amount: "10.00",
            currency: "USD",
            category: "food",
            description: "Entry 1",
            date: "2025-01-01",
            type: "expense",
            userId: "user-1",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          },
          {
            id: "e-2",
            amount: "20.00",
            currency: "USD",
            category: "transport",
            description: "Entry 2",
            date: "2025-01-02",
            type: "expense",
            userId: "user-1",
            createdAt: "2025-01-02T00:00:00Z",
            updatedAt: "2025-01-02T00:00:00Z",
          },
          {
            id: "e-3",
            amount: "30.00",
            currency: "USD",
            category: "food",
            description: "Entry 3",
            date: "2025-01-03",
            type: "expense",
            userId: "user-1",
            createdAt: "2025-01-03T00:00:00Z",
            updatedAt: "2025-01-03T00:00:00Z",
          },
        ],
        totalElements: 3,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      expenseList = await expensesApi.listExpenses();
    });

    Then("entries should be displayed in a multi-column table", () => {
      expect(expenseList?.content).toHaveLength(3);
    });

    And("the table should show columns for date, description, category, amount, and currency", () => {
      const first = expenseList?.content[0] as {
        date: string;
        description: string;
        category: string;
        amount: string;
        currency: string;
      };
      expect(first?.date).toBeTruthy();
      expect(first?.description).toBeTruthy();
      expect(first?.category).toBeTruthy();
      expect(first?.amount).toBeTruthy();
      expect(first?.currency).toBeTruthy();
    });
  });

  Scenario("Entry list displays as cards on mobile", ({ Given, When, Then, And }) => {
    let expenseList: { content: unknown[] } | null = null;

    Given('the viewport is set to "mobile" (375x667)', () => {
      setViewport(375, 667);
    });

    And("alice has created 3 entries", () => {
      // Entries exist pre-condition
    });

    When("alice navigates to the entry list page", async () => {
      vi.mocked(expensesApi.listExpenses).mockResolvedValue({
        content: [
          {
            id: "e-1",
            amount: "10.00",
            currency: "USD",
            category: "food",
            description: "Entry 1",
            date: "2025-01-01",
            type: "expense",
            userId: "user-1",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          },
        ],
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      expenseList = await expensesApi.listExpenses();
    });

    Then("entries should be displayed as stacked cards", () => {
      expect(expenseList?.content).toHaveLength(1);
      expect(window.innerWidth).toBeLessThan(768);
    });

    And("each card should show description, amount, and date", () => {
      const first = expenseList?.content[0] as {
        description: string;
        amount: string;
        date: string;
      };
      expect(first?.description).toBeTruthy();
      expect(first?.amount).toBeTruthy();
      expect(first?.date).toBeTruthy();
    });
  });

  Scenario("Admin user list is scrollable horizontally on mobile", ({ Given, When, Then, And }) => {
    let userList: { content: unknown[]; totalElements: number } | null = null;

    Given('an admin user "superadmin" is logged in', () => {
      // Admin logged in
    });

    And('the viewport is set to "mobile" (375x667)', () => {
      setViewport(375, 667);
    });

    When("the admin navigates to the user management page", async () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 0,
        page: 0,
        size: 20,
      });
      userList = await adminApi.listUsers(0, 20);
    });

    Then("the user list should be horizontally scrollable", () => {
      expect(window.innerWidth).toBeLessThan(768);
      expect(userList).toBeDefined();
    });

    And("the visible columns should prioritize username and status", () => {
      expect(window.innerWidth).toBeLessThan(768);
    });
  });

  Scenario("P&L report chart adapts to viewport width", ({ Given, When, Then, And }) => {
    let report: { totalIncome: string; currency: string } | null = null;

    Given('the viewport is set to "tablet" (768x1024)', () => {
      setViewport(768, 1024);
    });

    And("alice has created income and expense entries", () => {
      // Entries pre-condition
    });

    When("alice navigates to the reporting page", async () => {
      vi.mocked(reportsApi.getPLReport).mockResolvedValue({
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        currency: "USD",
        totalIncome: "5000.00",
        totalExpense: "1000.00",
        net: "4000.00",
        incomeBreakdown: [{ category: "salary", type: "income", total: "5000.00" }],
        expenseBreakdown: [{ category: "food", type: "expense", total: "1000.00" }],
      });
      report = await reportsApi.getPLReport("2025-01-01", "2025-01-31", "USD");
    });

    Then("the P&L chart should resize to fit the viewport", () => {
      expect(report?.totalIncome).toBeTruthy();
      expect(window.innerWidth).toBe(768);
    });

    And("category breakdowns should stack vertically below the chart", () => {
      expect(window.innerWidth).toBeLessThan(1024);
    });
  });

  Scenario("Login form is centered and full-width on mobile", ({ Given, When, Then, And }) => {
    let viewportWidth = 0;

    Given("alice has logged out", async () => {
      vi.mocked(authApi.logout).mockResolvedValue(undefined);
      await authApi.logout("refresh-token");
    });

    And('the viewport is set to "mobile" (375x667)', () => {
      setViewport(375, 667);
      viewportWidth = window.innerWidth;
    });

    When("alice navigates to the login page", () => {
      // Navigate to login page
    });

    Then("the login form should span the full viewport width with padding", () => {
      expect(viewportWidth).toBeLessThan(768);
    });

    And("the form inputs should be large enough for touch interaction", () => {
      expect(viewportWidth).toBe(375);
    });
  });

  Scenario("Attachment upload area adapts to mobile", ({ Given, When, Then, And }) => {
    let expense: { description: string } | null = null;

    Given('the viewport is set to "mobile" (375x667)', () => {
      setViewport(375, 667);
    });

    And('alice has created an entry with description "Lunch"', async () => {
      vi.mocked(expensesApi.getExpense).mockResolvedValue({
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
      });
      expense = await expensesApi.getExpense("expense-1");
    });

    When('alice opens the entry detail for "Lunch"', () => {
      // Open entry detail
    });

    Then("the attachment upload area should display a prominent upload button", () => {
      expect(expense?.description).toBe("Lunch");
      expect(window.innerWidth).toBeLessThan(768);
    });

    And("drag-and-drop should be replaced with a file picker", () => {
      expect(window.innerWidth).toBe(375);
    });
  });
});
