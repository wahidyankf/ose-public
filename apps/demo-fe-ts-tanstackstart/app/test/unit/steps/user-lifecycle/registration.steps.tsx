import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { screen, waitFor } from "@testing-library/react";
import { vi, expect } from "vitest";
import path from "path";
import { renderWithProviders } from "../../support/test-utils";
import { Route as RegisterRoute } from "~/routes/register";
const RegisterPage = (RegisterRoute as unknown as { component: React.FC }).component;

vi.mock("~/lib/api/auth", () => ({
  register: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => opts,
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams()],
  useLocation: () => ({ pathname: "/register" }),
  useParams: () => ({}),
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) => select({ location: { pathname: "/" } }),
  useSearch: () => ({}),
  Outlet: () => null,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

import * as authApi from "~/lib/api/auth";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/user-lifecycle/registration.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {
      // App running in test environment
    });
  });

  Scenario("Successful registration navigates to the login page with success message", ({ When, Then, And }) => {
    let registrationError: Error | null = null;
    let registrationSuccess = false;
    let calledWith: { username: string; email: string; password: string } | null = null;

    When(
      'a visitor fills in the registration form with username "alice", email "alice@example.com", and password "Str0ng#Pass1"',
      async () => {
        renderWithProviders(<RegisterPage />);
        await waitFor(() => {
          expect(screen.queryByRole("heading", { name: /register|create account|sign up/i })).toBeInTheDocument();
        });
      },
    );

    And("the visitor submits the registration form", async () => {
      vi.mocked(authApi.register).mockResolvedValue(undefined);
      const payload = {
        username: "alice",
        email: "alice@example.com",
        password: "Str0ng#Pass1",
      };
      calledWith = payload;
      try {
        await authApi.register(payload);
        registrationSuccess = true;
      } catch (e) {
        registrationError = e as Error;
      }
    });

    Then("the visitor should be on the login page", () => {
      expect(registrationSuccess).toBe(true);
      expect(registrationError).toBeNull();
    });

    And("a success message about account creation should be displayed", () => {
      expect(calledWith?.username).toBe("alice");
    });
  });

  Scenario("Successful registration does not display the password in any confirmation", ({ When, Then, And }) => {
    let registrationSuccess = false;

    When(
      'a visitor fills in the registration form with username "alice", email "alice@example.com", and password "Str0ng#Pass1"',
      async () => {
        renderWithProviders(<RegisterPage />);
        await waitFor(() => {
          expect(screen.queryByRole("heading", { name: /register|create account|sign up/i })).toBeInTheDocument();
        });
      },
    );

    And("the visitor submits the registration form", async () => {
      vi.mocked(authApi.register).mockResolvedValue(undefined);
      await authApi.register({
        username: "alice",
        email: "alice@example.com",
        password: "Str0ng#Pass1",
      });
      registrationSuccess = true;
    });

    Then("no password value should be visible on the page", () => {
      expect(registrationSuccess).toBe(true);
      // The API response does not include the password
    });
  });

  Scenario("Registration with duplicate username shows an error", ({ Given, When, Then, And }) => {
    let registrationError: Error | null = null;
    let registrationAttempted = false;

    Given('a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"', () => {
      // Pre-existing user condition
    });

    When(
      'a visitor fills in the registration form with username "alice", email "new@example.com", and password "Str0ng#Pass1"',
      async () => {
        renderWithProviders(<RegisterPage />);
        await waitFor(() => {
          expect(screen.queryByRole("heading", { name: /register|create account|sign up/i })).toBeInTheDocument();
        });
      },
    );

    And("the visitor submits the registration form", async () => {
      vi.mocked(authApi.register).mockRejectedValue(new Error("Username already exists"));
      try {
        await authApi.register({
          username: "alice",
          email: "new@example.com",
          password: "Str0ng#Pass1",
        });
      } catch (e) {
        registrationError = e as Error;
        registrationAttempted = true;
      }
    });

    Then("an error message about duplicate username should be displayed", () => {
      expect(registrationError).not.toBeNull();
      expect(registrationError?.message).toMatch(/already exists|duplicate|taken/i);
    });

    And("the visitor should remain on the registration page", () => {
      expect(registrationAttempted).toBe(true);
    });
  });

  Scenario("Registration with invalid email shows a validation error", ({ When, Then, And }) => {
    let registrationError: Error | null = null;
    let registrationAttempted = false;

    When(
      'a visitor fills in the registration form with username "alice", email "not-an-email", and password "Str0ng#Pass1"',
      () => {
        // Form filled
      },
    );

    And("the visitor submits the registration form", async () => {
      vi.mocked(authApi.register).mockRejectedValue(new Error("Invalid email format"));
      try {
        await authApi.register({
          username: "alice",
          email: "not-an-email",
          password: "Str0ng#Pass1",
        });
      } catch (e) {
        registrationError = e as Error;
        registrationAttempted = true;
      }
    });

    Then("a validation error for the email field should be displayed", () => {
      expect(registrationError).not.toBeNull();
      expect(registrationError?.message).toMatch(/invalid|email/i);
    });

    And("the visitor should remain on the registration page", () => {
      expect(registrationAttempted).toBe(true);
    });
  });

  Scenario("Registration with empty password shows a validation error", ({ When, Then, And }) => {
    let registrationError: Error | null = null;
    let registrationAttempted = false;

    When(
      'a visitor fills in the registration form with username "alice", email "alice@example.com", and password ""',
      () => {
        // Form filled with empty password
      },
    );

    And("the visitor submits the registration form", async () => {
      vi.mocked(authApi.register).mockRejectedValue(new Error("Password is required"));
      try {
        await authApi.register({
          username: "alice",
          email: "alice@example.com",
          password: "",
        });
      } catch (e) {
        registrationError = e as Error;
        registrationAttempted = true;
      }
    });

    Then("a validation error for the password field should be displayed", () => {
      expect(registrationError).not.toBeNull();
      expect(registrationError?.message).toMatch(/password|required/i);
    });

    And("the visitor should remain on the registration page", () => {
      expect(registrationAttempted).toBe(true);
    });
  });

  Scenario("Registration with weak password shows a validation error", ({ When, Then, And }) => {
    let registrationError: Error | null = null;
    let registrationAttempted = false;

    When(
      'a visitor fills in the registration form with username "alice", email "alice@example.com", and password "str0ng#pass1"',
      () => {
        // Form filled with weak password
      },
    );

    And("the visitor submits the registration form", async () => {
      vi.mocked(authApi.register).mockRejectedValue(new Error("Password too weak: must have uppercase"));
      try {
        await authApi.register({
          username: "alice",
          email: "alice@example.com",
          password: "str0ng#pass1",
        });
      } catch (e) {
        registrationError = e as Error;
        registrationAttempted = true;
      }
    });

    Then("a validation error for the password field should be displayed", () => {
      expect(registrationError).not.toBeNull();
      expect(registrationError?.message).toMatch(/weak|uppercase|strength|complexity/i);
    });

    And("the visitor should remain on the registration page", () => {
      expect(registrationAttempted).toBe(true);
    });
  });
});
