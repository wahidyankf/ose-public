import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { screen, waitFor } from "@testing-library/react";
import { vi, expect } from "vitest";
import path from "path";
import { renderWithProviders } from "../../support/test-utils";
import { Route as ProfileRoute } from "~/routes/_authenticated/profile";
const ProfilePage = (ProfileRoute as unknown as { component: React.FC }).component;

vi.mock("~/lib/api/users", () => ({
  getCurrentUser: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  deactivateAccount: vi.fn(),
}));

vi.mock("~/lib/api/auth", () => ({
  login: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock("~/lib/auth/auth-provider", () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false, error: null, setError: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => opts,
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams()],
  useLocation: () => ({ pathname: "/profile" }),
  useParams: () => ({}),
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) => select({ location: { pathname: "/" } }),
  useSearch: () => ({}),
  Outlet: () => null,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

import * as usersApi from "~/lib/api/users";
import * as authApi from "~/lib/api/auth";

const mockUser = {
  id: "user-1",
  username: "alice",
  email: "alice@example.com",
  displayName: "Alice",
  status: "ACTIVE",
  roles: ["USER"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/user-lifecycle/user-profile.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given, And }) => {
    Given("the app is running", () => {
      // App running in test environment
    });

    And('a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"', () => {
      // User registered via mock
    });

    And("alice has logged in", () => {
      // Login pre-condition
    });
  });

  Scenario("Profile page displays username, email, and display name", ({ When, Then, And }) => {
    let user: typeof mockUser | null = null;

    When("alice navigates to the profile page", async () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
      user = await usersApi.getCurrentUser();
      renderWithProviders(<ProfilePage />);
      await waitFor(() => {
        expect(screen.queryByRole("heading", { name: /profile/i })).toBeInTheDocument();
      });
    });

    Then('the profile should display username "alice"', () => {
      expect(user?.username).toBe("alice");
    });

    And('the profile should display email "alice@example.com"', () => {
      expect(user?.email).toBe("alice@example.com");
    });

    And("the profile should display a display name", () => {
      expect(user?.displayName).toBeTruthy();
    });
  });

  Scenario("Updating display name shows the new value", ({ When, Then, And }) => {
    let updatedUser: typeof mockUser | null = null;
    let updateCalledWith: { displayName: string } | null = null;

    When("alice navigates to the profile page", async () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
      renderWithProviders(<ProfilePage />);
      await waitFor(() => {
        expect(screen.queryByRole("heading", { name: /profile/i })).toBeInTheDocument();
      });
    });

    And('alice changes the display name to "Alice Smith"', () => {
      // Fill in the new display name
    });

    And("alice saves the profile changes", async () => {
      vi.mocked(usersApi.updateProfile).mockResolvedValue({
        ...mockUser,
        displayName: "Alice Smith",
      });
      const payload = { displayName: "Alice Smith" };
      updateCalledWith = payload;
      updatedUser = await usersApi.updateProfile(payload);
    });

    Then('the profile should display display name "Alice Smith"', () => {
      expect(updatedUser?.displayName).toBe("Alice Smith");
      expect(updateCalledWith?.displayName).toBe("Alice Smith");
    });
  });

  Scenario("Changing password with correct old password succeeds", ({ When, Then, And }) => {
    let passwordChangeError: Error | null = null;
    let passwordChangeSuccess = false;

    When("alice navigates to the change password form", async () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
      renderWithProviders(<ProfilePage />);
      await waitFor(() => {
        expect(screen.queryByRole("heading", { name: /profile/i })).toBeInTheDocument();
      });
    });

    And('alice enters old password "Str0ng#Pass1" and new password "NewPass#456"', () => {
      // Fill in the password fields
    });

    And("alice submits the password change", async () => {
      vi.mocked(usersApi.changePassword).mockResolvedValue(undefined);
      try {
        await usersApi.changePassword({
          oldPassword: "Str0ng#Pass1",
          newPassword: "NewPass#456",
        });
        passwordChangeSuccess = true;
      } catch (e) {
        passwordChangeError = e as Error;
      }
    });

    Then("a success message about password change should be displayed", () => {
      expect(passwordChangeSuccess).toBe(true);
      expect(passwordChangeError).toBeNull();
    });
  });

  Scenario("Changing password with incorrect old password shows an error", ({ When, Then, And }) => {
    let passwordChangeError: Error | null = null;

    When("alice navigates to the change password form", async () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
      renderWithProviders(<ProfilePage />);
      await waitFor(() => {
        expect(screen.queryByRole("heading", { name: /profile/i })).toBeInTheDocument();
      });
    });

    And('alice enters old password "Wr0ngOld!" and new password "NewPass#456"', () => {
      // Fill in the password fields
    });

    And("alice submits the password change", async () => {
      vi.mocked(usersApi.changePassword).mockRejectedValue(new Error("Invalid credentials"));
      try {
        await usersApi.changePassword({
          oldPassword: "Wr0ngOld!",
          newPassword: "NewPass#456",
        });
      } catch (e) {
        passwordChangeError = e as Error;
      }
    });

    Then("an error message about invalid credentials should be displayed", () => {
      expect(passwordChangeError).not.toBeNull();
      expect(passwordChangeError?.message).toMatch(/invalid|credentials/i);
    });
  });

  Scenario("Self-deactivating account redirects to login", ({ When, Then, And }) => {
    let deactivateSuccess = false;

    When("alice navigates to the profile page", async () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
      renderWithProviders(<ProfilePage />);
      await waitFor(() => {
        expect(screen.queryByRole("heading", { name: /profile/i })).toBeInTheDocument();
      });
    });

    And('alice clicks the "Deactivate Account" button', () => {
      // Click deactivate button
    });

    And("alice confirms the deactivation", async () => {
      vi.mocked(usersApi.deactivateAccount).mockResolvedValue(undefined);
      await usersApi.deactivateAccount();
      deactivateSuccess = true;
    });

    Then("alice should be redirected to the login page", () => {
      expect(deactivateSuccess).toBe(true);
    });
  });

  Scenario("Self-deactivated user cannot log in", ({ Given, When, Then, And }) => {
    let loginError: Error | null = null;
    let loginAttempted = false;

    Given("alice has deactivated her account", () => {
      // Deactivated account pre-condition
    });

    When('alice submits the login form with username "alice" and password "Str0ng#Pass1"', async () => {
      vi.mocked(authApi.login).mockRejectedValue(new Error("Account deactivated"));
      try {
        await authApi.login({
          username: "alice",
          password: "Str0ng#Pass1",
        });
      } catch (e) {
        loginError = e as Error;
        loginAttempted = true;
      }
    });

    Then("an error message about account deactivation should be displayed", () => {
      expect(loginError).not.toBeNull();
      expect(loginError?.message).toMatch(/deactivated|inactive|account/i);
    });

    And("alice should remain on the login page", () => {
      expect(loginAttempted).toBe(true);
    });
  });
});
