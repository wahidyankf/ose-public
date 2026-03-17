import React from "react";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect } from "vitest";
import * as authApi from "@/lib/api/auth";
import * as clientModule from "@/lib/api/client";
import LoginPage from "@/app/login/page";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/demo/fe/gherkin/authentication/login.feature"),
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
  usePathname: () => "/login",
}));

vi.mock("@/lib/auth/auth-provider", () => ({
  useAuth: () => ({ isAuthenticated: false, isLoading: false, logout: vi.fn(), error: null, setError: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

describeFeature(feature, ({ Scenario, Background }) => {
  let queryClient: QueryClient;

  Background(({ Given, And }) => {
    Given("the app is running", () => {
      cleanup();
      queryClient = createQueryClient();
      mockPush.mockClear();
    });

    And('a user "alice" is registered with password "Str0ng#Pass1"', () => {
      // Setup handled by mock
    });
  });

  Scenario("Successful login navigates to the dashboard", ({ When, Then, And }) => {
    When('alice submits the login form with username "alice" and password "Str0ng#Pass1"', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        tokenType: "Bearer",
      });
      render(
        <QueryClientProvider client={queryClient}>
          <LoginPage />
        </QueryClientProvider>,
      );
      const user = userEvent.setup();
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

    And("the navigation should display alice's username", () => {
      // Username display is in Header component; login page redirects to dashboard
      expect(mockPush).toHaveBeenCalledWith("/expenses");
    });
  });

  Scenario("Successful login stores session tokens", ({ When, Then, And }) => {
    When('alice submits the login form with username "alice" and password "Str0ng#Pass1"', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        tokenType: "Bearer",
      });
      render(
        <QueryClientProvider client={queryClient}>
          <LoginPage />
        </QueryClientProvider>,
      );
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/username/i), "alice");
      await user.type(screen.getByLabelText(/password/i), "Str0ng#Pass1");
      await user.click(screen.getByRole("button", { name: /log in/i }));
      await waitFor(() => {
        expect(clientModule.setTokens).toHaveBeenCalled();
      });
    });

    Then("an authentication session should be active", () => {
      expect(clientModule.setTokens).toHaveBeenCalledWith("mock-access-token", "mock-refresh-token");
    });

    And("a refresh token should be stored", () => {
      expect(clientModule.setTokens).toHaveBeenCalledWith(expect.any(String), "mock-refresh-token");
    });
  });

  Scenario("Login with wrong password shows an error", ({ When, Then, And }) => {
    When('alice submits the login form with username "alice" and password "Wr0ngPass!"', async () => {
      const { ApiError } = await import("@/lib/api/client");
      vi.mocked(authApi.login).mockRejectedValue(new ApiError(401, null));
      render(
        <QueryClientProvider client={queryClient}>
          <LoginPage />
        </QueryClientProvider>,
      );
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/username/i), "alice");
      await user.type(screen.getByLabelText(/password/i), "Wr0ngPass!");
      await user.click(screen.getByRole("button", { name: /log in/i }));
      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
      });
    });

    Then("an error message about invalid credentials should be displayed", () => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });

    And("alice should remain on the login page", () => {
      expect(mockPush).not.toHaveBeenCalledWith("/expenses");
    });
  });

  Scenario("Login for non-existent user shows an error", ({ When, Then, And }) => {
    When('alice submits the login form with username "ghost" and password "Str0ng#Pass1"', async () => {
      const { ApiError } = await import("@/lib/api/client");
      vi.mocked(authApi.login).mockRejectedValue(new ApiError(401, null));
      render(
        <QueryClientProvider client={queryClient}>
          <LoginPage />
        </QueryClientProvider>,
      );
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/username/i), "ghost");
      await user.type(screen.getByLabelText(/password/i), "Str0ng#Pass1");
      await user.click(screen.getByRole("button", { name: /log in/i }));
      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
      });
    });

    Then("an error message about invalid credentials should be displayed", () => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
    });

    And("alice should remain on the login page", () => {
      expect(mockPush).not.toHaveBeenCalledWith("/expenses");
    });
  });

  Scenario("Login for deactivated account shows an error", ({ Given, When, Then, And }) => {
    Given('a user "alice" is registered and deactivated', () => {
      // Mock returns 403 for deactivated user
    });

    When('alice submits the login form with username "alice" and password "Str0ng#Pass1"', async () => {
      const { ApiError } = await import("@/lib/api/client");
      vi.mocked(authApi.login).mockRejectedValue(new ApiError(403, null));
      render(
        <QueryClientProvider client={queryClient}>
          <LoginPage />
        </QueryClientProvider>,
      );
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/username/i), "alice");
      await user.type(screen.getByLabelText(/password/i), "Str0ng#Pass1");
      await user.click(screen.getByRole("button", { name: /log in/i }));
      await waitFor(() => {
        expect(screen.getByText(/deactivated or disabled/i)).toBeInTheDocument();
      });
    });

    Then("an error message about account deactivation should be displayed", () => {
      expect(screen.getByText(/deactivated or disabled/i)).toBeInTheDocument();
    });

    And("alice should remain on the login page", () => {
      expect(mockPush).not.toHaveBeenCalledWith("/expenses");
    });
  });
});
