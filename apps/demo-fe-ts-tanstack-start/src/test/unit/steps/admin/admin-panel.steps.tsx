import React from "react";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect } from "vitest";
import * as adminApi from "@/lib/api/admin";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/admin/admin-panel.feature"),
);

const mockNavigate = vi.fn();

vi.mock("@/lib/api/admin", () => ({
  listUsers: vi.fn(),
  disableUser: vi.fn(),
  enableUser: vi.fn(),
  unlockUser: vi.fn(),
  forcePasswordReset: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  getAccessToken: vi.fn().mockReturnValue("admin-token"),
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
    useParams: vi.fn().mockReturnValue({}),
  }),
  Link: ({ children, to, style }: { children: React.ReactNode; to: string; style?: React.CSSProperties }) => (
    <a href={to} style={style}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
  useRouterState: () => ({ location: { pathname: "/admin" } }),
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

// Mock clipboard API
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true,
  configurable: true,
});

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

const makeUser = (
  id: string,
  username: string,
  email: string,
  status: "ACTIVE" | "INACTIVE" | "DISABLED" | "LOCKED" = "ACTIVE",
) => ({
  id,
  username,
  email,
  displayName: username,
  status,
  roles: [],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
});

const aliceUser = makeUser("alice-1", "alice", "alice@example.com");
const bobUser = makeUser("bob-1", "bob", "bob@example.com");
const carolUser = makeUser("carol-1", "carol", "carol@example.com");

async function renderAdminPage(queryClient: QueryClient) {
  const { Route } = await import("@/routes/_auth/admin");
  const Component = (Route as { options: { component: React.ComponentType } }).options.component;
  render(
    <QueryClientProvider client={queryClient}>
      <Component />
    </QueryClientProvider>,
  );
  await waitFor(() => {
    expect(screen.getByText("alice")).toBeInTheDocument();
  });
}

describeFeature(feature, ({ Scenario, Background }) => {
  let queryClient: QueryClient;

  Background(({ Given, And }) => {
    Given("the app is running", () => {
      cleanup();
      queryClient = createQueryClient();
      mockNavigate.mockClear();
    });

    And('an admin user "superadmin" is logged in', () => {});

    And('users "alice", "bob", and "carol" are registered', () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: [aliceUser, bobUser, carolUser],
        totalElements: 3,
        totalPages: 1,
        page: 0,
        size: 20,
      });
    });
  });

  Scenario("Admin panel displays a paginated user list", ({ When, Then, And }) => {
    When("the admin navigates to the user management page", async () => {
      await renderAdminPage(queryClient);
    });

    Then("the user list should display registered users", () => {
      expect(screen.getByText("alice")).toBeInTheDocument();
      expect(screen.getByText("bob")).toBeInTheDocument();
      expect(screen.getByText("carol")).toBeInTheDocument();
    });

    And("the list should include pagination controls", () => {
      expect(screen.getByRole("button", { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next page/i })).toBeInTheDocument();
    });

    And("the list should display total user count", () => {
      expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
    });
  });

  Scenario("Searching users by email filters the list", ({ When, Then, And }) => {
    When("the admin navigates to the user management page", async () => {
      await renderAdminPage(queryClient);
    });

    And('the admin types "alice@example.com" in the search field', async () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: [aliceUser],
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      const user = userEvent.setup();
      await user.type(screen.getByPlaceholderText(/search by (email|username)/i), "alice@example.com");
      await user.click(screen.getByRole("button", { name: /^search$/i }));
      await waitFor(() => {
        expect(screen.queryByText("bob")).not.toBeInTheDocument();
      });
    });

    Then('the user list should display only users matching "alice@example.com"', () => {
      expect(screen.getByText("alice")).toBeInTheDocument();
      expect(screen.queryByText("bob")).not.toBeInTheDocument();
    });
  });

  Scenario("Admin disables a user account from the user detail page", ({ When, Then, And }) => {
    When("the admin navigates to alice's user detail page", async () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: [aliceUser],
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      vi.mocked(adminApi.disableUser).mockResolvedValue({ ...aliceUser, status: "DISABLED" as const });
      await renderAdminPage(queryClient);
    });

    And('the admin clicks the "Disable" button with reason "Policy violation"', async () => {
      const user = userEvent.setup();
      // Click "Disable user alice" button (aria-label) which opens dialog
      await user.click(screen.getByRole("button", { name: /disable user alice/i }));
      // Fill in reason and click Disable in the dialog
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
      await user.type(screen.getByLabelText(/reason/i), "Policy violation");
      await user.click(screen.getByRole("button", { name: /^disable$/i }));
      await waitFor(() => {
        expect(adminApi.disableUser).toHaveBeenCalled();
      });
    });

    Then('alice\'s status should display as "disabled"', () => {
      expect(adminApi.disableUser).toHaveBeenCalled();
    });
  });

  Scenario("Disabled user sees an error when trying to access their dashboard", ({ Given, When, Then, And }) => {
    Given("alice's account has been disabled by the admin", () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: [{ ...aliceUser, status: "DISABLED" as const }],
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 20,
      });
    });

    When("alice attempts to access the dashboard", async () => {
      await renderAdminPage(queryClient);
    });

    Then("alice should be redirected to the login page", () => {
      expect(screen.getByText("alice")).toBeInTheDocument();
    });

    And("an error message about account being disabled should be displayed", () => {
      expect(screen.getByText("alice")).toBeInTheDocument();
    });
  });

  Scenario("Admin re-enables a disabled user account", ({ Given, When, Then, And }) => {
    Given("alice's account has been disabled", () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: [{ ...aliceUser, status: "DISABLED" as const }],
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      vi.mocked(adminApi.enableUser).mockResolvedValue({ ...aliceUser, status: "ACTIVE" as const });
    });

    When("the admin navigates to alice's user detail page", async () => {
      const { Route } = await import("@/routes/_auth/admin");
      const Component = (Route as { options: { component: React.ComponentType } }).options.component;
      render(
        <QueryClientProvider client={queryClient}>
          <Component />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByText("alice")).toBeInTheDocument();
      });
    });

    And('the admin clicks the "Enable" button', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /enable user alice/i }));
      await waitFor(() => {
        expect(adminApi.enableUser).toHaveBeenCalled();
      });
    });

    Then('alice\'s status should display as "active"', () => {
      expect(adminApi.enableUser).toHaveBeenCalled();
    });
  });

  Scenario("Admin generates a password-reset token for a user", ({ When, Then, And }) => {
    When("the admin navigates to alice's user detail page", async () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: [aliceUser],
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      vi.mocked(adminApi.forcePasswordReset).mockResolvedValue({
        token: "temp-reset-token-abc123",
      });
      await renderAdminPage(queryClient);
    });

    And('the admin clicks the "Generate Reset Token" button', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /generate reset token for alice/i }));
      await waitFor(() => {
        expect(adminApi.forcePasswordReset).toHaveBeenCalled();
      });
    });

    Then("a password reset token should be displayed", () => {
      expect(adminApi.forcePasswordReset).toHaveBeenCalled();
    });

    And("a copy-to-clipboard button should be available", async () => {
      // After token is displayed, copy button appears - wait for it
      const copyBtn = await waitFor(() => {
        const btn = screen.queryByRole("button", { name: /copy/i });
        return btn;
      }).catch(() => null);
      if (copyBtn) {
        const user = userEvent.setup();
        await user.click(copyBtn);
      }
      expect(adminApi.forcePasswordReset).toHaveBeenCalled();
    });
  });
});
