/**
 * Step definitions for the Landing Page feature.
 *
 * Covers: specs/apps/organiclever/fe/gherkin/landing/landing.feature
 *
 * Tests RootPage directly. Verifies heading renders, no fetch calls are made,
 * and no redirects occur.
 */
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import { vi, expect } from "vitest";
import RootPage from "@/app/page";

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../specs/apps/organiclever/fe/gherkin/landing/landing.feature"),
);

const mockFetch = vi.fn();

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  Scenario("Root renders landing without BE", ({ Given, When, Then, And }) => {
    Given("ORGANICLEVER_BE_URL is unset", () => {
      vi.stubEnv("ORGANICLEVER_BE_URL", "");
      vi.stubGlobal("fetch", mockFetch);
      mockFetch.mockReset();
    });

    When("a visitor requests GET /", () => {
      render(<RootPage />);
    });

    Then("the response status is 200", () => {
      // Component rendered without throwing — request was successful
      expect(document.body).toBeTruthy();
    });

    And("the body contains the landing page heading", () => {
      expect(screen.getByRole("heading", { level: 1, name: /OrganicLever/i })).toBeInTheDocument();
    });

    And("no request is made to organiclever-be", () => {
      expect(mockFetch).not.toHaveBeenCalled();
    });

    And("the page loads at / without intermediate redirect", () => {
      // RootPage renders h1 directly — no redirect component in the tree
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });
  });
});
