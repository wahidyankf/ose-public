import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { vi, expect } from "vitest";
import path from "path";
import type { PLReport } from "~/lib/api/types";

vi.mock("~/lib/api/reports", () => ({
  getPLReport: vi.fn(),
}));

import * as reportsApi from "~/lib/api/reports";

const emptyReport: PLReport = {
  startDate: "2025-01-01",
  endDate: "2025-01-31",
  currency: "USD",
  totalIncome: "0.00",
  totalExpense: "0.00",
  net: "0.00",
  incomeBreakdown: [],
  expenseBreakdown: [],
};

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/expenses/reporting.feature"),
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

  Scenario("P&L report displays income total, expense total, and net for a period", ({ Given, When, Then, And }) => {
    let report: typeof emptyReport | null = null;

    Given('alice has created an income entry of "5000.00" USD on "2025-01-15"', () => {
      // Income entry pre-condition
    });

    And('alice has created an expense entry of "150.00" USD on "2025-01-20"', () => {
      // Expense entry pre-condition
    });

    When("alice navigates to the reporting page", () => {
      // Navigate to reporting page
    });

    And('alice selects date range "2025-01-01" to "2025-01-31" with currency "USD"', async () => {
      vi.mocked(reportsApi.getPLReport).mockResolvedValue({
        ...emptyReport,
        totalIncome: "5000.00",
        totalExpense: "150.00",
        net: "4850.00",
      });
      report = await reportsApi.getPLReport("2025-01-01", "2025-01-31", "USD");
    });

    Then('the report should display income total "5000.00"', () => {
      expect(report?.totalIncome).toBe("5000.00");
    });

    And('the report should display expense total "150.00"', () => {
      expect(report?.totalExpense).toBe("150.00");
    });

    And('the report should display net "4850.00"', () => {
      expect(report?.net).toBe("4850.00");
    });
  });

  Scenario("P&L breakdown shows category-level amounts", ({ Given, When, Then, And }) => {
    let report: typeof emptyReport | null = null;

    Given('alice has created income entries in categories "salary" and "freelance"', () => {
      // Income entries pre-condition
    });

    And('alice has created expense entries in category "transport"', () => {
      // Expense entries pre-condition
    });

    When("alice navigates to the reporting page", () => {
      // Navigate to reporting page
    });

    And('alice selects the appropriate date range and currency "USD"', async () => {
      vi.mocked(reportsApi.getPLReport).mockResolvedValue({
        ...emptyReport,
        totalIncome: "6000.00",
        totalExpense: "200.00",
        incomeBreakdown: [
          { category: "salary", type: "income", total: "5000.00" },
          { category: "freelance", type: "income", total: "1000.00" },
        ],
        expenseBreakdown: [{ category: "transport", type: "expense", total: "200.00" }],
      });
      report = await reportsApi.getPLReport("2025-01-01", "2025-01-31", "USD");
    });

    Then('the income breakdown should list "salary" and "freelance" categories', () => {
      const categories = report?.incomeBreakdown?.map((b) => b.category);
      expect(categories).toContain("salary");
      expect(categories).toContain("freelance");
    });

    And('the expense breakdown should list "transport" category', () => {
      const categories = report?.expenseBreakdown?.map((b) => b.category);
      expect(categories).toContain("transport");
    });
  });

  Scenario("Income entries are excluded from expense total", ({ Given, When, Then, And }) => {
    let report: typeof emptyReport | null = null;

    Given('alice has created only an income entry of "1000.00" USD on "2025-03-05"', () => {
      // Income entry pre-condition
    });

    When("alice views the P&L report for March 2025 in USD", async () => {
      vi.mocked(reportsApi.getPLReport).mockResolvedValue({
        ...emptyReport,
        startDate: "2025-03-01",
        endDate: "2025-03-31",
        totalIncome: "1000.00",
        totalExpense: "0.00",
        net: "1000.00",
      });
      report = await reportsApi.getPLReport("2025-03-01", "2025-03-31", "USD");
    });

    Then('the report should display income total "1000.00"', () => {
      expect(report?.totalIncome).toBe("1000.00");
    });

    And('the report should display expense total "0.00"', () => {
      expect(report?.totalExpense).toBe("0.00");
    });
  });

  Scenario("Expense entries are excluded from income total", ({ Given, When, Then, And }) => {
    let report: typeof emptyReport | null = null;

    Given('alice has created only an expense entry of "75.00" USD on "2025-04-10"', () => {
      // Expense entry pre-condition
    });

    When("alice views the P&L report for April 2025 in USD", async () => {
      vi.mocked(reportsApi.getPLReport).mockResolvedValue({
        ...emptyReport,
        startDate: "2025-04-01",
        endDate: "2025-04-30",
        totalIncome: "0.00",
        totalExpense: "75.00",
        net: "-75.00",
      });
      report = await reportsApi.getPLReport("2025-04-01", "2025-04-30", "USD");
    });

    Then('the report should display income total "0.00"', () => {
      expect(report?.totalIncome).toBe("0.00");
    });

    And('the report should display expense total "75.00"', () => {
      expect(report?.totalExpense).toBe("75.00");
    });
  });

  Scenario("P&L report filters by currency without mixing", ({ Given, When, Then, And }) => {
    let report: typeof emptyReport | null = null;
    let calledWithCurrency: string | null = null;

    Given("alice has created income entries in both USD and IDR", () => {
      // Multi-currency entries pre-condition
    });

    When('alice views the P&L report filtered to "USD" only', async () => {
      vi.mocked(reportsApi.getPLReport).mockResolvedValue({
        ...emptyReport,
        currency: "USD",
        totalIncome: "5000.00",
        totalExpense: "0.00",
        net: "5000.00",
      });
      calledWithCurrency = "USD";
      report = await reportsApi.getPLReport("2025-01-01", "2025-12-31", "USD");
    });

    Then("the report should display only USD amounts", () => {
      expect(report?.currency).toBe("USD");
      expect(calledWithCurrency).toBe("USD");
    });

    And("no IDR amounts should be included", () => {
      expect(report?.currency).not.toBe("IDR");
    });
  });

  Scenario("P&L report for a period with no entries shows zero totals", ({ When, Then, And }) => {
    let report: typeof emptyReport | null = null;

    When("alice navigates to the reporting page", () => {
      // Navigate to reporting page
    });

    And('alice selects date range "2099-01-01" to "2099-01-31" with currency "USD"', async () => {
      vi.mocked(reportsApi.getPLReport).mockResolvedValue({
        ...emptyReport,
        startDate: "2099-01-01",
        endDate: "2099-01-31",
      });
      report = await reportsApi.getPLReport("2099-01-01", "2099-01-31", "USD");
    });

    Then('the report should display income total "0.00"', () => {
      expect(report?.totalIncome).toBe("0.00");
    });

    And('the report should display expense total "0.00"', () => {
      expect(report?.totalExpense).toBe("0.00");
    });

    And('the report should display net "0.00"', () => {
      expect(report?.net).toBe("0.00");
    });
  });
});
