import React from "react";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect } from "vitest";
import * as authApi from "@/lib/api/auth";
import * as usersApi from "@/lib/api/users";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/demo/fe/gherkin/user-lifecycle/user-profile.feature"),
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

vi.mock("@/lib/api/users", () => ({
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  deactivateAccount: vi.fn(),
}));

vi.mock("@/lib/api/client", () => ({
  getAccessToken: vi.fn().mockReturnValue("mock-token"),
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/profile",
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

  Scenario("Profile page displays username, email, and display name", ({ When, Then, And }) => {
    When("alice navigates to the profile page", async () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
      const ProfilePage = (await import("@/app/profile/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <ProfilePage />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByText("alice")).toBeInTheDocument();
      });
    });

    Then('the profile should display username "alice"', () => {
      expect(screen.getByText("alice")).toBeInTheDocument();
    });

    And('the profile should display email "alice@example.com"', () => {
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    });

    And("the profile should display a display name", () => {
      // Display name is shown as input field value
      expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
    });
  });

  Scenario("Updating display name shows the new value", ({ When, Then, And }) => {
    When("alice navigates to the profile page", async () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(usersApi.updateProfile).mockResolvedValue({
        ...mockUser,
        displayName: "Alice Smith",
      });
      const ProfilePage = (await import("@/app/profile/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <ProfilePage />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      });
    });

    And('alice changes the display name to "Alice Smith"', async () => {
      const user = userEvent.setup();
      const input = screen.getByLabelText(/display name/i);
      await user.clear(input);
      await user.type(input, "Alice Smith");
    });

    And("alice saves the profile changes", async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      await waitFor(() => {
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
      });
    });

    Then('the profile should display display name "Alice Smith"', () => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  });

  Scenario("Changing password with correct old password succeeds", ({ When, Then, And }) => {
    When("alice navigates to the change password form", async () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(usersApi.changePassword).mockResolvedValue(undefined);
      const ProfilePage = (await import("@/app/profile/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <ProfilePage />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      });
    });

    And('alice enters old password "Str0ng#Pass1" and new password "NewPass#456"', async () => {
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/current password/i), "Str0ng#Pass1");
      await user.type(screen.getByLabelText(/new password/i), "NewPass#456");
    });

    And("alice submits the password change", async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /change password/i }));
      await waitFor(() => {
        expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
      });
    });

    Then("a success message about password change should be displayed", () => {
      expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
    });
  });

  Scenario("Changing password with incorrect old password shows an error", ({ When, Then, And }) => {
    When("alice navigates to the change password form", async () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
      const { ApiError } = await import("@/lib/api/client");
      vi.mocked(usersApi.changePassword).mockRejectedValue(new ApiError(400, null));
      const ProfilePage = (await import("@/app/profile/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <ProfilePage />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      });
    });

    And('alice enters old password "Wr0ngOld!" and new password "NewPass#456"', async () => {
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/current password/i), "Wr0ngOld!");
      await user.type(screen.getByLabelText(/new password/i), "NewPass#456");
    });

    And("alice submits the password change", async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /change password/i }));
      await waitFor(() => {
        expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
      });
    });

    Then("an error message about invalid credentials should be displayed", () => {
      expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
    });
  });

  Scenario("Self-deactivating account redirects to login", ({ When, Then, And }) => {
    When("alice navigates to the profile page", async () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(usersApi.deactivateAccount).mockResolvedValue(undefined);
      const { useAuth } = await import("@/lib/auth/auth-provider");
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        logout: vi.fn(),
        error: null,
        setError: vi.fn(),
      });
      const ProfilePage = (await import("@/app/profile/page")).default;
      render(
        <QueryClientProvider client={queryClient}>
          <ProfilePage />
        </QueryClientProvider>,
      );
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /deactivate account/i })).toBeInTheDocument();
      });
    });

    And('alice clicks the "Deactivate Account" button', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /deactivate account/i }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /yes, deactivate/i })).toBeInTheDocument();
      });
    });

    And("alice confirms the deactivation", async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /yes, deactivate/i }));
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });

    Then("alice should be redirected to the login page", () => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  Scenario("Self-deactivated user cannot log in", ({ Given, When, Then, And }) => {
    Given("alice has deactivated her account", () => {});

    When('alice submits the login form with username "alice" and password "Str0ng#Pass1"', async () => {
      const { ApiError } = await import("@/lib/api/client");
      // Must be unauthenticated to prevent auto-redirect on login page
      const { useAuth } = await import("@/lib/auth/auth-provider");
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        logout: vi.fn(),
        error: null,
        setError: vi.fn(),
      });
      vi.mocked(authApi.login).mockRejectedValue(new ApiError(403, null));
      const LoginPage = (await import("@/app/login/page")).default;
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
      expect(mockPush).not.toHaveBeenCalledWith("/");
    });
  });
});
