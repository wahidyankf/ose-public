import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";
import type { PathManifest } from "@/features/course-paths/core/schemas";

// course-paths plan (ayokoding-learning-path-03-navigation-ui), Cycle 3.1b-ii — step binding for
// skills-fixed-arc-statement.feature, reusing the skills fixture already proven in
// category-landing.test.tsx.

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { CategoryLanding } from "@/features/course-paths/shell/category-landing";
import { manifestFixture } from "../features/course-paths/manifest-fixture";

const subjectA: PathManifest = manifestFixture({
  pathId: "skills/subject-a",
  arc: "track-a",
  title: "Subject A",
  description: "desc",
});
const subjectB: PathManifest = manifestFixture({
  pathId: "skills/subject-b",
  arc: "track-b",
  title: "Subject B",
  description: "desc",
});

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/skills-fixed-arc-statement.feature",
  ),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario("The skills category landing states its fixed arc once, with no chooser", ({ Given, When, Then, And }) => {
    Given("a fixture skills manifest set is loaded", () => {
      expect([subjectA, subjectB].every(({ pathId }) => pathId.startsWith("skills/"))).toBe(true);
    });

    When("a reader opens the skills category landing at /en/learn/paths/skills/", () => {
      cleanup();
      render(<CategoryLanding locale="en" category="skills" manifests={[subjectA, subjectB]} />);
    });

    Then("the page renders the ramp promise once as a statement, not a question", () => {
      expect(screen.getByRole("navigation", { name: "Skills paths" })).toBeTruthy();
    });

    And("no arc-selection control is present anywhere on the page", () => {
      expect(screen.queryByRole("navigation", { name: "Careers arcs" })).toBeNull();
      expect(screen.queryByRole("combobox")).toBeNull();
      expect(screen.queryByRole("radiogroup")).toBeNull();
    });
  });
});
