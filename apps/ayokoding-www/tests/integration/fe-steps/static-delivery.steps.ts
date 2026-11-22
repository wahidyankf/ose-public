import fs from "node:fs/promises";
import path from "node:path";
import { createElement, type ReactElement } from "react";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import LocaleLayout from "@/app/[locale]/layout";
import {
  contentCacheRule,
  inspectPrerenderManifest,
  MINIMUM_PRERENDERED_ROUTE_COUNT,
  TRPC_RUNTIME_TRACED_ASSETS,
  type PrerenderManifestLike,
} from "@/features/content/core/static-delivery";
import { integrationCaller } from "../be-steps/helpers/integration-caller";
import { configuredHeadersFor, routeSourcePattern } from "../be-steps/helpers/next-config-delivery";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/content/static-delivery.feature"),
);

const LESSON_URL = "/en/learn/courses/backend-essentials/overview";

describeFeature(feature, ({ Background, Scenario, ScenarioOutline }) => {
  Background(({ Given }) => {
    Given("the app is running", async () => {
      await expect(integrationCaller.meta.health()).resolves.toEqual({ status: "ok" });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/content/static-delivery.feature: A content page is prerendered at build time
  Scenario("A content page is prerendered at build time", ({ Given, When, Then, And }) => {
    let manifest: PrerenderManifestLike;
    let inspection: ReturnType<typeof inspectPrerenderManifest>;
    const manifestPath = path.resolve(process.cwd(), ".next/prerender-manifest.json");

    Given("the ayokoding-www site is built and deployed", async () => {
      await expect(fs.stat(manifestPath)).resolves.toMatchObject({ size: expect.any(Number) });
    });
    When("the build output manifest is inspected", async () => {
      manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as PrerenderManifestLike;
      inspection = inspectPrerenderManifest(manifest, LESSON_URL);
    });
    Then("the prerendered route count is at least two thousand", () => {
      expect(inspection.routeCount).toBeGreaterThanOrEqual(MINIMUM_PRERENDERED_ROUTE_COUNT);
    });
    And("the inspected content route is present in the static route manifest", () => {
      expect(inspection.contentRouteIsPrerendered).toBe(true);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/content/static-delivery.feature: A repeat request to a content page remains cacheable
  Scenario("A repeat request to a content page remains cacheable", ({ Given, When, Then }) => {
    let firstHeaders: Map<string, string>;
    let repeatHeaders: Map<string, string>;
    Given("a visitor has already requested a course lesson URL", async () => {
      expect(routeSourcePattern(contentCacheRule().source).test(LESSON_URL)).toBe(true);
      firstHeaders = await configuredHeadersFor(LESSON_URL);
    });
    When("the same URL is requested again", async () => {
      repeatHeaders = await configuredHeadersFor(LESSON_URL);
    });
    Then("the response does not carry a no-store cache directive", () => {
      expect(repeatHeaders.get("cache-control")).toBe("public, max-age=0, must-revalidate");
      expect(repeatHeaders.get("cache-control")).toBe(firstHeaders.get("cache-control"));
      expect(repeatHeaders.get("cache-control")).not.toMatch(/\bno-store\b/iu);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/content/static-delivery.feature: The packaged site answers its navigation, search, and course-path requests successfully
  Scenario(
    "The packaged site answers its navigation, search, and course-path requests successfully",
    ({ Given, When, Then }) => {
      let results: unknown[];
      Given("the ayokoding-www standalone package is running", async () => {
        const nextConfig = await fs.readFile(path.resolve(process.cwd(), "next.config.ts"), "utf8");
        expect(nextConfig).toContain('output: "standalone"');
        expect(nextConfig).toContain("TRPC_RUNTIME_TRACED_ASSETS");
        expect((await fs.stat(path.resolve(process.cwd(), "content"))).isDirectory()).toBe(true);
        expect((await fs.stat(path.resolve(process.cwd(), "generated"))).isDirectory()).toBe(true);
        expect(TRPC_RUNTIME_TRACED_ASSETS).toHaveLength(3);
      });
      When("navigation search and course-path data are requested through tRPC", async () => {
        results = await Promise.all([
          integrationCaller.content.getTree({ locale: "en" }),
          integrationCaller.search.query({ locale: "en", query: "AyoKoding" }),
          integrationCaller.coursePaths.getRouteData("en"),
        ]);
      });
      Then("every runtime data endpoint responds successfully", () => {
        expect(results).toHaveLength(3);
        expect(results[0]).toEqual(expect.any(Array));
        expect(results[1]).toEqual(expect.any(Array));
        expect(results[2]).toEqual(expect.anything());
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/content/static-delivery.feature: The document language reflects the localized page locale
  ScenarioOutline("The document language reflects the localized page locale", ({ Given, When, Then }, variables) => {
    let locale: string;
    let renderedDocument: ReactElement<{ lang: string }>;
    Given('a visitor opens a localized page in the "<locale>" locale', () => {
      locale = String(variables.locale);
    });
    When("the localized page renders", async () => {
      renderedDocument = (await LocaleLayout({
        children: createElement("p", null, "Localized content"),
        params: Promise.resolve({ locale }),
      })) as ReactElement<{ lang: string }>;
    });
    Then('the html element declares the "<language_code>" language code', () => {
      expect(renderedDocument.type).toBe("html");
      expect(renderedDocument.props.lang).toBe(String(variables.language_code));
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/content/static-delivery.feature: Pages are served with security headers, including frame denial and a content security policy
  Scenario(
    "Pages are served with security headers, including frame denial and a content security policy",
    ({ Given, Then, And }) => {
      let pageHeaders: Map<string, string>;
      Given("a visitor requests any page of the site", async () => {
        pageHeaders = await configuredHeadersFor(LESSON_URL);
      });
      Then("the response refuses to be framed by other sites", () => {
        expect(pageHeaders.get("x-frame-options")).toBe("DENY");
      });
      And("the response declares a content security policy", () => {
        expect(pageHeaders.get("content-security-policy")).toContain("default-src 'self'");
      });
    },
  );
});
