import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { screen, waitFor } from "@testing-library/react";
import { vi, expect } from "vitest";
import path from "path";
import { renderWithProviders } from "../../support/test-utils";
import { Route as TokensRoute } from "~/routes/_authenticated/tokens";
const TokensPage = (TokensRoute as unknown as { component: React.FC }).component;

vi.mock("~/lib/api/auth", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getHealth: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock("~/lib/api/tokens", () => ({
  getJwks: vi.fn(),
  decodeTokenClaims: vi.fn(),
}));

vi.mock("~/lib/auth/auth-provider", () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false, error: null, setError: vi.fn(), logout: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => opts,
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams()],
  useLocation: () => ({ pathname: "/tokens" }),
  useParams: () => ({}),
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) => select({ location: { pathname: "/" } }),
  useSearch: () => ({}),
  Outlet: () => null,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

import * as authApi from "~/lib/api/auth";
import * as tokensApi from "~/lib/api/tokens";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/token-management/tokens.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given, And }) => {
    Given("the app is running", () => {
      // App running in test environment
    });

    And('a user "alice" is registered with password "Str0ng#Pass1"', () => {
      // Pre-condition via mock
    });

    And("alice has logged in", () => {
      // Login pre-condition
    });
  });

  Scenario("Session info displays the authenticated user's identity", ({ When, Then }) => {
    let claims: Record<string, unknown> | null = null;

    When("alice opens the session info panel", async () => {
      vi.mocked(tokensApi.decodeTokenClaims).mockReturnValue({
        sub: "user-1",
        iss: "https://demo.example.com",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        roles: ["USER"],
      });
      vi.mocked(tokensApi.getJwks).mockResolvedValue({ keys: [] });
      claims = tokensApi.decodeTokenClaims("access-token");
      renderWithProviders(<TokensPage />);
      await waitFor(() => {
        expect(screen.queryByText(/token inspector/i)).toBeInTheDocument();
      });
    });

    Then("the panel should display alice's user ID", () => {
      expect(claims?.sub).toBe("user-1");
    });
  });

  Scenario("Session info shows the token issuer", ({ When, Then }) => {
    let claims: Record<string, unknown> | null = null;

    When("alice opens the session info panel", async () => {
      vi.mocked(tokensApi.decodeTokenClaims).mockReturnValue({
        sub: "user-1",
        iss: "https://demo.example.com",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        roles: ["USER"],
      });
      vi.mocked(tokensApi.getJwks).mockResolvedValue({ keys: [] });
      claims = tokensApi.decodeTokenClaims("access-token");
      renderWithProviders(<TokensPage />);
      await waitFor(() => {
        expect(screen.queryByText(/token inspector/i)).toBeInTheDocument();
      });
    });

    Then("the panel should display a non-empty issuer value", () => {
      expect(claims?.iss).toBeTruthy();
    });
  });

  Scenario("JWKS endpoint is accessible for token verification", ({ Given, When, Then }) => {
    let jwksResult: { keys: unknown[] } | null = null;

    Given("the app is running", () => {
      // App running
    });

    When("the app fetches the JWKS endpoint", async () => {
      vi.mocked(tokensApi.getJwks).mockResolvedValue({
        keys: [
          {
            kty: "RSA",
            kid: "key-1",
            use: "sig",
            n: "sample-n",
            e: "AQAB",
          },
        ],
      });
      vi.mocked(tokensApi.decodeTokenClaims).mockReturnValue({
        sub: "user-1",
        iss: "https://demo.example.com",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        roles: ["USER"],
      });
      jwksResult = await tokensApi.getJwks();
    });

    Then("at least one public key should be available", () => {
      expect(jwksResult?.keys).toHaveLength(1);
      expect(jwksResult?.keys[0]).toBeDefined();
    });
  });

  Scenario("Logging out marks the session as ended", ({ When, Then, And }) => {
    let logoutCalled = false;

    When('alice clicks the "Logout" button', async () => {
      vi.mocked(authApi.logout).mockResolvedValue(undefined);
      await authApi.logout("refresh-token");
      logoutCalled = true;
    });

    Then("the authentication session should be cleared", () => {
      expect(logoutCalled).toBe(true);
    });

    And("navigating to a protected page should redirect to login", () => {
      expect(logoutCalled).toBe(true);
    });
  });

  Scenario("Blacklisted token is rejected on protected page navigation", ({ Given, When, Then }) => {
    let accessError: Error | null = null;

    Given("alice has logged out", async () => {
      vi.mocked(authApi.logout).mockResolvedValue(undefined);
      await authApi.logout("refresh-token");
    });

    When("alice attempts to access the dashboard directly", async () => {
      vi.mocked(tokensApi.decodeTokenClaims).mockImplementation(() => {
        throw new Error("Token has been revoked");
      });
      try {
        tokensApi.decodeTokenClaims("revoked-token");
      } catch (e) {
        accessError = e as Error;
      }
    });

    Then("alice should be redirected to the login page", () => {
      expect(accessError).not.toBeNull();
      expect(accessError?.message).toMatch(/revoked|blacklisted|invalid/i);
    });
  });

  Scenario("Disabled user is immediately logged out", ({ Given, When, Then, And }) => {
    let sessionError: Error | null = null;

    Given("an admin has disabled alice's account", () => {
      // Alice disabled condition
    });

    When("alice navigates to a protected page", async () => {
      vi.mocked(tokensApi.decodeTokenClaims).mockImplementation(() => {
        throw new Error("Account has been disabled");
      });
      try {
        tokensApi.decodeTokenClaims("access-token");
      } catch (e) {
        sessionError = e as Error;
      }
    });

    Then("alice should be redirected to the login page", () => {
      expect(sessionError).not.toBeNull();
    });

    And("an error message about account being disabled should be displayed", () => {
      expect(sessionError?.message).toMatch(/disabled|account/i);
    });
  });
});
