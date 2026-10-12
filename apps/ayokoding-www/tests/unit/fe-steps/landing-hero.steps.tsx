import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import { manifestFixture } from "../features/course-paths/manifest-fixture";

// course-paths plan (ayokoding-learning-path-03-navigation-ui), Cycle 3.2 — step binding for
// landing-hero.feature, reusing the fixture already proven in landing.test.tsx.

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { Landing } from "@/features/app-shell/shell/landing";

function manifest(pathId: string, arc: string, title: string): PathManifest {
  return manifestFixture({ pathId, arc, title, description: `${title} description`, courses: ["just-enough-python"] });
}

const heroManifests: PathManifest[] = [
  manifest("careers/interview-ready/backend-track", "interview-ready", "Backend Track"),
  manifest("careers/immediately-effective/frontend-track", "immediately-effective", "Frontend Track"),
];

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/landing-hero.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario("The landing hero surfaces the four goal paths directly", ({ Given, When, Then, And }) => {
    Given("a first-time visitor opens the site landing page at /en", () => {
      expect(heroManifests.map(({ pathId }) => pathId)).toEqual([
        "careers/interview-ready/backend-track",
        "careers/immediately-effective/frontend-track",
      ]);
    });

    When("the hero section renders", () => {
      cleanup();
      render(<Landing locale="en" sections={[]} manifests={heroManifests} />);
    });

    Then("the hero shows a goal-labeled path card for each published path", () => {
      expect(screen.getByRole("link", { name: /Start the Backend Track path/ })).toBeTruthy();
      expect(screen.getByRole("link", { name: /Start the Frontend Track path/ })).toBeTruthy();
    });

    And('a "Compare all paths" link to /en/learn/paths is visible below the cards', () => {
      expect(screen.getByRole("link", { name: "Compare all paths →" }).getAttribute("href")).toBe("/en/learn/paths");
    });
  });
});
