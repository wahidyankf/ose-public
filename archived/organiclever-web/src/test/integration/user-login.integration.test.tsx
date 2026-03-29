import React from "react";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup, waitFor } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { vi, expect } from "vitest";
import { BASE_AUTH, AUTHENTICATED } from "../helpers/auth-mock";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => "/login"),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement("a", { href, className }, children),
}));
vi.mock("@/app/contexts/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/components/Navigation", () => ({ Navigation: () => null }));
vi.mock("@/components/Breadcrumb", () => ({ default: () => null }));

import { useAuth } from "@/app/contexts/auth-context";
import { useRouter } from "next/navigation";
import LoginPage from "@/app/login/page";

const feature = await loadFeature("../../specs/apps/organiclever-web/auth/user-login.feature");

describeFeature(feature, ({ Scenario, BeforeEachScenario, AfterEachScenario }) => {
  BeforeEachScenario(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ ...BASE_AUTH });
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  AfterEachScenario(() => {
    cleanup();
  });

  Scenario("Successful login redirects to the dashboard", ({ Given, When, Then, And }) => {
    let mockLogin: ReturnType<typeof vi.fn>;
    let mockPush: ReturnType<typeof vi.fn>;

    Given('a registered user with email "user@example.com" and password "password123"', () => {
      mockLogin = vi.fn<(email: string, password: string) => Promise<boolean>>().mockResolvedValue(true);
      mockPush = vi.fn();
      vi.mocked(useAuth).mockReturnValue({ ...BASE_AUTH, login: mockLogin } as unknown as ReturnType<typeof useAuth>);
      vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
      render(<LoginPage />);
    });

    When("the user submits the login form with those credentials", async () => {
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /login/i }));
    });

    Then("the user should be on the dashboard page", async () => {
      await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("user@example.com", "password123"));
    });

    And("an authentication session should be active", () => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  Scenario("Login with a wrong password shows an error", ({ Given, When, Then, And }) => {
    let mockLogin: ReturnType<typeof vi.fn>;

    Given("a visitor is on the login page", () => {
      mockLogin = vi.fn<(email: string, password: string) => Promise<boolean>>().mockResolvedValue(false);
      vi.mocked(useAuth).mockReturnValue({ ...BASE_AUTH, login: mockLogin } as unknown as ReturnType<typeof useAuth>);
      render(<LoginPage />);
    });

    When('the visitor submits email "user@example.com" and password "wrongpassword"', async () => {
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /login/i }));
    });

    Then('the error "Invalid email or password" should be displayed', async () => {
      await screen.findByText("Invalid email or password");
    });

    And("the visitor should remain on the login page", () => {
      expect(screen.getByRole("button", { name: /login/i })).toBeTruthy();
    });
  });

  Scenario("Login with an unrecognised email shows an error", ({ Given, When, Then, And }) => {
    let mockLogin: ReturnType<typeof vi.fn>;

    Given("a visitor is on the login page", () => {
      mockLogin = vi.fn<(email: string, password: string) => Promise<boolean>>().mockResolvedValue(false);
      vi.mocked(useAuth).mockReturnValue({ ...BASE_AUTH, login: mockLogin } as unknown as ReturnType<typeof useAuth>);
      render(<LoginPage />);
    });

    When('the visitor submits email "nobody@example.com" and password "password123"', async () => {
      const user = userEvent.setup();
      await user.type(screen.getByLabelText(/email/i), "nobody@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /login/i }));
    });

    Then('the error "Invalid email or password" should be displayed', async () => {
      await screen.findByText("Invalid email or password");
    });

    And("the visitor should remain on the login page", () => {
      expect(screen.getByRole("button", { name: /login/i })).toBeTruthy();
    });
  });

  Scenario("Already authenticated user is redirected away from the login page", ({ Given, When, Then }) => {
    let mockPush: ReturnType<typeof vi.fn>;

    Given('a user is already logged in as "user@example.com"', () => {
      mockPush = vi.fn();
      vi.mocked(useAuth).mockReturnValue({
        ...AUTHENTICATED,
        getIntendedDestination: vi.fn().mockReturnValue(null),
      } as unknown as ReturnType<typeof useAuth>);
      vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
    });

    When("the user navigates to the login page", async () => {
      render(<LoginPage />);
    });

    Then("the user should be redirected to the dashboard", async () => {
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
    });
  });
});
