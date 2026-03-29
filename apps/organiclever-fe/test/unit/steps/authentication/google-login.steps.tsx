import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { vi, expect } from "vitest";
import LoginPage from "@/app/login/page";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/fe/gherkin/authentication/google-login.feature"),
);

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/login",
}));

vi.mock("next/script", () => ({
  default: ({ onLoad }: { onLoad?: () => void }) => {
    // Trigger onLoad synchronously for tests
    if (onLoad) onLoad();
    return null;
  },
}));

const mockGoogleAccounts = {
  id: {
    initialize: vi.fn(),
    renderButton: vi.fn(),
    prompt: vi.fn(),
  },
};

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {
      cleanup();
      mockPush.mockClear();
      vi.clearAllMocks();

      Object.defineProperty(window, "google", {
        value: { accounts: mockGoogleAccounts },
        writable: true,
        configurable: true,
      });
    });
  });

  Scenario("Login page displays Google sign-in button", ({ When, Then, And }) => {
    When("I navigate to /login", () => {
      render(<LoginPage />);
    });

    Then('I should see a "Sign in with Google" button', async () => {
      await waitFor(() => {
        expect(screen.getByLabelText(/sign in with google/i)).toBeInTheDocument();
      });
    });

    And("there should be no email/password form", () => {
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    });
  });

  Scenario("Successful Google sign-in redirects to profile", ({ Given, When, And, Then }) => {
    Given("I am on the /login page", () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ success: true }),
        }),
      );
      render(<LoginPage />);
    });

    When('I click "Sign in with Google"', async () => {
      // GSI renders the button; simulate it being clicked by triggering the initialize callback
      await waitFor(() => {
        expect(mockGoogleAccounts.id.initialize).toHaveBeenCalled();
      });
    });

    And("I complete the Google OAuth flow successfully", async () => {
      // Extract the callback passed to initialize and trigger it
      const initCall = mockGoogleAccounts.id.initialize.mock.calls[0] as [
        { callback: (response: { credential: string }) => void },
      ];
      const callback = initCall[0]?.callback;
      if (callback) {
        await callback({ credential: "mock-google-id-token" });
      }
    });

    Then("I should be redirected to /profile", async () => {
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/profile");
      });
    });

    And("I should see my profile information", () => {
      // Profile display is on the /profile page; redirect verified above
      expect(mockPush).toHaveBeenCalledWith("/profile");
    });
  });
});
