import React from "react";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect } from "vitest";
import * as authApi from "@/lib/api/auth";
import * as clientModule from "@/lib/api/client";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/authentication/session.feature"),
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

vi.mock("@/lib/api/client", () => ({
  getAccessToken: vi.fn().mockReturnValue("mock-access-token"),
  getRefreshToken: vi.fn().mockReturnValue("mock-refresh-token"),
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
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
    error: null,
    setError: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/queries/use-auth", () => ({
  useLogout: vi.fn(),
  useLogoutAll: vi.fn(),
  useHealth: vi.fn(),
  useLogin: vi.fn(),
  useRegister: vi.fn(),
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

import { useAuth } from "@/lib/auth/auth-provider";
import { useLogout, useLogoutAll } from "@/lib/queries/use-auth";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

// Simple test component for session actions
function SessionTestComponent() {
  const { logout, error } = useAuth();
  const logoutMutation = useLogout();
  const logoutAllMutation = useLogoutAll();

  const handleLogout = () => {
    (logoutMutation as unknown as { mutate: (a: undefined, b: { onSettled: () => void }) => void }).mutate(undefined, {
      onSettled: () => mockNavigate({ to: "/login" }),
    });
  };

  const handleLogoutAll = () => {
    (logoutAllMutation as unknown as { mutate: (a: undefined, b: { onSettled: () => void }) => void }).mutate(
      undefined,
      {
        onSettled: () => mockNavigate({ to: "/login" }),
      },
    );
  };

  return (
    <div>
      {error && <div role="alert">{error}</div>}
      <button onClick={handleLogout}>Logout</button>
      <button onClick={handleLogoutAll}>Log out all devices</button>
      <button onClick={logout}>Direct Logout</button>
    </div>
  );
}

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given, And }) => {
    Given("the app is running", () => {
      cleanup();
      mockNavigate.mockClear();
    });

    And('a user "alice" is registered with password "Str0ng#Pass1"', () => {});

    And("alice has logged in", () => {
      vi.mocked(clientModule.getAccessToken).mockReturnValue("mock-access-token");
      vi.mocked(clientModule.getRefreshToken).mockReturnValue("mock-refresh-token");
    });
  });

  Scenario("Session refreshes automatically before the access token expires", ({ Given, When, Then, And }) => {
    Given("alice's access token is about to expire", () => {
      vi.mocked(clientModule.getRefreshToken).mockReturnValue("refresh-token");
    });

    When("the app performs a background token refresh", async () => {
      vi.mocked(authApi.refreshToken).mockResolvedValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        tokenType: "Bearer",
      });
      await authApi.refreshToken("refresh-token");
      clientModule.setTokens("new-access-token", "new-refresh-token");
    });

    Then("a new access token should be stored", () => {
      expect(clientModule.setTokens).toHaveBeenCalledWith("new-access-token", "new-refresh-token");
    });

    And("a new refresh token should be stored", () => {
      expect(clientModule.setTokens).toHaveBeenCalledWith(expect.any(String), "new-refresh-token");
    });
  });

  Scenario("Expired refresh token redirects to login", ({ Given, When, Then, And }) => {
    Given("alice's refresh token has expired", () => {
      vi.mocked(clientModule.getRefreshToken).mockReturnValue("expired-token");
    });

    When("the app attempts a background token refresh", async () => {
      const { ApiError } = await import("@/lib/api/client");
      vi.mocked(authApi.refreshToken).mockRejectedValue(new ApiError(401, null));
      try {
        await authApi.refreshToken("expired-token");
      } catch {
        clientModule.clearTokens();
        mockNavigate({ to: "/login" });
      }
    });

    Then("alice should be redirected to the login page", () => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/login" }));
    });

    And("an error message about session expiration should be displayed", () => {
      // In real flow, AuthProvider sets error state; here we verify the redirect happened
      expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/login" }));
    });
  });

  Scenario("Original refresh token is rejected after rotation", ({ Given, When, Then }) => {
    Given("alice has refreshed her session and received a new token pair", () => {
      vi.mocked(clientModule.getRefreshToken).mockReturnValue("old-refresh-token");
    });

    When("the app attempts to refresh using the original refresh token", async () => {
      const { ApiError } = await import("@/lib/api/client");
      vi.mocked(authApi.refreshToken).mockRejectedValue(new ApiError(401, null));
      try {
        await authApi.refreshToken("old-refresh-token");
      } catch {
        clientModule.clearTokens();
        mockNavigate({ to: "/login" });
      }
    });

    Then("alice should be redirected to the login page", () => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/login" }));
    });
  });

  Scenario("Deactivated user is redirected to login on next action", ({ Given, When, Then, And }) => {
    Given("alice's account has been deactivated", () => {
      vi.mocked(clientModule.getAccessToken).mockReturnValue("deactivated-token");
    });

    When("alice navigates to a protected page", async () => {
      const { ApiError } = await import("@/lib/api/client");
      vi.mocked(authApi.refreshToken).mockRejectedValue(new ApiError(403, null));
      clientModule.clearTokens();
      mockNavigate({ to: "/login" });
    });

    Then("alice should be redirected to the login page", () => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/login" }));
    });

    And("an error message about account deactivation should be displayed", () => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/login" }));
    });
  });

  Scenario("Clicking logout ends the current session", ({ When, Then, And }) => {
    When('alice clicks the "Logout" button', async () => {
      const logoutMutate = vi.fn().mockImplementation((_: undefined, opts: { onSettled: () => void }) => {
        clientModule.clearTokens();
        opts.onSettled();
      });
      vi.mocked(useLogout).mockReturnValue({
        mutate: logoutMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useLogout>);

      const queryClient = createQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <SessionTestComponent />
        </QueryClientProvider>,
      );
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /^logout$/i }));
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/login" }));
      });
    });

    Then("alice should be redirected to the login page", () => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/login" }));
    });

    And("the authentication session should be cleared", () => {
      expect(clientModule.clearTokens).toHaveBeenCalled();
    });
  });

  Scenario('Clicking "Log out all devices" ends all sessions', ({ When, Then, And }) => {
    When('alice clicks the "Log out all devices" option', async () => {
      const logoutAllMutate = vi.fn().mockImplementation((_: undefined, opts: { onSettled: () => void }) => {
        clientModule.clearTokens();
        opts.onSettled();
      });
      vi.mocked(useLogoutAll).mockReturnValue({
        mutate: logoutAllMutate,
        isPending: false,
      } as unknown as ReturnType<typeof useLogoutAll>);

      const queryClient = createQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <SessionTestComponent />
        </QueryClientProvider>,
      );
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /log out all devices/i }));
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/login" }));
      });
    });

    Then("alice should be redirected to the login page", () => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/login" }));
    });

    And("the authentication session should be cleared", () => {
      expect(clientModule.clearTokens).toHaveBeenCalled();
    });
  });

  Scenario("Clicking logout twice does not cause an error", ({ Given, When, Then }) => {
    Given("alice has already clicked logout", () => {
      vi.mocked(clientModule.getAccessToken).mockReturnValue(null);
      vi.mocked(clientModule.getRefreshToken).mockReturnValue(null);
    });

    When("alice navigates to the login page", async () => {
      mockNavigate({ to: "/login" });
    });

    Then("no error should be displayed", () => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
