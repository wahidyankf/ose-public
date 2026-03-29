import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { vi, expect } from "vitest";

const feature = await loadFeature(
  path.resolve(
    __dirname,
    "../../../../../../specs/apps/organiclever/fe/gherkin/authentication/route-protection.feature",
  ),
);

const mockRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const mockCookiesGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: mockCookiesGet,
  }),
}));

vi.mock("effect", async (importOriginal) => {
  const actual = await importOriginal<typeof import("effect")>();
  return {
    ...actual,
    Effect: {
      ...actual.Effect,
      runPromiseExit: vi.fn().mockResolvedValue({ _tag: "Failure" }),
    },
    Exit: {
      isSuccess: (exit: { _tag: string }) => exit._tag === "Success",
    },
  };
});

vi.mock("@/services/auth-service", () => ({
  AuthService: { of: vi.fn() },
  AuthServiceLive: {},
}));

vi.mock("@/layers/backend-client-live", () => ({
  BackendClientLive: {},
}));

vi.mock("@open-sharia-enterprise/ts-ui", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {
      mockRedirect.mockClear();
      mockCookiesGet.mockReset();
    });
  });

  Scenario("Unauthenticated user is redirected from profile to login", ({ Given, When, Then }) => {
    Given("I am not logged in", () => {
      mockCookiesGet.mockReturnValue(undefined);
    });

    When("I navigate to /profile", async () => {
      const { default: ProfilePage } = await import("@/app/profile/page");
      try {
        await ProfilePage();
      } catch {
        // redirect() throws in Next.js server components
      }
    });

    Then("I should be redirected to /login", () => {
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });
  });

  Scenario("Authenticated user can access profile page", ({ Given, When, Then }) => {
    Given("I am logged in via Google OAuth", () => {
      mockCookiesGet.mockReturnValue({ value: "mock-access-token" });
    });

    When("I navigate to /profile", async () => {
      vi.mocked(
        (await import("effect")).Effect.runPromiseExit,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ).mockResolvedValueOnce({
        _tag: "Success",
        value: { name: "Alice", email: "alice@example.com", avatarUrl: "" },
      } as any);
      const { default: ProfilePage } = await import("@/app/profile/page");
      try {
        await ProfilePage();
      } catch {
        // redirect() may throw
      }
    });

    Then("I should see the profile page", () => {
      expect(mockRedirect).not.toHaveBeenCalledWith("/login");
    });
  });

  Scenario("Root page redirects authenticated user to profile", ({ Given, When, Then }) => {
    Given("I am logged in via Google OAuth", () => {
      mockCookiesGet.mockReturnValue({ value: "mock-access-token" });
    });

    When("I navigate to /", async () => {
      const { default: RootPage } = await import("@/app/page");
      try {
        await RootPage();
      } catch {
        // redirect() throws
      }
    });

    Then("I should be redirected to /profile", () => {
      expect(mockRedirect).toHaveBeenCalledWith("/profile");
    });
  });

  Scenario("Root page redirects unauthenticated user to login", ({ Given, When, Then }) => {
    Given("I am not logged in", () => {
      mockCookiesGet.mockReturnValue(undefined);
    });

    When("I navigate to /", async () => {
      const { default: RootPage } = await import("@/app/page");
      try {
        await RootPage();
      } catch {
        // redirect() throws
      }
    });

    Then("I should be redirected to /login", () => {
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });
  });
});
