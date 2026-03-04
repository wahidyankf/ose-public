import React, { Suspense } from "react";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup, waitFor, act } from "@testing-library/react/pure";
import { vi, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { AUTHENTICATED } from "../helpers/auth-mock";
import { server } from "../server";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => "/dashboard/members/1"),
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
import MemberDetailPage from "@/app/dashboard/members/[id]/page";

const feature = await loadFeature("../../specs/organiclever-web/members/member-detail.feature");

describeFeature(feature, ({ Scenario, BeforeEachScenario, AfterEachScenario }) => {
  BeforeEachScenario(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ ...AUTHENTICATED });
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  AfterEachScenario(() => {
    cleanup();
  });

  Scenario("Member detail page displays all member fields", ({ Given, When, Then, And }) => {
    Given("a user is logged in", () => {
      vi.mocked(useAuth).mockReturnValue({ ...AUTHENTICATED });
    });

    When("the user navigates to the detail page for member 1", async () => {
      await act(async () => {
        render(
          <Suspense fallback={null}>
            <MemberDetailPage params={Promise.resolve({ id: "1" })} />
          </Suspense>,
        );
      });
      await screen.findByText("Alice Johnson", {}, { timeout: 3000 });
    });

    Then('the page should display the name "Alice Johnson"', () => {
      expect(screen.getByText("Alice Johnson")).toBeTruthy();
    });

    And('the page should display the role "Senior Software Engineers"', () => {
      expect(screen.getByText(/senior software engineers/i)).toBeTruthy();
    });

    And('the page should display the email "alice@example.com"', () => {
      expect(screen.getByText("alice@example.com")).toBeTruthy();
    });

    And('the page should display a GitHub link for "alicejohnson"', () => {
      expect(screen.getByRole("link", { name: "alicejohnson" })).toBeTruthy();
    });
  });

  Scenario("Navigating to a non-existent member redirects to the members list", ({ Given, When, Then }) => {
    let mockPush: ReturnType<typeof vi.fn>;

    Given("a user is logged in", () => {
      mockPush = vi.fn();
      vi.mocked(useAuth).mockReturnValue({ ...AUTHENTICATED });
      vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
    });

    When("the user navigates to the detail page for a member id that does not exist", async () => {
      server.use(http.get("/api/members/99999", () => new HttpResponse(null, { status: 404 })));
      await act(async () => {
        render(
          <Suspense fallback={null}>
            <MemberDetailPage params={Promise.resolve({ id: "99999" })} />
          </Suspense>,
        );
      });
    });

    Then("the user should be redirected to the members list page", async () => {
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard/members"));
    });
  });
});
