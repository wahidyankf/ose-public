import React from "react";
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { vi, expect } from "vitest";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/fe/gherkin/authentication/profile.feature"),
);

const mockProfile = {
  name: "Alice Smith",
  email: "alice@example.com",
  avatarUrl: "https://lh3.googleusercontent.com/photo.jpg",
};

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "mock-access-token" }),
  }),
}));

// Mock BackendClientLive using async factory so vi.importActual works for path alias resolution
vi.mock("@/layers/backend-client-live", async () => {
  const { Effect, Layer } = await vi.importActual<typeof import("effect")>("effect");
  const { BackendClient } =
    await vi.importActual<typeof import("@/services/backend-client")>("@/services/backend-client");
  const MockBackendClientLive = Layer.succeed(
    BackendClient,
    BackendClient.of({
      get: () => Effect.succeed(undefined),
      post: () => Effect.succeed(undefined),
    }),
  );
  return { BackendClientLive: MockBackendClientLive };
});

vi.mock("effect", async (importOriginal) => {
  const actual = await importOriginal<typeof import("effect")>();
  return {
    ...actual,
    Effect: {
      ...actual.Effect,
      runPromiseExit: vi.fn().mockResolvedValue({
        _tag: "Success",
        value: {
          name: "Alice Smith",
          email: "alice@example.com",
          avatarUrl: "https://lh3.googleusercontent.com/photo.jpg",
        },
      }),
    },
    Exit: {
      isSuccess: (exit: { _tag: string }) => exit._tag === "Success",
    },
  };
});

vi.mock("@/services/auth-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/auth-service")>();
  return { ...actual };
});

vi.mock("@open-sharia-enterprise/ts-ui", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  Button: ({
    children,
    type,
    className,
  }: {
    children: React.ReactNode;
    type?: string;
    className?: string;
    variant?: string;
  }) => (
    <button type={type as "submit" | "button" | "reset"} className={className}>
      {children}
    </button>
  ),
}));

// Import after mocks are set up
const { default: ProfilePage } = await import("@/app/profile/page");

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given, And }) => {
    Given("the app is running", () => {
      cleanup();
    });

    And("I am logged in via Google OAuth", () => {
      // Handled by mock cookies returning a valid access token
    });
  });

  Scenario("Profile page displays user information", ({ When, Then, And }) => {
    When("I navigate to /profile", async () => {
      const jsx = await ProfilePage();
      render(jsx as React.ReactElement);
      await waitFor(() => {
        expect(screen.getByText(mockProfile.name)).toBeInTheDocument();
      });
    });

    Then("I should see my name", () => {
      expect(screen.getByText(mockProfile.name)).toBeInTheDocument();
    });

    And("I should see my email address", () => {
      expect(screen.getByText(mockProfile.email)).toBeInTheDocument();
    });

    And("I should see my profile avatar", () => {
      const avatar = screen.getByRole("img");
      expect(avatar).toHaveAttribute("src", mockProfile.avatarUrl);
    });
  });

  Scenario("Profile page shows data from Google account", ({ When, Then, And }) => {
    When("I navigate to /profile", async () => {
      const jsx = await ProfilePage();
      render(jsx as React.ReactElement);
      await waitFor(() => {
        expect(screen.getByText(mockProfile.name)).toBeInTheDocument();
      });
    });

    Then("the displayed name should match my Google account name", () => {
      expect(screen.getByText(mockProfile.name)).toBeInTheDocument();
    });

    And("the displayed email should match my Google account email", () => {
      expect(screen.getByText(mockProfile.email)).toBeInTheDocument();
    });

    And("the displayed avatar should match my Google account avatar", () => {
      const avatar = screen.getByRole("img");
      expect(avatar).toHaveAttribute("src", mockProfile.avatarUrl);
    });
  });
});
