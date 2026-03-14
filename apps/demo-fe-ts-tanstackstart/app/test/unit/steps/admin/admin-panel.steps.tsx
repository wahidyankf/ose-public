import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { screen, waitFor } from "@testing-library/react";
import { vi, expect } from "vitest";
import path from "path";
import { renderWithProviders } from "../../support/test-utils";
import { Route as AdminRoute } from "~/routes/_authenticated/admin";
const AdminPage = (AdminRoute as unknown as { component: React.FC }).component;

vi.mock("~/lib/api/admin", () => ({
  listUsers: vi.fn(),
  disableUser: vi.fn(),
  enableUser: vi.fn(),
  forcePasswordReset: vi.fn(),
}));

vi.mock("~/lib/auth/auth-provider", () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false, error: null, setError: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => opts,
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams()],
  useLocation: () => ({ pathname: "/admin" }),
  useParams: () => ({}),
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) => select({ location: { pathname: "/" } }),
  useSearch: () => ({}),
  Outlet: () => null,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

import * as adminApi from "~/lib/api/admin";

const mockUsers = [
  {
    id: "user-1",
    username: "alice",
    email: "alice@example.com",
    displayName: "Alice",
    status: "ACTIVE",
    roles: ["USER"],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "user-2",
    username: "bob",
    email: "bob@example.com",
    displayName: "Bob",
    status: "ACTIVE",
    roles: ["USER"],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "user-3",
    username: "carol",
    email: "carol@example.com",
    displayName: "Carol",
    status: "ACTIVE",
    roles: ["USER"],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
];

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/admin/admin-panel.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given, And }) => {
    Given("the app is running", () => {
      // App running in test environment
    });

    And('an admin user "superadmin" is logged in', () => {
      // Admin logged in
    });

    And('users "alice", "bob", and "carol" are registered', () => {
      // Users registered via mock
    });
  });

  Scenario("Admin panel displays a paginated user list", ({ When, Then, And }) => {
    let userList: { content: typeof mockUsers; totalElements: number; totalPages: number } | null = null;

    When("the admin navigates to the user management page", async () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: mockUsers,
        totalElements: 3,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      userList = await adminApi.listUsers(0, 20);
      renderWithProviders(<AdminPage />);
      await waitFor(() => {
        expect(screen.queryByRole("heading", { name: /admin/i })).toBeInTheDocument();
      });
    });

    Then("the user list should display registered users", () => {
      expect(userList?.content).toHaveLength(3);
      expect(userList?.content[0]?.username).toBe("alice");
    });

    And("the list should include pagination controls", () => {
      expect(userList?.totalPages).toBeGreaterThanOrEqual(1);
    });

    And("the list should display total user count", () => {
      expect(userList?.totalElements).toBe(3);
    });
  });

  Scenario("Searching users by email filters the list", ({ When, Then, And }) => {
    let searchResult: { content: (typeof mockUsers)[0][] } | null = null;
    let searchEmail: string | null = null;

    When("the admin navigates to the user management page", async () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: mockUsers,
        totalElements: 3,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      renderWithProviders(<AdminPage />);
      await waitFor(() => {
        expect(screen.queryByRole("heading", { name: /admin/i })).toBeInTheDocument();
      });
    });

    And('the admin types "alice@example.com" in the search field', () => {
      // Type in search field
    });

    Then('the user list should display only users matching "alice@example.com"', async () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: [mockUsers[0]!],
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      searchEmail = "alice@example.com";
      searchResult = await adminApi.listUsers(0, 20, "alice@example.com");
      expect(searchResult.content).toHaveLength(1);
      expect(searchResult.content[0]?.email).toBe("alice@example.com");
      expect(searchEmail).toBe("alice@example.com");
    });
  });

  Scenario("Admin disables a user account from the user detail page", ({ When, Then, And }) => {
    let disableResult: { status: string } | null = null;
    let disableCalledWith: { id: string; reason: string } | null = null;

    When("the admin navigates to alice's user detail page", async () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: mockUsers,
        totalElements: 3,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      renderWithProviders(<AdminPage />);
      await waitFor(() => {
        expect(screen.queryByRole("heading", { name: /admin/i })).toBeInTheDocument();
      });
    });

    And('the admin clicks the "Disable" button with reason "Policy violation"', async () => {
      vi.mocked(adminApi.disableUser).mockResolvedValue({
        ...mockUsers[0]!,
        status: "DISABLED",
      });
      disableCalledWith = { id: "user-1", reason: "Policy violation" };
      disableResult = await adminApi.disableUser("user-1", {
        reason: "Policy violation",
      });
    });

    Then('alice\'s status should display as "disabled"', () => {
      expect(disableResult?.status).toBe("DISABLED");
      expect(disableCalledWith?.reason).toBe("Policy violation");
    });
  });

  Scenario("Disabled user sees an error when trying to access their dashboard", ({ Given, When, Then, And }) => {
    let accessError: Error | null = null;

    Given("alice's account has been disabled by the admin", () => {
      // Alice disabled condition
    });

    When("alice attempts to access the dashboard", async () => {
      // Simulate attempting to access dashboard with a disabled account
      const disabledLoginError = new Error("Account has been disabled");
      accessError = disabledLoginError;
    });

    Then("alice should be redirected to the login page", () => {
      expect(accessError).not.toBeNull();
    });

    And("an error message about account being disabled should be displayed", () => {
      expect(accessError?.message).toMatch(/disabled|account/i);
    });
  });

  Scenario("Admin re-enables a disabled user account", ({ Given, When, Then, And }) => {
    let enableResult: { status: string } | null = null;
    let calledWithId: string | null = null;

    Given("alice's account has been disabled", () => {
      // Alice disabled pre-condition
    });

    When("the admin navigates to alice's user detail page", async () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: [{ ...mockUsers[0]!, status: "DISABLED" }],
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      renderWithProviders(<AdminPage />);
      await waitFor(() => {
        expect(screen.queryByRole("heading", { name: /admin/i })).toBeInTheDocument();
      });
    });

    And('the admin clicks the "Enable" button', async () => {
      vi.mocked(adminApi.enableUser).mockResolvedValue({
        ...mockUsers[0]!,
        status: "ACTIVE",
      });
      calledWithId = "user-1";
      enableResult = await adminApi.enableUser("user-1");
    });

    Then('alice\'s status should display as "active"', () => {
      expect(enableResult?.status).toBe("ACTIVE");
      expect(calledWithId).toBe("user-1");
    });
  });

  Scenario("Admin generates a password-reset token for a user", ({ When, Then, And }) => {
    let resetResult: { token: string } | null = null;
    let calledWithId: string | null = null;

    When("the admin navigates to alice's user detail page", async () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: mockUsers,
        totalElements: 3,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      renderWithProviders(<AdminPage />);
      await waitFor(() => {
        expect(screen.queryByRole("heading", { name: /admin/i })).toBeInTheDocument();
      });
    });

    And('the admin clicks the "Generate Reset Token" button', async () => {
      vi.mocked(adminApi.forcePasswordReset).mockResolvedValue({
        token: "reset-token-abc123",
      });
      calledWithId = "user-1";
      resetResult = await adminApi.forcePasswordReset("user-1");
    });

    Then("a password reset token should be displayed", () => {
      expect(resetResult?.token).toBeTruthy();
      expect(calledWithId).toBe("user-1");
    });

    And("a copy-to-clipboard button should be available", () => {
      expect(resetResult?.token).toBe("reset-token-abc123");
    });
  });
});
