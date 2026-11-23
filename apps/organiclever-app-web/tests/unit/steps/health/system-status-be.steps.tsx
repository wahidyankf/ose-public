/**
 * Step definitions for the BE Status Page feature.
 *
 * Covers: specs/apps/organiclever/app-web/behaviours/health/system-status-be.feature
 *
 * Tests BeStatusPage directly as an async server component rendered in jsdom.
 * Mocks fetch via vi.stubGlobal and env vars via vi.stubEnv.
 */
import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { render, screen, cleanup } from "@testing-library/react";
import { vi, expect } from "vitest";

const testEnv = vi.hoisted(() => ({
  ORGANICLEVER_BE_URL: undefined as string | undefined,
}));

vi.mock("@/env", () => ({
  env: testEnv,
}));

import BeStatusPage, { metadata } from "@/app/system/status/be/page";

const feature = await loadFeature(
  path.resolve(
    __dirname,
    "../../../../../../specs/apps/organiclever/app-web/behaviours/health/system-status-be.feature",
  ),
);

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  let renderedMain: HTMLElement | null = null;
  let crawledRobots: typeof metadata.robots | undefined;

  AfterEachScenario(() => {
    cleanup();
    testEnv.ORGANICLEVER_BE_URL = undefined;
    vi.unstubAllGlobals();
    renderedMain = null;
    crawledRobots = undefined;
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/health/system-status-be.feature: BE status page shows Not Configured when env unset
  Scenario("BE status page shows Not Configured when env unset", ({ Given, When, Then, And }) => {
    Given("ORGANICLEVER_BE_URL is unset", () => {
      testEnv.ORGANICLEVER_BE_URL = undefined;
    });

    When("a visitor requests GET /system/status/be", async () => {
      const jsx = await BeStatusPage();
      render(jsx);
      renderedMain = screen.getByRole("main");
    });

    Then("the response status is 200", () => {
      expect(renderedMain).toBeVisible();
    });

    And('the body contains "Not configured"', () => {
      expect(screen.getByText(/Not configured/i)).toBeInTheDocument();
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/health/system-status-be.feature: Backend health-check page is excluded from search indexes
  Scenario("Backend health-check page is excluded from search indexes", ({ When, Then }) => {
    When("a crawler requests GET /system/status/be", () => {
      crawledRobots = metadata.robots;
    });

    Then("the response declares the page non-indexable", () => {
      expect(crawledRobots).toMatchObject({ index: false });
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/health/system-status-be.feature: BE status page shows UP when backend healthy
  Scenario("BE status page shows UP when backend healthy", ({ Given, When, Then, And }) => {
    Given('ORGANICLEVER_BE_URL is "http://be.example.test"', () => {
      testEnv.ORGANICLEVER_BE_URL = "http://be.example.test";
    });

    And('the backend health endpoint returns 200 with body {"status":"UP"}', () => {
      vi.stubGlobal(
        "fetch",
        vi.fn<(...args: unknown[]) => unknown>().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ status: "UP" }),
        }),
      );
    });

    When("a visitor requests GET /system/status/be", async () => {
      const jsx = await BeStatusPage();
      render(jsx);
      renderedMain = screen.getByRole("main");
    });

    Then("the response status is 200", () => {
      expect(renderedMain).toBeVisible();
    });

    And('the body contains "UP"', () => {
      expect(screen.getByText(/UP\s*—/)).toBeInTheDocument();
    });

    And("the body contains the backend URL", () => {
      expect(screen.getByText(/http:\/\/be\.example\.test/)).toBeInTheDocument();
    });
  });

  // @scenario specs/apps/organiclever/app-web/behaviours/health/system-status-be.feature: BE status page shows DOWN with the failure reason when backend unreachable
  Scenario(
    "BE status page shows DOWN with the failure reason when backend unreachable",
    ({ Given, When, Then, And }) => {
      Given('ORGANICLEVER_BE_URL is "http://be.example.test"', () => {
        testEnv.ORGANICLEVER_BE_URL = "http://be.example.test";
      });

      And("the backend health endpoint fails with connection refused", () => {
        vi.stubGlobal(
          "fetch",
          vi.fn<(...args: unknown[]) => unknown>().mockRejectedValue(new TypeError("fetch failed")),
        );
      });

      When("a visitor requests GET /system/status/be", async () => {
        const jsx = await BeStatusPage();
        render(jsx);
        renderedMain = screen.getByRole("main");
      });

      Then("the response status is 200", () => {
        expect(renderedMain).toBeVisible();
      });

      And('the body contains "DOWN"', () => {
        expect(screen.getByText(/DOWN/)).toBeInTheDocument();
      });

      And("the body contains the failure reason", () => {
        expect(screen.getByText(/fetch failed/i)).toBeInTheDocument();
      });
    },
  );

  // @scenario specs/apps/organiclever/app-web/behaviours/health/system-status-be.feature: BE status page shows DOWN with the HTTP status when the backend answers with an error status
  Scenario(
    "BE status page shows DOWN with the HTTP status when the backend answers with an error status",
    ({ Given, When, Then, And }) => {
      Given('ORGANICLEVER_BE_URL is "http://be.example.test"', () => {
        testEnv.ORGANICLEVER_BE_URL = "http://be.example.test";
      });

      And("the backend health endpoint answers with HTTP status 503", () => {
        vi.stubGlobal("fetch", vi.fn<(...args: unknown[]) => unknown>().mockResolvedValue({ ok: false, status: 503 }));
      });

      When("a visitor requests GET /system/status/be", async () => {
        const jsx = await BeStatusPage();
        render(jsx);
        renderedMain = screen.getByRole("main");
      });

      Then("the response status is 200", () => {
        expect(renderedMain).toBeVisible();
      });

      And('the body contains "DOWN"', () => {
        expect(screen.getByText(/DOWN/)).toBeInTheDocument();
      });

      And('the body contains "HTTP 503"', () => {
        expect(screen.getByText(/HTTP 503/)).toBeInTheDocument();
      });
    },
  );

  // @scenario specs/apps/organiclever/app-web/behaviours/health/system-status-be.feature: BE status page shows DOWN when backend times out
  Scenario("BE status page shows DOWN when backend times out", ({ Given, When, Then, And }) => {
    Given('ORGANICLEVER_BE_URL is "http://be.example.test"', () => {
      testEnv.ORGANICLEVER_BE_URL = "http://be.example.test";
    });

    And("the backend health endpoint does not respond within 3 seconds", () => {
      const timeoutError = Object.assign(new Error("TimeoutError: timeout exceeded"), {
        name: "TimeoutError",
      });
      vi.stubGlobal("fetch", vi.fn<(...args: unknown[]) => unknown>().mockRejectedValue(timeoutError));
    });

    When("a visitor requests GET /system/status/be", async () => {
      const jsx = await BeStatusPage();
      render(jsx);
      renderedMain = screen.getByRole("main");
    });

    Then("the response status is 200", () => {
      expect(renderedMain).toBeVisible();
    });

    And('the body contains "DOWN"', () => {
      expect(screen.getByText(/DOWN/)).toBeInTheDocument();
    });

    And('the body contains "timeout"', () => {
      expect(screen.getByText(/timeout/i)).toBeInTheDocument();
    });
  });
});
