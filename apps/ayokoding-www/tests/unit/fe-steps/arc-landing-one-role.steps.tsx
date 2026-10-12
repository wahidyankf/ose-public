import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";
import type { PathManifest } from "@/features/course-paths/core/schemas";

// course-paths plan (ayokoding-learning-path-03-navigation-ui), Cycle 3.1c-ii — step binding for
// arc-landing-one-role.feature, reusing the single-role fixture already proven in
// arc-landing.test.tsx.

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { ArcLanding } from "@/features/course-paths/shell/arc-landing";
import { manifestFixture } from "../features/course-paths/manifest-fixture";

const soloRole: PathManifest = manifestFixture({
  pathId: "careers/interview-ready/solo-role",
  arc: "interview-ready",
  title: "Solo Role",
  description: "desc",
  courses: ["just-enough-python", "just-enough-bash"],
});

const courseTitles = {
  "just-enough-python": "Just Enough Python",
  "just-enough-bash": "Just Enough Bash",
};

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/arc-landing-one-role.feature",
  ),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario("An arc landing with one path renders a full card, not a sparse stub", ({ Given, When, Then, And }) => {
    Given("a fixture arc manifest lists exactly one role", () => {
      expect([soloRole]).toHaveLength(1);
      expect(soloRole.arc).toBe("interview-ready");
    });

    When("a reader opens that arc's landing page", () => {
      cleanup();
      render(<ArcLanding locale="en" arc="interview-ready" manifests={[soloRole]} courseTitles={courseTitles} />);
    });

    Then("the single role card renders with an inline first-phase syllabus preview", () => {
      expect(screen.getByText(/Starts with:/i)).toBeTruthy();
      expect(screen.getByText(/Just Enough Python/)).toBeTruthy();
    });

    And("the layout does not reserve or render a visibly empty second card", () => {
      // Count the top-level role-card <li> items directly (not `querySelectorAll("li")`, which
      // would also count the syllabus preview's own nested <li> items per course).
      const nav = screen.getByRole("navigation", { name: "interview-ready paths" });
      const topLevelItems = nav.querySelectorAll(":scope > ul > li");
      expect(topLevelItems.length).toBe(1);
    });
  });
});
