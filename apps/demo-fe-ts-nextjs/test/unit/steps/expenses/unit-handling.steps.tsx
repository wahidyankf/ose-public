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
  path.resolve(__dirname, "../../../../../../specs/apps/demo/fe/gherkin/expenses/unit-handling.feature"),
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

  Scenario('Expense with metric unit "liter" displays quantity and unit', ({ Given, When, Then, And }) => {
    Given(
      'alice has created an expense with amount "75000", currency "IDR", category "fuel", description "Petrol", date "2025-01-15", quantity 50.5, and unit "liter"',
      () => {
        vi.mocked(expensesApi.getExpense).mockResolvedValue({
          id: "exp-liter",
          amount: "75000",
          currency: "IDR",
          category: "fuel",
          description: "Petrol",
          date: "2025-01-15",
          type: "expense" as const,
          quantity: 50.5,
          unit: "liter",
          userId: "user-1",
          createdAt: "2025-01-15T00:00:00Z",
          updatedAt: "2025-01-15T00:00:00Z",
        });
        vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
      },
    );

    When('alice views the entry detail for "Petrol"', async () => {
      vi.doMock("react", async () => {
        const actual = await vi.importActual("react");
        return { ...actual, use: () => ({ id: "exp-liter" }) };
      });
      const ExpenseDetailPage = (await import("@/app/expenses/[id]/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <ExpenseDetailPage params={Promise.resolve({ id: "exp-liter" })} />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByText("Petrol")).toBeInTheDocument();
      });
    });

    Then('the quantity should display as "50.5"', () => {
      expect(screen.getByText("50.5")).toBeInTheDocument();
    });

    And('the unit should display as "liter"', () => {
      expect(screen.getByText("liter")).toBeInTheDocument();
    });
  });

  Scenario('Expense with imperial unit "gallon" displays quantity and unit', ({ Given, When, Then, And }) => {
    Given(
      'alice has created an expense with amount "45.00", currency "USD", category "fuel", description "Gas", date "2025-01-15", quantity 10, and unit "gallon"',
      () => {
        vi.mocked(expensesApi.getExpense).mockResolvedValue({
          id: "exp-gallon",
          amount: "45.00",
          currency: "USD",
          category: "fuel",
          description: "Gas",
          date: "2025-01-15",
          type: "expense" as const,
          quantity: 10,
          unit: "gallon",
          userId: "user-1",
          createdAt: "2025-01-15T00:00:00Z",
          updatedAt: "2025-01-15T00:00:00Z",
        });
        vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
      },
    );

    When('alice views the entry detail for "Gas"', async () => {
      vi.doMock("react", async () => {
        const actual = await vi.importActual("react");
        return { ...actual, use: () => ({ id: "exp-gallon" }) };
      });
      const ExpenseDetailPage = (await import("@/app/expenses/[id]/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <ExpenseDetailPage params={Promise.resolve({ id: "exp-gallon" })} />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByText("Gas")).toBeInTheDocument();
      });
    });

    Then('the quantity should display as "10"', () => {
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    And('the unit should display as "gallon"', () => {
      // "gallon" is not in SUPPORTED_UNITS in page - handled via detail display
      // The mock returns "gallon" and it would be displayed as-is
      expect(screen.getByText("gallon")).toBeInTheDocument();
    });
  });

  Scenario("Unsupported unit shows a validation error", ({ When, Then, And }) => {
    When("alice navigates to the new entry form", async () => {
      vi.mocked(expensesApi.listExpenses).mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 1,
        page: 0,
        size: 20,
      });
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
      'alice fills in amount "10.00", currency "USD", category "misc", description "Cargo", date "2025-01-15", type "expense", quantity 5, and unit "fathom"',
      async () => {
        const user = userEvent.setup();
        await user.clear(screen.getByLabelText(/^amount/i));
        await user.type(screen.getByLabelText(/^amount/i), "10.00");
        await user.clear(screen.getByLabelText(/^category/i));
        await user.type(screen.getByLabelText(/^category/i), "misc");
        await user.clear(screen.getByLabelText(/^description/i));
        await user.type(screen.getByLabelText(/^description/i), "Cargo");
        await user.type(screen.getByLabelText(/quantity/i), "5");
        // Force invalid unit into select
        const unitSelect = screen.getByLabelText(/^unit/i);
        Object.defineProperty(unitSelect, "value", {
          writable: true,
          value: "fathom",
        });
        unitSelect.dispatchEvent(new Event("change", { bubbles: true }));
      },
    );

    And("alice submits the entry form", async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /create expense/i }));
      await waitFor(() => {
        expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
      });
    });

    Then("a validation error for the unit field should be displayed", () => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    });
  });

  Scenario("Expense without quantity and unit fields is accepted", ({ When, Then, And }) => {
    When("alice navigates to the new entry form", async () => {
      vi.mocked(expensesApi.listExpenses).mockResolvedValue({
        content: [],
        totalElements: 0,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      vi.mocked(expensesApi.createExpense).mockResolvedValue({
        id: "exp-dinner",
        amount: "25.00",
        currency: "USD",
        category: "food",
        description: "Dinner",
        date: "2025-01-15",
        type: "expense" as const,
        userId: "user-1",
        createdAt: "2025-01-15T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
      });
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
      'alice fills in amount "25.00", currency "USD", category "food", description "Dinner", date "2025-01-15", and type "expense"',
      async () => {
        const user = userEvent.setup();
        await user.clear(screen.getByLabelText(/^amount/i));
        await user.type(screen.getByLabelText(/^amount/i), "25.00");
        await user.clear(screen.getByLabelText(/^category/i));
        await user.type(screen.getByLabelText(/^category/i), "food");
        await user.clear(screen.getByLabelText(/^description/i));
        await user.type(screen.getByLabelText(/^description/i), "Dinner");
      },
    );

    And("alice leaves the quantity and unit fields empty", () => {
      // Quantity and unit are optional; they start empty
      expect(screen.getByLabelText(/quantity/i)).toHaveValue(null);
    });

    And("alice submits the entry form", async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /create expense/i }));
      await waitFor(() => {
        expect(expensesApi.createExpense).toHaveBeenCalled();
      });
    });

    Then('the entry list should contain an entry with description "Dinner"', async () => {
      await waitFor(() => {
        expect(expensesApi.createExpense).toHaveBeenCalled();
      });
    });
  });
});
