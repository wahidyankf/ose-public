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
  path.resolve(process.cwd(), "../../specs/apps/demo/fe/gherkin/security/security.feature"),
);

const mockPush = vi.fn();

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
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
  let user: ReturnType<typeof userEvent.setup>;

  Background(({ Given }) => {
    Given("the app is running", () => {
      cleanup();
      queryClient = createQueryClient();
      user = userEvent.setup();
      mockPush.mockClear();
    });
  });

  Scenario("Registration form rejects password shorter than 12 characters", ({ When, Then, And }) => {
    When(
      'a visitor fills in the registration form with username "alice", email "alice@example.com", and password "Short1!Ab"',
      async () => {
        const RegisterPage = (await import("@/app/(auth)/register/page")).default;
        render(
          <QueryClientProvider client={queryClient}>
            <RegisterPage />
          </QueryClientProvider>,
        );
        await user.type(screen.getByLabelText(/username/i), "alice");
        await user.type(screen.getByLabelText(/email/i), "alice@example.com");
        await user.type(screen.getByLabelText(/password/i), "Short1!Ab");
      },
    );

    And("the visitor submits the registration form", async () => {
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
        const RegisterPage = (await import("@/app/(auth)/register/page")).default;
        render(
          <QueryClientProvider client={queryClient}>
            <RegisterPage />
          </QueryClientProvider>,
        );
        await user.type(screen.getByLabelText(/username/i), "alice");
        await user.type(screen.getByLabelText(/email/i), "alice@example.com");
        await user.type(screen.getByLabelText(/password/i), "AllUpperCase1234");
      },
    );

    And("the visitor submits the registration form", async () => {
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
      const LoginPage = (await import("@/app/(auth)/login/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <LoginPage />
        </QueryClientProvider>,
      );
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
      expect(mockPush).not.toHaveBeenCalledWith("/expenses");
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
      const AdminPage = (await import("@/app/(dashboard)/admin/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <AdminPage />
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
      await user.click(screen.getByRole("button", { name: /unlock user alice/i }));
      await waitFor(() => {
        expect(adminApi.unlockUser).toHaveBeenCalled();
      });
    });

    Then('alice\'s status should display as "active"', async () => {
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
      const LoginPage = (await import("@/app/(auth)/login/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <LoginPage />
        </QueryClientProvider>,
      );
      await user.type(screen.getByLabelText(/username/i), "alice");
      await user.type(screen.getByLabelText(/password/i), "Str0ng#Pass1");
      await user.click(screen.getByRole("button", { name: /log in/i }));
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/expenses");
      });
    });

    Then("alice should be on the dashboard page", () => {
      expect(mockPush).toHaveBeenCalledWith("/expenses");
    });
  });
});
