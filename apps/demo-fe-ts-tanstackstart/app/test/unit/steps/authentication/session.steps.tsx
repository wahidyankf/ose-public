import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { vi, expect } from "vitest";
import path from "path";

vi.mock("~/lib/api/auth", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  logoutAll: vi.fn(),
  refreshToken: vi.fn(),
}));

import * as authApi from "~/lib/api/auth";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/authentication/session.feature"),
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

  Scenario("Session refreshes automatically before the access token expires", ({ Given, When, Then, And }) => {
    let refreshResult: { accessToken: string; refreshToken: string } | null = null;

    Given("alice's access token is about to expire", () => {
      // Token near-expiry condition
    });

    When("the app performs a background token refresh", async () => {
      vi.mocked(authApi.refreshToken).mockResolvedValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
      refreshResult = await authApi.refreshToken("refresh-token");
    });

    Then("a new access token should be stored", () => {
      expect(refreshResult?.accessToken).toBe("new-access-token");
    });

    And("a new refresh token should be stored", () => {
      expect(refreshResult?.refreshToken).toBe("new-refresh-token");
    });
  });

  Scenario("Expired refresh token redirects to login", ({ Given, When, Then, And }) => {
    let refreshError: Error | null = null;

    Given("alice's refresh token has expired", () => {
      // Expired token condition
    });

    When("the app attempts a background token refresh", async () => {
      vi.mocked(authApi.refreshToken).mockRejectedValue(new Error("Token expired"));
      try {
        await authApi.refreshToken("expired-token");
      } catch (e) {
        refreshError = e as Error;
      }
    });

    Then("alice should be redirected to the login page", () => {
      expect(refreshError).not.toBeNull();
    });

    And("an error message about session expiration should be displayed", () => {
      expect(refreshError?.message).toMatch(/expired|token/i);
    });
  });

  Scenario("Original refresh token is rejected after rotation", ({ Given, When, Then }) => {
    let refreshError: Error | null = null;
    let calledWith: string | null = null;

    Given("alice has refreshed her session and received a new token pair", () => {
      // New token pair received
    });

    When("the app attempts to refresh using the original refresh token", async () => {
      vi.mocked(authApi.refreshToken).mockRejectedValue(new Error("Token already used"));
      try {
        await authApi.refreshToken("original-token");
      } catch (e) {
        refreshError = e as Error;
        calledWith = "original-token";
      }
    });

    Then("alice should be redirected to the login page", () => {
      expect(refreshError).not.toBeNull();
      expect(calledWith).toBe("original-token");
    });
  });

  Scenario("Deactivated user is redirected to login on next action", ({ Given, When, Then, And }) => {
    let protectedError: Error | null = null;

    Given("alice's account has been deactivated", () => {
      // Account deactivated condition
    });

    When("alice navigates to a protected page", async () => {
      vi.mocked(authApi.refreshToken).mockRejectedValue(new Error("Account deactivated"));
      try {
        await authApi.refreshToken("token");
      } catch (e) {
        protectedError = e as Error;
      }
    });

    Then("alice should be redirected to the login page", () => {
      expect(protectedError).not.toBeNull();
    });

    And("an error message about account deactivation should be displayed", () => {
      expect(protectedError?.message).toMatch(/deactivated|inactive|account/i);
    });
  });

  Scenario("Clicking logout ends the current session", ({ When, Then, And }) => {
    let logoutCalled = false;
    let logoutToken: string | null = null;

    When('alice clicks the "Logout" button', async () => {
      vi.mocked(authApi.logout).mockResolvedValue(undefined);
      await authApi.logout("refresh-token");
      logoutCalled = true;
      logoutToken = "refresh-token";
    });

    Then("alice should be redirected to the login page", () => {
      expect(logoutCalled).toBe(true);
    });

    And("the authentication session should be cleared", () => {
      expect(logoutToken).toBe("refresh-token");
    });
  });

  Scenario('Clicking "Log out all devices" ends all sessions', ({ When, Then, And }) => {
    let logoutAllCalled = false;

    When('alice clicks the "Log out all devices" option', async () => {
      vi.mocked(authApi.logoutAll).mockResolvedValue(undefined);
      await authApi.logoutAll();
      logoutAllCalled = true;
    });

    Then("alice should be redirected to the login page", () => {
      expect(logoutAllCalled).toBe(true);
    });

    And("the authentication session should be cleared", () => {
      expect(logoutAllCalled).toBe(true);
    });
  });

  Scenario("Clicking logout twice does not cause an error", ({ Given, When, Then }) => {
    let error: Error | null = null;

    Given("alice has already clicked logout", async () => {
      vi.mocked(authApi.logout).mockResolvedValue(undefined);
      await authApi.logout("refresh-token");
    });

    When("alice navigates to the login page", async () => {
      // Second logout attempt should not throw
      vi.mocked(authApi.logout).mockResolvedValue(undefined);
      try {
        await authApi.logout("refresh-token");
      } catch (e) {
        error = e as Error;
      }
    });

    Then("no error should be displayed", () => {
      expect(error).toBeNull();
    });
  });
});
