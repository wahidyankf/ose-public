import React from "react";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect } from "vitest";
import * as authApi from "@/lib/api/auth";
import * as adminApi from "@/lib/api/admin";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/security/security.feature"),
);

const mockNavigate = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  getHealth: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  refreshToken: vi.fn(),
  logout: vi.fn(),
  logoutAll: vi.fn(),
}));

vi.mock("@/lib/api/admin", () => ({
  listUsers: vi.fn(),
  disableUser: vi.fn(),
  enableUser: vi.fn(),
  unlockUser: vi.fn(),
  forcePasswordReset: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  getAccessToken: vi.fn().mockReturnValue(null),
  getRefreshToken: vi.fn().mockReturnValue(null),
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
  createFileRoute:
    (_path: string) =>
    (opts: { component: React.ComponentType; validateSearch?: (s: Record<string, unknown>) => unknown }) => ({
      options: opts,
      component: opts.component,
      useSearch: vi.fn().mockReturnValue({ registered: undefined }),
    }),
  Link: ({ children, to, style }: { children: React.ReactNode; to: string; style?: React.CSSProperties }) => (
    <a href={to} style={style}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
  useRouterState: () => ({ location: { pathname: "/" } }),
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: vi.fn().mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    logout: vi.fn(),
    error: null,
    setError: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

const mockAdminUser = {
  id: "admin-1",
  username: "superadmin",
  email: "admin@example.com",
  displayName: "Admin",
  status: "ACTIVE" as const,
  roles: ["ADMIN"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

const mockAliceUser = {
  id: "alice-1",
  username: "alice",
  email: "alice@example.com",
  displayName: "Alice",
  status: "ACTIVE" as const,
  roles: [] as string[],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

const mockLockedAlice = { ...mockAliceUser, status: "LOCKED" as const };

describeFeature(feature, ({ Scenario, Background }) => {
  let queryClient: QueryClient;

  Background(({ Given }) => {
    Given("the app is running", () => {
      cleanup();
      queryClient = createQueryClient();
      mockNavigate.mockClear();
    });
  });

  Scenario("Registration form rejects password shorter than 12 characters", ({ When, Then, And }) => {
    When(
      'a visitor fills in the registration form with username "alice", email "alice@example.com", and password "Short1!Ab"',
      async () => {
        const { Route } = await import("@/routes/register");
        const Component = (Route as { options: { component: React.ComponentType } }).options.component;
        render(
          <QueryClientProvider client={queryClient}>
            <Component />
          </QueryClientProvider>,
        );
        const user = userEvent.setup();
        await user.type(screen.getByLabelText(/username/i), "alice");
        await user.type(screen.getByLabelText(/email/i), "alice@example.com");
        await user.type(screen.getByLabelText(/password/i), "Short1!Ab");
      },
    );

    And("the visitor submits the registration form", async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /create account/i }));
      await waitFor(() => {
        expect(screen.getByText(/password must meet/i)).toBeInTheDocument();
      });
    });

    Then("a validation error for the password field should be displayed", () => {
      expect(screen.getByText(/password must meet/i)).toBeInTheDocument();
    });

    And("the error should mention minimum length requirements", () => {
      expect(screen.getByText(/at least 12/i)).toBeInTheDocument();
    });
  });

  Scenario("Registration form rejects password with no special character", ({ When, Then, And }) => {
    When(
      'a visitor fills in the registration form with username "alice", email "alice@example.com", and password "AllUpperCase1234"',
      async () => {
        const { Route } = await import("@/routes/register");
        const Component = (Route as { options: { component: React.ComponentType } }).options.component;
        render(
          <QueryClientProvider client={queryClient}>
            <Component />
          </QueryClientProvider>,
        );
        const user = userEvent.setup();
        await user.type(screen.getByLabelText(/username/i), "alice");
        await user.type(screen.getByLabelText(/email/i), "alice@example.com");
        await user.type(screen.getByLabelText(/password/i), "AllUpperCase1234");
      },
    );

    And("the visitor submits the registration form", async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /create account/i }));
      await waitFor(() => {
        expect(screen.getByText(/password must meet/i)).toBeInTheDocument();
      });
    });

    Then("a validation error for the password field should be displayed", () => {
      expect(screen.getByText(/password must meet/i)).toBeInTheDocument();
    });

    And("the error should mention special character requirements", () => {
      expect(screen.getByText(/at least one special character/i)).toBeInTheDocument();
    });
  });

  Scenario("Account is locked after exceeding maximum failed login attempts", ({ Given, When, Then, And }) => {
    Given('a user "alice" is registered with password "Str0ng#Pass1"', () => {});

    And("alice has entered the wrong password the maximum number of times", () => {});

    When('alice submits the login form with username "alice" and password "Str0ng#Pass1"', async () => {
      const { ApiError } = await import("@/lib/api/client");
      vi.mocked(authApi.login).mockRejectedValue(new ApiError(423, { message: "Account locked" }));
      const { Route } = await import("@/routes/login");
      const Component = (Route as { options: { component: React.ComponentType } }).options.component;
      render(
        <QueryClientProvider client={queryClient}>
          <Component />
        </QueryClientProvider>,
      );
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/username/i), "alice");
      await user.type(screen.getByLabelText(/password/i), "Str0ng#Pass1");
      await user.click(screen.getByRole("button", { name: /log in/i }));
      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    Then("an error message about account lockout should be displayed", () => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    And("alice should remain on the login page", () => {
      expect(mockNavigate).not.toHaveBeenCalledWith(expect.objectContaining({ to: "/expenses" }));
    });
  });

  Scenario("Admin unlocks a locked account via the admin panel", ({ Given, When, Then, And }) => {
    Given('a user "alice" is registered and locked after too many failed logins', () => {});

    And('an admin user "superadmin" is logged in', () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: [mockLockedAlice, mockAdminUser],
        totalElements: 2,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      vi.mocked(adminApi.unlockUser).mockResolvedValue({
        ...mockLockedAlice,
        status: "ACTIVE",
      });
    });

    When("the admin navigates to alice's user detail in the admin panel", async () => {
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

    And('the admin clicks the "Unlock" button', async () => {
      vi.mocked(adminApi.listUsers).mockResolvedValue({
        content: [{ ...mockLockedAlice, status: "ACTIVE" }],
        totalElements: 1,
        totalPages: 1,
        page: 0,
        size: 20,
      });
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /unlock user alice/i }));
      await waitFor(() => {
        expect(adminApi.unlockUser).toHaveBeenCalled();
      });
    });

    Then("alice's status should display as \"active\"", async () => {
      await waitFor(() => {
        expect(adminApi.unlockUser).toHaveBeenCalled();
      });
    });
  });

  Scenario("Unlocked account can log in with correct password", ({ Given, When, Then }) => {
    Given('a user "alice" was locked and has been unlocked by an admin', () => {});

    When('alice submits the login form with username "alice" and password "Str0ng#Pass1"', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        tokenType: "Bearer",
      });
      const { Route } = await import("@/routes/login");
      const Component = (Route as { options: { component: React.ComponentType } }).options.component;
      render(
        <QueryClientProvider client={queryClient}>
          <Component />
        </QueryClientProvider>,
      );
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/username/i), "alice");
      await user.type(screen.getByLabelText(/password/i), "Str0ng#Pass1");
      await user.click(screen.getByRole("button", { name: /log in/i }));
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/expenses" }));
      });
    });

    Then("alice should be on the dashboard page", () => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/expenses" }));
    });
  });
});
