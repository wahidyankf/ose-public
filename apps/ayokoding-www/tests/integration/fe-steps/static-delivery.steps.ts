import fs from "node:fs/promises";
import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import {
  inspectPrerenderManifest,
  MINIMUM_PRERENDERED_ROUTE_COUNT,
  TRPC_RUNTIME_TRACED_ASSETS,
  type PrerenderManifestLike,
} from "@/features/content/core/static-delivery";
import { integrationCaller } from "../be-steps/helpers/integration-caller";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/content/static-delivery.feature"),
);

describeFeature(
  feature,
  ({ Background, Scenario }) => {
    Background(({ Given }) => {
      Given("the app is running", async () => {
        await expect(integrationCaller.meta.health()).resolves.toEqual({ status: "ok" });
      });
    });

    Scenario("A content page is prerendered at build time", ({ Given, When, Then, And }) => {
      let manifest: PrerenderManifestLike;
      let inspection: ReturnType<typeof inspectPrerenderManifest>;
      const manifestPath = path.resolve(process.cwd(), ".next/prerender-manifest.json");

      Given("the ayokoding-www site is built and deployed", async () => {
        await expect(fs.stat(manifestPath)).resolves.toMatchObject({ size: expect.any(Number) });
      });
      When("the build output manifest is inspected", async () => {
        manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as PrerenderManifestLike;
        inspection = inspectPrerenderManifest(manifest, "/en/learn/courses/backend-essentials/overview");
      });
      Then("the prerendered route count is at least two thousand", () => {
        expect(inspection.routeCount).toBeGreaterThanOrEqual(MINIMUM_PRERENDERED_ROUTE_COUNT);
      });
      And("the inspected content route is present in the static route manifest", () => {
        expect(inspection.contentRouteIsPrerendered).toBe(true);
      });
    });

    Scenario("Runtime tRPC endpoints retain their filesystem assets", ({ Given, When, Then }) => {
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
    });
  },
  { excludeTags: ["integration-exempt"] },
);
