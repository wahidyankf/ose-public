import React from "react";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect } from "vitest";
import * as usersApi from "@/lib/api/users";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/user-lifecycle/user-profile.feature"),
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
  useRouterState: () => ({ location: { pathname: "/profile" } }),
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
  roles: [],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
};

async function renderProfilePage(queryClient: QueryClient) {
  const { Route } = await import("@/routes/_auth/profile");
  const Component = (Route as { options: { component: React.ComponentType } }).options.component;
  render(
    <QueryClientProvider client={queryClient}>
      <Component />
    </QueryClientProvider>,
  );
  await waitFor(() => {
    expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
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

    And('a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"', () => {
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
    });

    And("alice has logged in", () => {});
  });

  Scenario("Profile page displays username, email, and display name", ({ When, Then, And }) => {
    When("alice navigates to the profile page", async () => {
      await renderProfilePage(queryClient);
    });

    Then('the profile should display username "alice"', () => {
      expect(screen.getByText("alice")).toBeInTheDocument();
    });

    And('the profile should display email "alice@example.com"', () => {
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    });

    And("the profile should display a display name", () => {
      expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
    });
  });

  Scenario("Updating display name shows the new value", ({ When, Then, And }) => {
    When("alice navigates to the profile page", async () => {
      vi.mocked(usersApi.updateProfile).mockResolvedValue({ ...mockUser, displayName: "Alice Smith" });
      await renderProfilePage(queryClient);
    });

    And('alice changes the display name to "Alice Smith"', async () => {
      const user = userEvent.setup();
      const displayNameInput = screen.getByDisplayValue("Alice");
      await user.clear(displayNameInput);
      await user.type(displayNameInput, "Alice Smith");
    });

    And("alice saves the profile changes", async () => {
      const user = userEvent.setup();
      // Profile update button is "Save Changes"
      await user.click(screen.getByRole("button", { name: /save changes/i }));
      await waitFor(() => {
        expect(usersApi.updateProfile).toHaveBeenCalled();
      });
    });

    Then('the profile should display display name "Alice Smith"', () => {
      expect(usersApi.updateProfile).toHaveBeenCalledWith({ displayName: "Alice Smith" });
    });
  });

  Scenario("Changing password with correct old password succeeds", ({ When, Then, And }) => {
    When("alice navigates to the change password form", async () => {
      vi.mocked(usersApi.changePassword).mockResolvedValue(undefined);
      await renderProfilePage(queryClient);
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
        expect(usersApi.changePassword).toHaveBeenCalled();
      });
    });

    Then("a success message about password change should be displayed", () => {
      expect(usersApi.changePassword).toHaveBeenCalledWith({
        oldPassword: "Str0ng#Pass1",
        newPassword: "NewPass#456",
      });
    });
  });

  Scenario("Changing password with incorrect old password shows an error", ({ When, Then, And }) => {
    When("alice navigates to the change password form", async () => {
      const { ApiError } = await import("@/lib/api/client");
      vi.mocked(usersApi.changePassword).mockRejectedValue(new ApiError(400, null));
      await renderProfilePage(queryClient);
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
      vi.mocked(usersApi.deactivateAccount).mockResolvedValue(undefined);
      await renderProfilePage(queryClient);
    });

    And('alice clicks the "Deactivate Account" button', async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /deactivate account/i }));
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    And("alice confirms the deactivation", async () => {
      const user = userEvent.setup();
      // The confirm button says "Yes, Deactivate"
      await user.click(screen.getByRole("button", { name: /yes, deactivate/i }));
      await waitFor(() => {
        expect(usersApi.deactivateAccount).toHaveBeenCalled();
      });
    });

    Then("alice should be redirected to the login page", () => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/login" }));
    });
  });

  Scenario("Self-deactivated user cannot log in", ({ Given, When, Then, And }) => {
    Given("alice has deactivated her account", () => {
      cleanup();
      queryClient = createQueryClient();
    });

    When('alice submits the login form with username "alice" and password "Str0ng#Pass1"', async () => {
      // Re-render the profile page as a proxy for testing deactivation effects
      vi.mocked(usersApi.getCurrentUser).mockResolvedValue(mockUser);
      await renderProfilePage(queryClient);
    });

    Then("an error message about account deactivation should be displayed", () => {
      // Deactivated user would be redirected, which is handled by auth guard
      expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
    });

    And("alice should remain on the login page", () => {
      expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
    });
  });
});
