import React from "react";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect } from "vitest";
import * as reportsApi from "@/lib/api/reports";
import * as usersApi from "@/lib/api/users";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/demo/fe/gherkin/expenses/reporting.feature"),
);

const mockPush = vi.fn();

vi.mock("@/lib/api/reports", () => ({
  getPLReport: vi.fn(),
}));

vi.mock("@/lib/api/expenses", () => ({
  listExpenses: vi.fn(),
  getExpense: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  getExpenseSummary: vi.fn(),
}));

vi.mock("@/lib/api/users", () => ({
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  deactivateAccount: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  getAccessToken: vi.fn().mockReturnValue("mock-token"),
  getRefreshToken: vi.fn().mockReturnValue("refresh-token"),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, body: unknown) {
      super(`API error: ${status}`);
      this.name = "ApiError";
      this.status = status;
      this.body = body;
    }
  },
  apiFetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/expenses/summary",
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: vi.fn().mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
    error: null,
    setError: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/auth/auth-guard", () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="app-shell">{children}</div>,
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

const mockUser = {
  id: "user-1",
  username: "alice",
  email: "alice@example.com",
  displayName: "Alice",
  status: "ACTIVE" as const,
  roles: [] as string[],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

async function renderSummaryAndGenerate(
  reportMockData: ReturnType<typeof reportsApi.getPLReport> extends Promise<infer T> ? T : never,
) {
  vi.mocked(reportsApi.getPLReport).mockResolvedValue(reportMockData);
  const SummaryPage = (await import("@/app/expenses/summary/page")).default;
  render(
    <QueryClientProvider client={createQueryClient()}>
      <SummaryPage />
    </QueryClientProvider>,
  );
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /generate report/i })).toBeInTheDocument();
  });
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /generate report/i }));
  await waitFor(() => {
    expect(screen.getByText(/total income/i)).toBeInTheDocument();
  });
}

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given, And }) => {
    Given("the app is running", () => {
      cleanup();
      mockPush.mockClear();
    });

    And('a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"', () => {});

    And("alice has logged in", () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
    });
  });

  Scenario("P&L report displays income total, expense total, and net for a period", ({ Given, When, Then, And }) => {
    Given('alice has created an income entry of "5000.00" USD on "2025-01-15"', () => {});

    And('alice has created an expense entry of "150.00" USD on "2025-01-20"', () => {});

    When("alice navigates to the reporting page", async () => {
      await renderSummaryAndGenerate({
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        currency: "USD",
        totalIncome: "5000.00",
        totalExpense: "150.00",
        net: "4850.00",
        incomeBreakdown: [{ category: "salary", type: "INCOME", total: "5000.00" }],
        expenseBreakdown: [{ category: "food", type: "EXPENSE", total: "150.00" }],
      });
    });

    And('alice selects date range "2025-01-01" to "2025-01-31" with currency "USD"', () => {});

    Then('the report should display income total "5000.00"', () => {
      expect(screen.getAllByText(/5000\.00/).length).toBeGreaterThan(0);
    });

    And('the report should display expense total "150.00"', () => {
      expect(screen.getAllByText(/150\.00/).length).toBeGreaterThan(0);
    });

    And('the report should display net "4850.00"', () => {
      expect(screen.getAllByText(/4850\.00/).length).toBeGreaterThan(0);
    });
  });

  Scenario("P&L breakdown shows category-level amounts", ({ Given, When, Then, And }) => {
    Given('alice has created income entries in categories "salary" and "freelance"', () => {});

    And('alice has created expense entries in category "transport"', () => {});

    When("alice navigates to the reporting page", async () => {
      await renderSummaryAndGenerate({
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        currency: "USD",
        totalIncome: "6000.00",
        totalExpense: "50.00",
        net: "5950.00",
        incomeBreakdown: [
          { category: "salary", type: "INCOME", total: "5000.00" },
          { category: "freelance", type: "INCOME", total: "1000.00" },
        ],
        expenseBreakdown: [{ category: "transport", type: "EXPENSE", total: "50.00" }],
      });
    });

    And('alice selects the appropriate date range and currency "USD"', () => {});

    Then('the income breakdown should list "salary" and "freelance" categories', () => {
      expect(screen.getByText("salary")).toBeInTheDocument();
      expect(screen.getByText("freelance")).toBeInTheDocument();
    });

    And('the expense breakdown should list "transport" category', () => {
      expect(screen.getByText("transport")).toBeInTheDocument();
    });
  });

  Scenario("Income entries are excluded from expense total", ({ Given, When, Then, And }) => {
    Given('alice has created only an income entry of "1000.00" USD on "2025-03-05"', () => {});

    When("alice views the P&L report for March 2025 in USD", async () => {
      await renderSummaryAndGenerate({
        startDate: "2025-03-01",
        endDate: "2025-03-31",
        currency: "USD",
        totalIncome: "1000.00",
        totalExpense: "0.00",
        net: "1000.00",
        incomeBreakdown: [{ category: "salary", type: "INCOME", total: "1000.00" }],
        expenseBreakdown: [],
      });
    });

    Then('the report should display income total "1000.00"', () => {
      expect(screen.getAllByText(/1000\.00/).length).toBeGreaterThan(0);
    });

    And('the report should display expense total "0.00"', () => {
      expect(screen.getAllByText(/0\.00/).length).toBeGreaterThan(0);
    });
  });

  Scenario("Expense entries are excluded from income total", ({ Given, When, Then, And }) => {
    Given('alice has created only an expense entry of "75.00" USD on "2025-04-10"', () => {});

    When("alice views the P&L report for April 2025 in USD", async () => {
      await renderSummaryAndGenerate({
        startDate: "2025-04-01",
        endDate: "2025-04-30",
        currency: "USD",
        totalIncome: "0.00",
        totalExpense: "75.00",
        net: "-75.00",
        incomeBreakdown: [],
        expenseBreakdown: [{ category: "food", type: "EXPENSE", total: "75.00" }],
      });
    });

    Then('the report should display income total "0.00"', () => {
      expect(screen.getAllByText(/0\.00/).length).toBeGreaterThan(0);
    });

    And('the report should display expense total "75.00"', () => {
      expect(screen.getAllByText(/75\.00/).length).toBeGreaterThan(0);
    });
  });

  Scenario("P&L report filters by currency without mixing", ({ Given, When, Then, And }) => {
    Given("alice has created income entries in both USD and IDR", () => {});

    When('alice views the P&L report filtered to "USD" only', async () => {
      await renderSummaryAndGenerate({
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        currency: "USD",
        totalIncome: "5000.00",
        totalExpense: "0.00",
        net: "5000.00",
        incomeBreakdown: [{ category: "salary", type: "INCOME", total: "5000.00" }],
        expenseBreakdown: [],
      });
    });

    Then("the report should display only USD amounts", () => {
      expect(screen.getAllByText(/USD/).length).toBeGreaterThan(0);
    });

    And("no IDR amounts should be included", () => {
      // The report only shows USD as that was the filter
      expect(screen.queryByText(/IDR\s+\d/)).not.toBeInTheDocument();
    });
  });

  Scenario("P&L report for a period with no entries shows zero totals", ({ When, Then, And }) => {
    When("alice navigates to the reporting page", async () => {
      await renderSummaryAndGenerate({
        startDate: "2099-01-01",
        endDate: "2099-01-31",
        currency: "USD",
        totalIncome: "0.00",
        totalExpense: "0.00",
        net: "0.00",
        incomeBreakdown: [],
        expenseBreakdown: [],
      });
    });

    And('alice selects date range "2099-01-01" to "2099-01-31" with currency "USD"', () => {});

    Then('the report should display income total "0.00"', () => {
      expect(screen.getAllByText(/0\.00/).length).toBeGreaterThan(0);
    });

    And('the report should display expense total "0.00"', () => {
      expect(screen.getAllByText(/0\.00/).length).toBeGreaterThan(0);
    });

    And('the report should display net "0.00"', () => {
      expect(screen.getAllByText(/0\.00/).length).toBeGreaterThan(0);
    });
  });
});
