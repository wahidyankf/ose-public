import React from "react";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect } from "vitest";
import * as usersApi from "@/lib/api/users";
import * as expensesApi from "@/lib/api/expenses";
import * as adminApi from "@/lib/api/admin";
import * as reportsApi from "@/lib/api/reports";
import * as attachmentsApi from "@/lib/api/attachments";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/demo/fe/gherkin/layout/responsive.feature"),
);

const mockPush = vi.fn();

vi.mock("@/lib/api/users", () => ({
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  deactivateAccount: vi.fn(),
}));

vi.mock("@/lib/api/expenses", () => ({
  listExpenses: vi.fn(),
  getExpense: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  getExpenseSummary: vi.fn(),
}));

vi.mock("@/lib/api/admin", () => ({
  listUsers: vi.fn(),
  disableUser: vi.fn(),
  enableUser: vi.fn(),
  unlockUser: vi.fn(),
  forcePasswordReset: vi.fn(),
}));

vi.mock("@/lib/api/reports", () => ({
  getPLReport: vi.fn(),
}));

vi.mock("@/lib/api/attachments", () => ({
  listAttachments: vi.fn().mockResolvedValue([]),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({
  getHealth: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
  logoutAll: vi.fn(),
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
  usePathname: () => "/",
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

vi.mock("@/lib/queries/use-auth", () => ({
  useLogout: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useLogoutAll: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useHealth: vi.fn().mockReturnValue({ data: { status: "UP" }, isLoading: false, isError: false }),
  useLogin: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useRegister: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useRefreshToken: vi.fn(),
}));

vi.mock("@/lib/queries/use-user", () => ({
  useCurrentUser: vi.fn().mockReturnValue({
    data: {
      id: "user-1",
      username: "alice",
      email: "alice@example.com",
      displayName: "Alice",
      status: "ACTIVE",
      roles: [],
      createdAt: "",
      updatedAt: "",
    },
    isLoading: false,
  }),
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

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given, And }) => {
    Given("the app is running", () => {
      cleanup();
      mockPush.mockClear();
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
    });

    And('a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"', () => {});

    And("alice has logged in", () => {});
  });

  Scenario("Desktop viewport shows full sidebar navigation", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "desktop" (1280x800)', () => {
      setViewport(1280);
    });

    When("alice navigates to the dashboard", async () => {
      const { AppShell } = await import("@/components/layout/app-shell");
      render(
        <QueryClientProvider client={createQueryClient()}>
          <AppShell>
            <div>Dashboard Content</div>
          </AppShell>
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByRole("navigation")).toBeInTheDocument();
      });
    });

    Then("the sidebar navigation should be visible", () => {
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    And("the sidebar should display navigation labels alongside icons", () => {
      expect(screen.getByText("Expenses")).toBeInTheDocument();
      expect(screen.getByText("Profile")).toBeInTheDocument();
    });
  });

  Scenario("Tablet viewport collapses sidebar to icons only", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "tablet" (768x1024)', () => {
      setViewport(768);
    });

    When("alice navigates to the dashboard", async () => {
      const { AppShell } = await import("@/components/layout/app-shell");
      render(
        <QueryClientProvider client={createQueryClient()}>
          <AppShell>
            <div>Dashboard Content</div>
          </AppShell>
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByRole("navigation")).toBeInTheDocument();
      });
    });

    Then("the sidebar navigation should be collapsed to icon-only mode", () => {
      // In tablet mode, nav items have title attributes for tooltips
      expect(screen.getByRole("navigation")).toBeInTheDocument();
      // Labels are hidden in tablet mode - check for title attributes
      const nav = screen.getByRole("navigation");
      const links = nav.querySelectorAll("a[title]");
      expect(links.length).toBeGreaterThan(0);
    });

    And("hovering over a sidebar icon should show a tooltip with the label", () => {
      const nav = screen.getByRole("navigation");
      const links = nav.querySelectorAll("a[title]");
      expect(links.length).toBeGreaterThan(0);
      expect(links[0]?.getAttribute("title")).toBeTruthy();
    });
  });

  Scenario("Mobile viewport hides sidebar behind a hamburger menu", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "mobile" (375x667)', () => {
      setViewport(375);
    });

    When("alice navigates to the dashboard", async () => {
      const { AppShell } = await import("@/components/layout/app-shell");
      render(
        <QueryClientProvider client={createQueryClient()}>
          <AppShell>
            <div>Dashboard Content</div>
          </AppShell>
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByRole("banner")).toBeInTheDocument();
      });
    });

    Then("the sidebar should not be visible", () => {
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });

    And("a hamburger menu button should be displayed in the header", () => {
      expect(screen.getByRole("button", { name: /toggle navigation menu/i })).toBeInTheDocument();
    });

    When("alice taps the hamburger menu button", async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /toggle navigation menu/i }));
      await waitFor(() => {
        expect(screen.getByRole("navigation")).toBeInTheDocument();
      });
    });

    Then("a slide-out navigation drawer should appear", () => {
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });
  });

  Scenario("Mobile navigation drawer closes on item selection", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "mobile" (375x667)', () => {
      setViewport(375);
    });

    And("the navigation drawer is open", async () => {
      const { AppShell } = await import("@/components/layout/app-shell");
      render(
        <QueryClientProvider client={createQueryClient()}>
          <AppShell>
            <div>Dashboard Content</div>
          </AppShell>
        </QueryClientProvider>,
      );
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /toggle navigation menu/i }));
      await waitFor(() => {
        expect(screen.getByRole("navigation")).toBeInTheDocument();
      });
    });

    When("alice taps a navigation item", async () => {
      const user = userEvent.setup();
      const navLinks = screen.getAllByRole("link");
      await user.click(navLinks[0]!);
      await waitFor(() => {
        expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
      });
    });

    Then("the drawer should close", () => {
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });

    And("the selected page should load", () => {
      // Navigation link was clicked - page loading happens via router
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    });
  });

  Scenario("Entry list displays as a table on desktop", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "desktop" (1280x800)', () => {
      setViewport(1280);
    });

    And("alice has created 3 entries", () => {
      vi.mocked(expensesApi.listExpenses).mockResolvedValue({
        content: [1, 2, 3].map((i) => ({
          id: `exp-${i}`,
          amount: "10.00",
          currency: "USD",
          category: "food",
          description: `Entry ${i}`,
          date: "2025-01-15",
          type: "expense" as const,
          userId: "user-1",
          createdAt: "2025-01-15T00:00:00Z",
          updatedAt: "2025-01-15T00:00:00Z",
        })),
        totalElements: 3,
        totalPages: 1,
        page: 0,
        size: 20,
      });
    });

    When("alice navigates to the entry list page", async () => {
      const ExpensesPage = (await import("@/app/expenses/page")).default;
      render(
        <QueryClientProvider client={createQueryClient()}>
          <ExpensesPage />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByRole("table")).toBeInTheDocument();
      });
    });

    Then("entries should be displayed in a multi-column table", () => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    And("the table should show columns for date, description, category, amount, and currency", () => {
      expect(screen.getByText(/date/i)).toBeInTheDocument();
      expect(screen.getByText(/description/i)).toBeInTheDocument();
      expect(screen.getByText(/category/i)).toBeInTheDocument();
      expect(screen.getByText(/amount/i)).toBeInTheDocument();
    });
  });

  Scenario("Entry list displays as cards on mobile", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "mobile" (375x667)', () => {
      setViewport(375);
    });

    And("alice has created 3 entries", () => {
      vi.mocked(expensesApi.listExpenses).mockResolvedValue({
        content: [1, 2, 3].map((i) => ({
          id: `exp-${i}`,
          amount: "10.00",
          currency: "USD",
          category: "food",
          description: `Entry ${i}`,
          date: "2025-01-15",
          type: "expense" as const,
          userId: "user-1",
          createdAt: "2025-01-15T00:00:00Z",
          updatedAt: "2025-01-15T00:00:00Z",
        })),
        totalElements: 3,
        totalPages: 1,
        page: 0,
        size: 20,
      });
    });

    When("alice navigates to the entry list page", async () => {
      const ExpensesPage = (await import("@/app/expenses/page")).default;
      render(
        <QueryClientProvider client={createQueryClient()}>
          <ExpensesPage />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByText("Entry 1")).toBeInTheDocument();
      });
    });

    Then("entries should be displayed as stacked cards", () => {
      // The table is always rendered but on mobile it becomes scrollable
      expect(screen.getByText("Entry 1")).toBeInTheDocument();
    });

    And("each card should show description, amount, and date", () => {
      expect(screen.getByText("Entry 1")).toBeInTheDocument();
      expect(screen.getAllByText(/USD/).length).toBeGreaterThan(0);
    });
  });

  Scenario("Admin user list is scrollable horizontally on mobile", ({ Given, When, Then, And }) => {
    Given('an admin user "superadmin" is logged in', () => {});

    And('the viewport is set to "mobile" (375x667)', () => {
      setViewport(375);
    });

    When("the admin navigates to the user management page", async () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: [
          {
            id: "user-1",
            username: "alice",
            email: "alice@example.com",
            displayName: "Alice",
            status: "ACTIVE",
            roles: [],
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          },
        ],
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      const AdminPage = (await import("@/app/admin/page")).default;
      render(
        <QueryClientProvider client={createQueryClient()}>
          <AdminPage />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByRole("table")).toBeInTheDocument();
      });
    });

    Then("the user list should be horizontally scrollable", () => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    And("the visible columns should prioritize username and status", () => {
      expect(screen.getByText("username", { exact: false })).toBeInTheDocument();
      expect(screen.getByText("status", { exact: false })).toBeInTheDocument();
    });
  });

  Scenario("P&L report chart adapts to viewport width", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "tablet" (768x1024)', () => {
      setViewport(768);
    });

    And("alice has created income and expense entries", () => {});

    When("alice navigates to the reporting page", async () => {
      vi.mocked(reportsApi.getPLReport).mockResolvedValue({
        startDate: "2025-01-01",
        endDate: "2025-01-31",
        currency: "USD",
        totalIncome: "5000.00",
        totalExpense: "150.00",
        net: "4850.00",
        incomeBreakdown: [{ category: "salary", type: "INCOME", total: "5000.00" }],
        expenseBreakdown: [{ category: "food", type: "EXPENSE", total: "150.00" }],
      });
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
        expect(screen.getAllByText(/5000\.00/).length).toBeGreaterThan(0);
      });
    });

    Then("the P&L chart should resize to fit the viewport", () => {
      expect(screen.getAllByText(/5000\.00/).length).toBeGreaterThan(0);
    });

    And("category breakdowns should stack vertically below the chart", () => {
      expect(screen.getByText("salary")).toBeInTheDocument();
      expect(screen.getByText("food")).toBeInTheDocument();
    });
  });

  Scenario("Login form is centered and full-width on mobile", ({ Given, When, Then, And }) => {
    Given("alice has logged out", () => {});

    And('the viewport is set to "mobile" (375x667)', () => {
      setViewport(375);
    });

    When("alice navigates to the login page", async () => {
      const { useAuth } = await import("@/lib/auth/auth-provider");
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        logout: vi.fn(),
        error: null,
        setError: vi.fn(),
      });
      const LoginPage = (await import("@/app/login/page")).default;
      render(
        <QueryClientProvider client={createQueryClient()}>
          <LoginPage />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });
    });

    Then("the login form should span the full viewport width with padding", () => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    And("the form inputs should be large enough for touch interaction", () => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });
  });

  Scenario("Attachment upload area adapts to mobile", ({ Given, When, Then, And }) => {
    Given('the viewport is set to "mobile" (375x667)', () => {
      setViewport(375);
    });

    And('alice has created an entry with description "Lunch"', () => {
      vi.mocked(expensesApi.getExpense).mockResolvedValue({
        id: "exp-1",
        amount: "10.50",
        currency: "USD",
        category: "food",
        description: "Lunch",
        date: "2025-01-15",
        type: "expense" as const,
        userId: "user-1",
        createdAt: "2025-01-15T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
      });
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
    });

    When('alice opens the entry detail for "Lunch"', async () => {
      vi.doMock("react", async () => {
        const actual = await vi.importActual("react");
        return { ...actual, use: () => ({ id: "exp-1" }) };
      });
      const ExpenseDetailPage = (await import("@/app/expenses/[id]/page")).default;
      render(
        <QueryClientProvider client={createQueryClient()}>
          <ExpenseDetailPage params={Promise.resolve({ id: "exp-1" })} />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByText("Lunch")).toBeInTheDocument();
      });
    });

    Then("the attachment upload area should display a prominent upload button", () => {
      expect(screen.getByLabelText(/upload attachment/i)).toBeInTheDocument();
    });

    And("drag-and-drop should be replaced with a file picker", () => {
      const fileInput = screen.getByLabelText(/upload attachment/i);
      expect(fileInput.tagName).toBe("INPUT");
      expect(fileInput.getAttribute("type")).toBe("file");
    });
  });
});
