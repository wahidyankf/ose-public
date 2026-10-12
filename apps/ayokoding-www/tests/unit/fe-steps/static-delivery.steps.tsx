import path from "node:path";
import type { ReactElement } from "react";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, vi } from "vitest";

vi.mock("@/env", () => ({
  env: {
    AYOKODING_WEB_CONTENT_DIR: undefined,
    AYOKODING_WEB_SHOW_DRAFTS: undefined,
    AYOKODING_WEB_MANIFESTS_DIR: undefined,
  },
}));
vi.mock("@/features/course-paths/shell/route-path-data", () => ({
  loadRoutePathData: vi.fn(async () => ({
    contentMap: new Map(),
    manifests: [],
    prerequisitesByCourse: {},
    libraryCourseIds: [],
    outlineCourseIds: [],
  })),
}));

import {
  contentCacheRule,
  inspectPrerenderManifest,
  MINIMUM_PRERENDERED_ROUTE_COUNT,
  TRPC_RUNTIME_TRACED_ASSETS,
  type PrerenderManifestLike,
} from "@/features/content/core/static-delivery";
import LocaleLayout from "@/app/[locale]/layout";
import { testCaller } from "../be-steps/helpers/test-caller";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/content/static-delivery.feature"),
);

describeFeature(feature, ({ Background, Scenario, ScenarioOutline }) => {
  Background(({ Given }) => {
    Given("the app is running", async () => {
      await expect(testCaller.meta.health()).resolves.toEqual({ status: "ok" });
    });
  });

  Scenario("A content page is prerendered at build time", ({ Given, When, Then, And }) => {
    let inspection: ReturnType<typeof inspectPrerenderManifest>;
    let manifest: PrerenderManifestLike;
    Given("the ayokoding-www site is built and deployed", () => {
      manifest = {
        routes: Object.fromEntries(
          Array.from({ length: MINIMUM_PRERENDERED_ROUTE_COUNT }, (_, index) => [
            index === 0 ? "/en/learn/overview" : `/en/learn/generated-${index}`,
            {},
          ]),
        ),
        dynamicRoutes: {},
      };
      expect(manifest.routes).toHaveProperty("/en/learn/overview");
    });
    When("the build output manifest is inspected", () => {
      inspection = inspectPrerenderManifest(manifest, "/en/learn/overview");
    });
    Then("the prerendered route count is at least two thousand", () => {
      expect(inspection.routeCount).toBeGreaterThanOrEqual(MINIMUM_PRERENDERED_ROUTE_COUNT);
    });
    And("the inspected content route is present in the static route manifest", () => {
      expect(inspection.contentRouteIsPrerendered).toBe(true);
    });
  });

  Scenario("A repeat request to a content page remains cacheable", ({ Given, When, Then }) => {
    let lessonUrl: string;
    let repeatResponseHeaders: Record<string, string>;
    Given("a visitor has already requested a course lesson URL", () => {
      lessonUrl = "/en/learn/overview";
    });
    When("the same URL is requested again", () => {
      const rule = contentCacheRule();
      expect(lessonUrl).toMatch(/^\/(en|id)\/.+/u);
      expect(rule.source).toBe("/:locale(en|id)/:path*");
      repeatResponseHeaders = Object.fromEntries(rule.headers.map(({ key, value }) => [key.toLowerCase(), value]));
    });
    Then("the response does not carry a no-store cache directive", () => {
      expect(repeatResponseHeaders["cache-control"]).toBe("public, max-age=0, must-revalidate");
      expect(repeatResponseHeaders["cache-control"]).not.toMatch(/\bno-store\b/iu);
    });
  });

  Scenario("Runtime tRPC endpoints retain their filesystem assets", ({ Given, When, Then }) => {
    let endpointResponses: unknown[];
    Given("the ayokoding-www standalone package is running", async () => {
      await expect(testCaller.meta.health()).resolves.toEqual({ status: "ok" });
    });
    When("navigation search and course-path data are requested through tRPC", async () => {
      endpointResponses = await Promise.all([
        testCaller.content.getTree({ locale: "en" }),
        testCaller.search.query({ query: "programming", locale: "en" }),
        testCaller.coursePaths.getRouteData("en"),
      ]);
    });
    Then("every runtime data endpoint responds successfully", () => {
      expect(endpointResponses).toHaveLength(3);
      expect(endpointResponses.every((response) => response !== undefined)).toBe(true);
      expect(TRPC_RUNTIME_TRACED_ASSETS).toEqual([
        "./content/**/*",
        "./generated/**/*",
        "./src/features/course-paths/manifests/**/*",
      ]);
    });
  });

  ScenarioOutline("The document language reflects the localized page locale", ({ Given, When, Then }, variables) => {
    let locale: "en" | "id";
    let renderedDocument: ReactElement<{ lang: string }>;
    Given('a visitor opens a localized page in the "<locale>" locale', () => {
      locale = String(variables.locale) as "en" | "id";
    });
    When("the localized page renders", async () => {
      renderedDocument = (await LocaleLayout({
        children: <p>Localized content</p>,
        params: Promise.resolve({ locale }),
      })) as ReactElement<{ lang: string }>;
    });
    Then('the html element declares the "<language_code>" language code', () => {
      expect(renderedDocument.type).toBe("html");
      expect(renderedDocument.props.lang).toBe(String(variables.language_code));
    });
  });
});
