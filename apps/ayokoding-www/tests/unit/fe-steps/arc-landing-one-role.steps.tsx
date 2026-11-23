import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen, within } from "@testing-library/react";
import { expect, vi } from "vitest";
import type { PathManifest } from "@/features/course-paths/core/schemas";

// course-paths plan (ayokoding-learning-path-03-navigation-ui), Cycles 3.1c-i and 3.1c-ii — the one
// outline binds the single-role fixture (arc-landing.test.tsx) and the two-role fixture, merged into
// one group scenario (MG-A) so each role count keeps its own assertions.

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

const roleA: PathManifest = manifestFixture({
  pathId: "careers/immediately-effective/role-a",
  arc: "immediately-effective",
  title: "Role A",
  description: "desc",
  courses: ["just-enough-python", "just-enough-bash"],
});
const roleB: PathManifest = manifestFixture({
  pathId: "careers/immediately-effective/role-b",
  arc: "immediately-effective",
  title: "Role B",
  description: "desc",
  courses: ["just-enough-python"],
});

const courseTitles = {
  "just-enough-python": "Just Enough Python",
  "just-enough-bash": "Just Enough Bash",
};

const courseCards = {
  "just-enough-python": { title: "Just Enough Python", estimatedHours: 3, isOutline: false },
  "just-enough-bash": { title: "Just Enough Bash", estimatedHours: 4, isOutline: false },
};

const sequences = {
  "just-enough-python": ["learning/overview"],
  "just-enough-bash": ["learning/overview"],
};

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/arc-landing-one-role.feature",
  ),
);

describeFeature(feature, ({ ScenarioOutline }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/arc-landing-one-role.feature: An arc landing renders one full card per role
  ScenarioOutline("An arc landing renders one full card per role", ({ Given, When, Then, And }, variables) => {
    let manifests: PathManifest[];
    let roles: number;

    Given("a fixture arc manifest lists <roles> role(s)", () => {
      roles = Number(variables.roles);
      manifests = roles === 1 ? [soloRole] : [roleA, roleB];
      expect(manifests).toHaveLength(roles);
    });

    When("a reader opens that arc's landing page", () => {
      cleanup();
      render(
        roles === 1 ? (
          <ArcLanding locale="en" arc="interview-ready" manifests={manifests} courseTitles={courseTitles} />
        ) : (
          <ArcLanding
            locale="en"
            arc="immediately-effective"
            manifests={manifests}
            courseTitles={courseTitles}
            courseCards={courseCards}
            sequences={sequences}
          />
        ),
      );
    });

    Then("each role card renders in full with its own preview or course counts", () => {
      if (roles === 1) {
        expect(screen.getByText("Starts with Phase 1 · Phase A:", { exact: false })).toBeTruthy();
        expect(screen.getByText(/Just Enough Python/)).toBeTruthy();
        expect(screen.getByText(/Just Enough Bash/)).toBeTruthy();
        return;
      }
      const nav = within(screen.getByRole("navigation", { name: "immediately-effective paths" }));
      expect(nav.getAllByRole("listitem").length).toBe(2);
      // Each card states its own manifest's facts: role A's two core courses and their hours,
      // role B's one, never one shared value for both.
      const first = screen.getByRole("link", { name: "Role A" }).closest("li") as HTMLElement;
      const second = screen.getByRole("link", { name: "Role B" }).closest("li") as HTMLElement;
      expect(first.textContent).toContain("0 of 2 core courses done");
      expect(first.textContent).toContain("About 7 h");
      expect(first.textContent).not.toContain("0 of 1 core courses done");
      expect(second.textContent).toContain("0 of 1 core courses done");
      expect(second.textContent).toContain("About 3 h");
    });

    And("no role card is a placeholder or an empty grid cell", () => {
      // Count the top-level role-card <li> items directly (not `querySelectorAll("li")`, which
      // would also count the syllabus preview's own nested <li> items per course).
      const navName = roles === 1 ? "interview-ready paths" : "immediately-effective paths";
      const nav = screen.getByRole("navigation", { name: navName });
      expect(nav.querySelectorAll(":scope > ul > li").length).toBe(roles);
      if (roles === 2) {
        expect(within(nav).getAllByRole("link", { name: /View path/ }).length).toBe(2);
      }
    });
  });
});
