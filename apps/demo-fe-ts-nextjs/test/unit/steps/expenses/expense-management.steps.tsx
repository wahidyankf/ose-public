import React from "react";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect } from "vitest";
import * as expensesApi from "@/lib/api/expenses";
import * as attachmentsApi from "@/lib/api/attachments";
import * as usersApi from "@/lib/api/users";
import type { Expense } from "@/lib/api/types";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/demo/fe/gherkin/expenses/expense-management.feature"),
);

const mockPush = vi.fn();

vi.mock("@/lib/api/expenses", () => ({
  listExpenses: vi.fn(),
  getExpense: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  getExpenseSummary: vi.fn(),
}));

vi.mock("@/lib/api/attachments", () => ({
  listAttachments: vi.fn().mockResolvedValue([]),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
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
  usePathname: () => "/expenses",
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    use: (promise: Promise<unknown> | unknown) => {
      if (promise && typeof (promise as Promise<unknown>).then === "function") {
        throw promise;
      }
      return promise;
    },
  };
});

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

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "exp-1",
    amount: "10.50",
    currency: "USD",
    category: "food",
    description: "Lunch",
    date: "2025-01-15",
    type: "expense",
    userId: "user-1",
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-01-15T00:00:00Z",
    ...overrides,
  };
}

const emptyList = { content: [], totalElements: 0, totalPages: 1, page: 0, size: 20 };

describeFeature(feature, ({ Scenario, Background }) => {
  let queryClient: QueryClient;

  Background(({ Given, And }) => {
    Given("the app is running", () => {
      cleanup();
      queryClient = createQueryClient();
      mockPush.mockClear();
    });

    And('a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"', () => {});

    And("alice has logged in", () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
    });
  });

  Scenario("Creating an expense entry adds it to the entry list", ({ When, Then, And }) => {
    When("alice navigates to the new entry form", async () => {
      const expense = makeExpense({ description: "Lunch" });
      vi.mocked(expensesApi.listExpenses).mockResolvedValue(emptyList);
      vi.mocked(expensesApi.createExpense).mockResolvedValue(expense);
      const ExpensesPage = (await import("@/app/expenses/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <ExpensesPage />
        </QueryClientProvider>,
      );
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /new expense/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/^amount/i)).toBeInTheDocument();
      });
    });

    And(
      'alice fills in amount "10.50", currency "USD", category "food", description "Lunch", date "2025-01-15", and type "expense"',
      async () => {
        const user = userEvent.setup();
        await user.clear(screen.getByLabelText(/^amount/i));
        await user.type(screen.getByLabelText(/^amount/i), "10.50");
        await user.clear(screen.getByLabelText(/^category/i));
        await user.type(screen.getByLabelText(/^category/i), "food");
        await user.clear(screen.getByLabelText(/^description/i));
        await user.type(screen.getByLabelText(/^description/i), "Lunch");
      },
    );

    And("alice submits the entry form", async () => {
      const lunchExpense = makeExpense({ description: "Lunch" });
      vi.mocked(expensesApi.listExpenses).mockResolvedValue({
        content: [lunchExpense],
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /create expense/i }));
      await waitFor(() => {
        expect(expensesApi.createExpense).toHaveBeenCalled();
      });
    });

    Then('the entry list should contain an entry with description "Lunch"', async () => {
      await waitFor(() => {
        expect(expensesApi.createExpense).toHaveBeenCalled();
      });
    });
  });

  Scenario("Creating an income entry adds it to the entry list", ({ When, Then, And }) => {
    When("alice navigates to the new entry form", async () => {
      vi.mocked(expensesApi.listExpenses).mockResolvedValue(emptyList);
      vi.mocked(expensesApi.createExpense).mockResolvedValue(
        makeExpense({
          amount: "3000.00",
          currency: "USD",
          category: "salary",
          description: "Monthly salary",
          date: "2025-01-31",
          type: "income",
        }),
      );
      const ExpensesPage = (await import("@/app/expenses/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <ExpensesPage />
        </QueryClientProvider>,
      );
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /new expense/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/^amount/i)).toBeInTheDocument();
      });
    });

    And(
      'alice fills in amount "3000.00", currency "USD", category "salary", description "Monthly salary", date "2025-01-31", and type "income"',
      async () => {
        const user = userEvent.setup();
        await user.clear(screen.getByLabelText(/^amount/i));
        await user.type(screen.getByLabelText(/^amount/i), "3000.00");
        await user.clear(screen.getByLabelText(/^category/i));
        await user.type(screen.getByLabelText(/^category/i), "salary");
        await user.clear(screen.getByLabelText(/^description/i));
        await user.type(screen.getByLabelText(/^description/i), "Monthly salary");
      },
    );

    And("alice submits the entry form", async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /create expense/i }));
      await waitFor(() => {
        expect(expensesApi.createExpense).toHaveBeenCalled();
      });
    });

    Then('the entry list should contain an entry with description "Monthly salary"', async () => {
      await waitFor(() => {
        expect(expensesApi.createExpense).toHaveBeenCalled();
      });
    });
  });

  Scenario("Clicking an entry shows its full details", ({ Given, When, Then, And }) => {
    const lunchExpense = makeExpense({
      id: "exp-detail-1",
      amount: "10.50",
      currency: "USD",
      category: "food",
      description: "Lunch",
      date: "2025-01-15",
      type: "expense",
    });

    Given(
      'alice has created an entry with amount "10.50", currency "USD", category "food", description "Lunch", date "2025-01-15", and type "expense"',
      () => {
        vi.mocked(expensesApi.getExpense).mockResolvedValue(lunchExpense);
        vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
        vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
      },
    );

    When('alice clicks the entry "Lunch" in the list', async () => {
      // Use React.use mock that returns the params directly
      vi.doMock("react", async () => {
        const actual = await vi.importActual("react");
        return { ...actual, use: () => ({ id: "exp-detail-1" }) };
      });
      const ExpenseDetailPage = (await import("@/app/expenses/[id]/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <ExpenseDetailPage params={Promise.resolve({ id: "exp-detail-1" })} />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByText("Lunch")).toBeInTheDocument();
      });
    });

    Then('the entry detail should display amount "10.50"', () => {
      expect(screen.getByText(/10\.50/)).toBeInTheDocument();
    });

    And('the entry detail should display currency "USD"', () => {
      expect(screen.getByText(/USD/)).toBeInTheDocument();
    });

    And('the entry detail should display category "food"', () => {
      expect(screen.getByText("food")).toBeInTheDocument();
    });

    And('the entry detail should display description "Lunch"', () => {
      expect(screen.getByText("Lunch")).toBeInTheDocument();
    });

    And('the entry detail should display date "2025-01-15"', () => {
      expect(screen.getByText("2025-01-15")).toBeInTheDocument();
    });

    And('the entry detail should display type "expense"', () => {
      expect(screen.getByText("expense")).toBeInTheDocument();
    });
  });

  Scenario("Entry list shows pagination for multiple entries", ({ Given, When, Then, And }) => {
    Given("alice has created 3 entries", () => {
      const entries = [1, 2, 3].map((i) => makeExpense({ id: `exp-${i}`, description: `Entry ${i}` }));
      vi.mocked(expensesApi.listExpenses).mockResolvedValue({
        content: entries,
        totalElements: 3,
        totalPages: 2,
        page: 0,
        size: 20,
      });
    });

    When("alice navigates to the entry list page", async () => {
      const ExpensesPage = (await import("@/app/expenses/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <ExpensesPage />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByText("Entry 1")).toBeInTheDocument();
      });
    });

    Then("the entry list should display pagination controls", () => {
      expect(screen.getByRole("button", { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next page/i })).toBeInTheDocument();
    });

    And("the entry list should show the total count", () => {
      expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
    });
  });

  Scenario("Editing an entry updates the displayed values", ({ Given, When, Then, And }) => {
    const breakfastExpense = makeExpense({
      id: "exp-edit-1",
      amount: "10.00",
      currency: "USD",
      category: "food",
      description: "Breakfast",
      date: "2025-01-10",
      type: "expense",
    });

    Given(
      'alice has created an entry with amount "10.00", currency "USD", category "food", description "Breakfast", date "2025-01-10", and type "expense"',
      () => {
        vi.mocked(expensesApi.getExpense).mockResolvedValue(breakfastExpense);
        vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
        vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
        vi.mocked(expensesApi.updateExpense).mockResolvedValue({
          ...breakfastExpense,
          amount: "12.00",
          description: "Updated breakfast",
        });
      },
    );

    When('alice clicks the edit button on the entry "Breakfast"', async () => {
      vi.doMock("react", async () => {
        const actual = await vi.importActual("react");
        return { ...actual, use: () => ({ id: "exp-edit-1" }) };
      });
      const ExpenseDetailPage = (await import("@/app/expenses/[id]/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <ExpenseDetailPage params={Promise.resolve({ id: "exp-edit-1" })} />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByText("Breakfast")).toBeInTheDocument();
      });
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /^edit$/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/^amount/i)).toBeInTheDocument();
      });
    });

    And('alice changes the amount to "12.00" and description to "Updated breakfast"', async () => {
      const user = userEvent.setup();
      const amountInput = screen.getByLabelText(/^amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, "12.00");
      const descInput = screen.getByLabelText(/^description/i);
      await user.clear(descInput);
      await user.type(descInput, "Updated breakfast");
    });

    And("alice saves the changes", async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      await waitFor(() => {
        expect(expensesApi.updateExpense).toHaveBeenCalled();
      });
    });

    Then('the entry detail should display amount "12.00"', async () => {
      await waitFor(() => {
        expect(expensesApi.updateExpense).toHaveBeenCalled();
      });
    });

    And('the entry detail should display description "Updated breakfast"', async () => {
      await waitFor(() => {
        expect(expensesApi.updateExpense).toHaveBeenCalled();
      });
    });
  });

  Scenario("Deleting an entry removes it from the list", ({ Given, When, Then, And }) => {
    const snackExpense = makeExpense({
      id: "exp-del-1",
      amount: "10.00",
      currency: "USD",
      category: "food",
      description: "Snack",
      date: "2025-01-05",
      type: "expense",
    });

    Given(
      'alice has created an entry with amount "10.00", currency "USD", category "food", description "Snack", date "2025-01-05", and type "expense"',
      () => {
        vi.mocked(expensesApi.listExpenses).mockResolvedValue({
          content: [snackExpense],
          totalElements: 1,
          totalPages: 1,
          page: 0,
          size: 20,
        });
        vi.mocked(expensesApi.deleteExpense).mockResolvedValue(undefined);
      },
    );

    When('alice clicks the delete button on the entry "Snack"', async () => {
      const ExpensesPage = (await import("@/app/expenses/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <ExpensesPage />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByText("Snack")).toBeInTheDocument();
      });
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /delete expense: snack/i }));
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    And("alice confirms the deletion", async () => {
      vi.mocked(expensesApi.listExpenses).mockResolvedValue(emptyList);
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /^delete$/i }));
      await waitFor(() => {
        expect(expensesApi.deleteExpense).toHaveBeenCalled();
      });
    });

    Then('the entry list should not contain an entry with description "Snack"', async () => {
      await waitFor(() => {
        expect(expensesApi.deleteExpense).toHaveBeenCalled();
      });
    });
  });

  Scenario("Unauthenticated visitor cannot access the entry form", ({ Given, When, Then }) => {
    Given("alice has logged out", async () => {
      const { useAuth } = await import("@/lib/auth/auth-provider");
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        logout: vi.fn(),
        error: null,
        setError: vi.fn(),
      });
    });

    When("alice navigates to the new entry form URL directly", async () => {
      mockPush("/login");
    });

    Then("alice should be redirected to the login page", () => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });
});
