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

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/expenses/currency-handling.feature"),
);

const mockNavigate = vi.fn();
const mockUseParams = vi.fn().mockReturnValue({ id: "exp-1" });

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

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (_path: string) => (opts: { component: React.ComponentType }) => ({
    options: opts,
    component: opts.component,
    useSearch: vi.fn().mockReturnValue({}),
    useParams: mockUseParams,
  }),
  Link: ({
    children,
    to,
    style,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
    style?: React.CSSProperties;
    [key: string]: unknown;
  }) => (
    <a href={to} style={style} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
  useRouterState: () => ({ location: { pathname: "/expenses" } }),
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

const emptyList = { content: [], totalElements: 0, totalPages: 1, page: 0, size: 20 };

describeFeature(feature, ({ Scenario, Background }) => {
  let queryClient: QueryClient;

  Background(({ Given, And }) => {
    Given("the app is running", () => {
      cleanup();
      queryClient = createQueryClient();
      mockNavigate.mockClear();
    });

    And('a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"', () => {});

    And("alice has logged in", () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
    });
  });

  Scenario("USD expense displays two decimal places", ({ Given, When, Then, And }) => {
    Given(
      'alice has created an expense with amount "10.50", currency "USD", category "food", description "Coffee", and date "2025-01-15"',
      () => {
        vi.mocked(expensesApi.getExpense).mockResolvedValue({
          id: "exp-1",
          amount: "10.50",
          currency: "USD",
          category: "food",
          description: "Coffee",
          date: "2025-01-15",
          type: "expense" as const,
          userId: "user-1",
          createdAt: "2025-01-15T00:00:00Z",
          updatedAt: "2025-01-15T00:00:00Z",
        });
        vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
        mockUseParams.mockReturnValue({ id: "exp-1" });
      },
    );

    When('alice views the entry detail for "Coffee"', async () => {
      const { Route } = await import("@/routes/_auth/expenses/$id");
      const Component = (Route as { options: { component: React.ComponentType } }).options.component;
      render(
        <QueryClientProvider client={queryClient}>
          <Component />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByText("Coffee")).toBeInTheDocument();
      });
    });

    Then('the amount should display as "10.50"', () => {
      expect(screen.getByText(/10\.50/)).toBeInTheDocument();
    });

    And('the currency should display as "USD"', () => {
      expect(screen.getAllByText(/USD/).length).toBeGreaterThan(0);
    });
  });

  Scenario("IDR expense displays as a whole number", ({ Given, When, Then, And }) => {
    Given(
      'alice has created an expense with amount "150000", currency "IDR", category "transport", description "Taxi", and date "2025-01-15"',
      () => {
        vi.mocked(expensesApi.getExpense).mockResolvedValue({
          id: "exp-2",
          amount: "150000",
          currency: "IDR",
          category: "transport",
          description: "Taxi",
          date: "2025-01-15",
          type: "expense" as const,
          userId: "user-1",
          createdAt: "2025-01-15T00:00:00Z",
          updatedAt: "2025-01-15T00:00:00Z",
        });
        vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
        mockUseParams.mockReturnValue({ id: "exp-2" });
      },
    );

    When('alice views the entry detail for "Taxi"', async () => {
      const { Route } = await import("@/routes/_auth/expenses/$id");
      const Component = (Route as { options: { component: React.ComponentType } }).options.component;
      render(
        <QueryClientProvider client={queryClient}>
          <Component />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByText("Taxi")).toBeInTheDocument();
      });
    });

    Then('the amount should display as "150000"', () => {
      expect(screen.getByText(/150000/)).toBeInTheDocument();
    });

    And('the currency should display as "IDR"', () => {
      expect(screen.getAllByText(/IDR/).length).toBeGreaterThan(0);
    });
  });

  Scenario("Unsupported currency code shows a validation error", ({ When, Then, And }) => {
    When("alice navigates to the new entry form", async () => {
      vi.mocked(expensesApi.listExpenses).mockResolvedValue(emptyList);
      const { Route } = await import("@/routes/_auth/expenses/index");
      const Component = (Route as { options: { component: React.ComponentType } }).options.component;
      render(
        <QueryClientProvider client={queryClient}>
          <Component />
        </QueryClientProvider>,
      );
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /new expense/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/^amount/i)).toBeInTheDocument();
      });
    });

    And(
      'alice fills in amount "10.00", currency "EUR", category "food", description "Lunch", date "2025-01-15", and type "expense"',
      async () => {
        const user = userEvent.setup();
        await user.clear(screen.getByLabelText(/^amount/i));
        await user.type(screen.getByLabelText(/^amount/i), "10.00");
        await user.clear(screen.getByLabelText(/^category/i));
        await user.type(screen.getByLabelText(/^category/i), "food");
        await user.clear(screen.getByLabelText(/^description/i));
        await user.type(screen.getByLabelText(/^description/i), "Lunch");
        // EUR is not in the supported dropdown, we test that the form won't allow it
        // by directly manipulating state - EUR is not available in dropdown so use native
      },
    );

    And("alice submits the entry form", async () => {
      // The currency field is a select with only USD/IDR
      // Change via native JS to simulate unsupported value
      const currencySelect = screen.getByLabelText(/^currency/i);
      Object.defineProperty(currencySelect, "value", {
        writable: true,
        value: "EUR",
      });
      currencySelect.dispatchEvent(new Event("change", { bubbles: true }));

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /create expense/i }));
      await waitFor(() => {
        expect(screen.getByRole("alert", { hidden: false })).toBeInTheDocument();
      });
    });

    Then("a validation error for the currency field should be displayed", () => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    });
  });

  Scenario("Malformed currency code shows a validation error", ({ When, Then, And }) => {
    When("alice navigates to the new entry form", async () => {
      vi.mocked(expensesApi.listExpenses).mockResolvedValue(emptyList);
      const { Route } = await import("@/routes/_auth/expenses/index");
      const Component = (Route as { options: { component: React.ComponentType } }).options.component;
      render(
        <QueryClientProvider client={queryClient}>
          <Component />
        </QueryClientProvider>,
      );
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /new expense/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/^amount/i)).toBeInTheDocument();
      });
    });

    And(
      'alice fills in amount "10.00", currency "US", category "food", description "Lunch", date "2025-01-15", and type "expense"',
      async () => {
        const user = userEvent.setup();
        await user.clear(screen.getByLabelText(/^amount/i));
        await user.type(screen.getByLabelText(/^amount/i), "10.00");
        await user.clear(screen.getByLabelText(/^category/i));
        await user.type(screen.getByLabelText(/^category/i), "food");
        await user.clear(screen.getByLabelText(/^description/i));
        await user.type(screen.getByLabelText(/^description/i), "Lunch");
      },
    );

    And("alice submits the entry form", async () => {
      const currencySelect = screen.getByLabelText(/^currency/i);
      Object.defineProperty(currencySelect, "value", {
        writable: true,
        value: "US",
      });
      currencySelect.dispatchEvent(new Event("change", { bubbles: true }));

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /create expense/i }));
      await waitFor(() => {
        expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
      });
    });

    Then("a validation error for the currency field should be displayed", () => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    });
  });

  Scenario("Expense summary groups totals by currency", ({ Given, When, Then, And }) => {
    Given("alice has created expenses in both USD and IDR", () => {
      vi.mocked(expensesApi.getExpenseSummary).mockResolvedValue({
        USD: "50.00",
        IDR: "100000.00",
      } as unknown as Awaited<ReturnType<typeof expensesApi.getExpenseSummary>>);
    });

    When("alice navigates to the expense summary page", async () => {
      const { Route } = await import("@/routes/_auth/expenses/summary");
      const Component = (Route as { options: { component: React.ComponentType } }).options.component;
      render(
        <QueryClientProvider client={queryClient}>
          <Component />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /summary/i })).toBeInTheDocument();
      });
    });

    Then('the summary should display a separate total for "USD"', () => {
      expect(screen.getAllByText(/USD/).length).toBeGreaterThan(0);
    });

    And('the summary should display a separate total for "IDR"', () => {
      expect(screen.getAllByText(/IDR/).length).toBeGreaterThan(0);
    });

    And("no cross-currency total should be shown", () => {
      // The summary shows per-currency totals; no cross-currency mixing
      expect(screen.queryByText(/IDR.*USD/i)).not.toBeInTheDocument();
    });
  });

  Scenario("Negative amount shows a validation error", ({ When, Then, And }) => {
    When("alice navigates to the new entry form", async () => {
      vi.mocked(expensesApi.listExpenses).mockResolvedValue(emptyList);
      const { Route } = await import("@/routes/_auth/expenses/index");
      const Component = (Route as { options: { component: React.ComponentType } }).options.component;
      render(
        <QueryClientProvider client={queryClient}>
          <Component />
        </QueryClientProvider>,
      );
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /new expense/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/^amount/i)).toBeInTheDocument();
      });
    });

    And(
      'alice fills in amount "-10.00", currency "USD", category "food", description "Refund", date "2025-01-15", and type "expense"',
      async () => {
        const user = userEvent.setup();
        await user.clear(screen.getByLabelText(/^amount/i));
        await user.type(screen.getByLabelText(/^amount/i), "-10.00");
        await user.clear(screen.getByLabelText(/^category/i));
        await user.type(screen.getByLabelText(/^category/i), "food");
        await user.clear(screen.getByLabelText(/^description/i));
        await user.type(screen.getByLabelText(/^description/i), "Refund");
      },
    );

    And("alice submits the entry form", async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /create expense/i }));
      await waitFor(() => {
        expect(screen.getByText(/non-negative/i)).toBeInTheDocument();
      });
    });

    Then("a validation error for the amount field should be displayed", () => {
      expect(screen.getByText(/non-negative/i)).toBeInTheDocument();
    });
  });
});
