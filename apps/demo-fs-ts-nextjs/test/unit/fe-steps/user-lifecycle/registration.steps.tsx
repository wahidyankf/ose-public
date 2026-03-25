import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, expect } from "vitest";
import * as authApi from "@/lib/api/auth";
import RegisterPage from "@/app/(auth)/register/page";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/demo/fe/gherkin/user-lifecycle/registration.feature"),
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

vi.mock("@/lib/api/client", () => ({
  getAccessToken: vi.fn().mockReturnValue(null),
  getRefreshToken: vi.fn().mockReturnValue(null),
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
  usePathname: () => "/register",
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

describeFeature(feature, ({ Scenario, Background }) => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  Background(({ Given }) => {
    Given("the app is running", () => {
      cleanup();
      queryClient = createQueryClient();
      user = userEvent.setup();
      mockPush.mockClear();
    });
  });

  Scenario("Successful registration navigates to the login page with success message", ({ When, Then, And }) => {
    When(
      'a visitor fills in the registration form with username "alice", email "alice@example.com", and password "Str0ng#Pass1"',
      async () => {
        vi.mocked(authApi.register).mockResolvedValue(undefined);
        render(
          <QueryClientProvider client={queryClient}>
            <RegisterPage />
          </QueryClientProvider>,
        );
        await user.type(screen.getByLabelText(/username/i), "alice");
        await user.type(screen.getByLabelText(/email/i), "alice@example.com");
        await user.type(screen.getByLabelText(/password/i), "Str0ng#Pass1");
      },
    );

    And("the visitor submits the registration form", async () => {
      await user.click(screen.getByRole("button", { name: /create account/i }));
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login?registered=true");
      });
    });

    Then("the visitor should be on the login page", () => {
      expect(mockPush).toHaveBeenCalledWith("/login?registered=true");
    });

    And("a success message about account creation should be displayed", () => {
      expect(mockPush).toHaveBeenCalledWith("/login?registered=true");
    });
  });

  Scenario("Successful registration does not display the password in any confirmation", ({ When, Then, And }) => {
    When(
      'a visitor fills in the registration form with username "alice", email "alice@example.com", and password "Str0ng#Pass1"',
      async () => {
        vi.mocked(authApi.register).mockResolvedValue(undefined);
        render(
          <QueryClientProvider client={queryClient}>
            <RegisterPage />
          </QueryClientProvider>,
        );
        await user.type(screen.getByLabelText(/username/i), "alice");
        await user.type(screen.getByLabelText(/email/i), "alice@example.com");
        await user.type(screen.getByLabelText(/password/i), "Str0ng#Pass1");
      },
    );

    And("the visitor submits the registration form", async () => {
      await user.click(screen.getByRole("button", { name: /create account/i }));
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login?registered=true");
      });
    });

    Then("no password value should be visible on the page", () => {
      expect(screen.queryByText("Str0ng#Pass1")).not.toBeInTheDocument();
    });
  });

  Scenario("Registration with duplicate username shows an error", ({ Given, When, Then, And }) => {
    Given('a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"', () => {});

    When(
      'a visitor fills in the registration form with username "alice", email "new@example.com", and password "Str0ng#Pass1"',
      async () => {
        const { ApiError } = await import("@/lib/api/client");
        vi.mocked(authApi.register).mockRejectedValue(new ApiError(409, null));
        render(
          <QueryClientProvider client={queryClient}>
            <RegisterPage />
          </QueryClientProvider>,
        );
        await user.type(screen.getByLabelText(/username/i), "alice");
        await user.type(screen.getByLabelText(/email/i), "new@example.com");
        await user.type(screen.getByLabelText(/password/i), "Str0ng#Pass1");
      },
    );

    And("the visitor submits the registration form", async () => {
      await user.click(screen.getByRole("button", { name: /create account/i }));
      await waitFor(() => {
        expect(screen.getByText(/username or email already exists/i)).toBeInTheDocument();
      });
    });

    Then("an error message about duplicate username should be displayed", () => {
      expect(screen.getByText(/username or email already exists/i)).toBeInTheDocument();
    });

    And("the visitor should remain on the registration page", () => {
      expect(mockPush).not.toHaveBeenCalledWith("/login?registered=true");
    });
  });

  Scenario("Registration with invalid email shows a validation error", ({ When, Then, And }) => {
    When(
      'a visitor fills in the registration form with username "alice", email "not-an-email", and password "Str0ng#Pass1"',
      async () => {
        render(
          <QueryClientProvider client={queryClient}>
            <RegisterPage />
          </QueryClientProvider>,
        );
        await user.type(screen.getByLabelText(/username/i), "alice");
        await user.type(screen.getByLabelText(/email/i), "not-an-email");
        await user.type(screen.getByLabelText(/password/i), "Str0ng#Pass1");
      },
    );

    And("the visitor submits the registration form", async () => {
      await user.click(screen.getByRole("button", { name: /create account/i }));
      await waitFor(() => {
        expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
      });
    });

    Then("a validation error for the email field should be displayed", () => {
      expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    });

    And("the visitor should remain on the registration page", () => {
      expect(mockPush).not.toHaveBeenCalledWith("/login?registered=true");
    });
  });

  Scenario("Registration with empty password shows a validation error", ({ When, Then, And }) => {
    When(
      'a visitor fills in the registration form with username "alice", email "alice@example.com", and password ""',
      async () => {
        render(
          <QueryClientProvider client={queryClient}>
            <RegisterPage />
          </QueryClientProvider>,
        );
        await user.type(screen.getByLabelText(/username/i), "alice");
        await user.type(screen.getByLabelText(/email/i), "alice@example.com");
        // Leave password empty
      },
    );

    And("the visitor submits the registration form", async () => {
      await user.click(screen.getByRole("button", { name: /create account/i }));
      await waitFor(() => {
        expect(screen.getByText(/password must meet/i)).toBeInTheDocument();
      });
    });

    Then("a validation error for the password field should be displayed", () => {
      expect(screen.getByText(/password must meet/i)).toBeInTheDocument();
    });

    And("the visitor should remain on the registration page", () => {
      expect(mockPush).not.toHaveBeenCalledWith("/login?registered=true");
    });
  });

  Scenario("Registration with weak password shows a validation error", ({ When, Then, And }) => {
    When(
      'a visitor fills in the registration form with username "alice", email "alice@example.com", and password "str0ng#pass1"',
      async () => {
        render(
          <QueryClientProvider client={queryClient}>
            <RegisterPage />
          </QueryClientProvider>,
        );
        await user.type(screen.getByLabelText(/username/i), "alice");
        await user.type(screen.getByLabelText(/email/i), "alice@example.com");
        // "str0ng#pass1" has no uppercase
        await user.type(screen.getByLabelText(/password/i), "str0ng#pass1");
      },
    );

    And("the visitor submits the registration form", async () => {
      await user.click(screen.getByRole("button", { name: /create account/i }));
      await waitFor(() => {
        expect(screen.getByText(/password must meet/i)).toBeInTheDocument();
      });
    });

    Then("a validation error for the password field should be displayed", () => {
      expect(screen.getByText(/password must meet/i)).toBeInTheDocument();
    });

    And("the visitor should remain on the registration page", () => {
      expect(mockPush).not.toHaveBeenCalledWith("/login?registered=true");
    });
  });
});
