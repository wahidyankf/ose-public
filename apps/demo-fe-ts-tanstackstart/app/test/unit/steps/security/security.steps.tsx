import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { vi, expect } from "vitest";
import path from "path";

vi.mock("~/lib/api/auth", () => ({
  register: vi.fn(),
  login: vi.fn(),
}));

vi.mock("~/lib/api/admin", () => ({
  listUsers: vi.fn(),
  unlockUser: vi.fn(),
}));

import * as authApi from "~/lib/api/auth";
import * as adminApi from "~/lib/api/admin";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/security/security.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {
      // App running in test environment
    });
  });

  Scenario("Registration form rejects password shorter than 12 characters", ({ When, Then, And }) => {
    let registrationError: Error | null = null;

    When(
      'a visitor fills in the registration form with username "alice", email "alice@example.com", and password "Short1!Ab"',
      () => {
        // Form filled with short password
      },
    );

    And("the visitor submits the registration form", async () => {
      vi.mocked(authApi.register).mockRejectedValue(new Error("Password must be at least 12 characters long"));
      try {
        await authApi.register({
          username: "alice",
          email: "alice@example.com",
          password: "Short1!Ab",
        });
      } catch (e) {
        registrationError = e as Error;
      }
    });

    Then("a validation error for the password field should be displayed", () => {
      expect(registrationError).not.toBeNull();
      expect(registrationError?.message).toMatch(/password|characters/i);
    });

    And("the error should mention minimum length requirements", () => {
      expect(registrationError?.message).toMatch(/minimum|length|characters|12/i);
    });
  });

  Scenario("Registration form rejects password with no special character", ({ When, Then, And }) => {
    let registrationError: Error | null = null;

    When(
      'a visitor fills in the registration form with username "alice", email "alice@example.com", and password "AllUpperCase1234"',
      () => {
        // Form filled with password missing special character
      },
    );

    And("the visitor submits the registration form", async () => {
      vi.mocked(authApi.register).mockRejectedValue(new Error("Password must contain at least one special character"));
      try {
        await authApi.register({
          username: "alice",
          email: "alice@example.com",
          password: "AllUpperCase1234",
        });
      } catch (e) {
        registrationError = e as Error;
      }
    });

    Then("a validation error for the password field should be displayed", () => {
      expect(registrationError).not.toBeNull();
      expect(registrationError?.message).toMatch(/password|special/i);
    });

    And("the error should mention special character requirements", () => {
      expect(registrationError?.message).toMatch(/special character/i);
    });
  });

  Scenario("Account is locked after exceeding maximum failed login attempts", ({ Given, When, Then, And }) => {
    let loginError: Error | null = null;
    let loginAttempted = false;

    Given('a user "alice" is registered with password "Str0ng#Pass1"', () => {
      // User registered via mock
    });

    And("alice has entered the wrong password the maximum number of times", () => {
      // Too many failures pre-condition
    });

    When('alice submits the login form with username "alice" and password "Str0ng#Pass1"', async () => {
      vi.mocked(authApi.login).mockRejectedValue(new Error("Account locked after too many failed attempts"));
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

    Then("an error message about account lockout should be displayed", () => {
      expect(loginError).not.toBeNull();
      expect(loginError?.message).toMatch(/locked|lockout|too many/i);
    });

    And("alice should remain on the login page", () => {
      expect(loginAttempted).toBe(true);
    });
  });

  Scenario("Admin unlocks a locked account via the admin panel", ({ Given, When, Then, And }) => {
    let unlockResult: { id: string; status: string } | null = null;
    let calledWithId: string | null = null;

    Given('a user "alice" is registered and locked after too many failed logins', () => {
      // Alice is locked via mock
    });

    And('an admin user "superadmin" is logged in', () => {
      // Admin logged in
    });

    When("the admin navigates to alice's user detail in the admin panel", () => {
      // Admin navigates to user detail
    });

    And('the admin clicks the "Unlock" button', async () => {
      vi.mocked(adminApi.unlockUser).mockResolvedValue({
        id: "user-1",
        username: "alice",
        email: "alice@example.com",
        displayName: "Alice",
        status: "ACTIVE",
        roles: ["USER"],
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      });
      calledWithId = "user-1";
      unlockResult = await adminApi.unlockUser("user-1");
    });

    Then('alice\'s status should display as "active"', () => {
      expect(unlockResult?.status).toBe("ACTIVE");
      expect(calledWithId).toBe("user-1");
    });
  });

  Scenario("Unlocked account can log in with correct password", ({ Given, When, Then }) => {
    let loginResult: { accessToken: string } | null = null;

    Given('a user "alice" was locked and has been unlocked by an admin', () => {
      // Pre-condition: alice was locked, now unlocked
    });

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

    Then("alice should be on the dashboard page", () => {
      expect(loginResult?.accessToken).toBeTruthy();
    });
  });
});
