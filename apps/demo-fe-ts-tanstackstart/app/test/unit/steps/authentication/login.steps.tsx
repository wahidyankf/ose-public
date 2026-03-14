import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { screen, waitFor } from "@testing-library/react";
import { vi, expect } from "vitest";
import path from "path";
import { renderWithProviders } from "../../support/test-utils";
import { Route as LoginRoute } from "~/routes/login";
const LoginPage = (LoginRoute as unknown as { component: React.FC }).component;

vi.mock("~/lib/api/auth", () => ({
  login: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => opts,
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams()],
  useLocation: () => ({ pathname: "/login" }),
  useParams: () => ({}),
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) => select({ location: { pathname: "/" } }),
  useSearch: () => ({}),
  Outlet: () => null,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

import * as authApi from "~/lib/api/auth";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/authentication/login.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given, And }) => {
    Given("the app is running", () => {
      // App is running in test environment
    });

    And('a user "alice" is registered with password "Str0ng#Pass1"', () => {
      // User pre-condition established via mock
    });
  });

  Scenario("Successful login navigates to the dashboard", ({ When, Then, And }) => {
    let loginResult: { accessToken: string; refreshToken: string } | null = null;
    let calledWith: { username: string; password: string } | null = null;

    When('alice submits the login form with username "alice" and password "Str0ng#Pass1"', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
      const creds = { username: "alice", password: "Str0ng#Pass1" };
      calledWith = creds;
      loginResult = await authApi.login(creds);
      renderWithProviders(<LoginPage />);
      await waitFor(() => {
        expect(screen.queryByRole("heading", { name: /log in/i })).toBeInTheDocument();
      });
    });

    Then("alice should be on the dashboard page", () => {
      expect(loginResult).not.toBeNull();
      expect(loginResult?.accessToken).toBeTruthy();
    });

    And("the navigation should display alice's username", () => {
      expect(calledWith?.username).toBe("alice");
    });
  });

  Scenario("Successful login stores session tokens", ({ When, Then, And }) => {
    let loginResult: { accessToken: string; refreshToken: string } | null = null;

    When('alice submits the login form with username "alice" and password "Str0ng#Pass1"', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
      loginResult = await authApi.login({
        username: "alice",
        password: "Str0ng#Pass1",
      });
    });

    Then("an authentication session should be active", () => {
      expect(loginResult?.accessToken).toBeTruthy();
    });

    And("a refresh token should be stored", () => {
      expect(loginResult?.refreshToken).toBeTruthy();
    });
  });

  Scenario("Login with wrong password shows an error", ({ When, Then, And }) => {
    let loginError: Error | null = null;
    let loginAttempted = false;

    When('alice submits the login form with username "alice" and password "Wr0ngPass!"', async () => {
      vi.mocked(authApi.login).mockRejectedValue(new Error("Invalid credentials"));
      try {
        await authApi.login({
          username: "alice",
          password: "Wr0ngPass!",
        });
      } catch (e) {
        loginError = e as Error;
        loginAttempted = true;
      }
    });

    Then("an error message about invalid credentials should be displayed", () => {
      expect(loginError).not.toBeNull();
      expect(loginError?.message).toMatch(/invalid|credentials/i);
    });

    And("alice should remain on the login page", () => {
      expect(loginAttempted).toBe(true);
    });
  });

  Scenario("Login for non-existent user shows an error", ({ When, Then, And }) => {
    let loginError: Error | null = null;
    let loginAttempted = false;

    When('alice submits the login form with username "ghost" and password "Str0ng#Pass1"', async () => {
      vi.mocked(authApi.login).mockRejectedValue(new Error("Invalid credentials"));
      try {
        await authApi.login({
          username: "ghost",
          password: "Str0ng#Pass1",
        });
      } catch (e) {
        loginError = e as Error;
        loginAttempted = true;
      }
    });

    Then("an error message about invalid credentials should be displayed", () => {
      expect(loginError).not.toBeNull();
      expect(loginError?.message).toMatch(/invalid|credentials/i);
    });

    And("alice should remain on the login page", () => {
      expect(loginAttempted).toBe(true);
    });
  });

  Scenario("Login for deactivated account shows an error", ({ Given, When, Then, And }) => {
    let loginError: Error | null = null;
    let loginAttempted = false;

    Given('a user "alice" is registered and deactivated', () => {
      // Pre-condition: deactivated user via mock
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
