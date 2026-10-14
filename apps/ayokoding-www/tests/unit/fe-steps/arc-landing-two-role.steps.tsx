import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen, within } from "@testing-library/react";
import { expect, vi } from "vitest";
import type { PathManifest } from "@/features/course-paths/core/schemas";

// course-paths plan (ayokoding-learning-path-03-navigation-ui), Cycle 3.1c-i — step binding for
// arc-landing-two-role.feature, reusing the two-role fixture already proven in
// arc-landing.test.tsx. Updated in plan ayokoding-learn-revamp-04 Phase 7: each role now renders the
// shared `LearnPathCard`, whose own progress line states that role's own core-course count.

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
    "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/arc-landing-two-role.feature",
  ),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario(
    "An arc landing with two paths renders both role cards without a placeholder",
    ({ Given, When, Then, And }) => {
      Given("the fixture immediately-effective arc manifest lists two roles", () => {
        expect([roleA, roleB]).toHaveLength(2);
        expect(new Set([roleA.arc, roleB.arc])).toEqual(new Set(["immediately-effective"]));
      });

      When("a reader opens the arc landing at /en/learn/paths/careers/immediately-effective/", () => {
        cleanup();
        render(
          <ArcLanding
            locale="en"
            arc="immediately-effective"
            manifests={[roleA, roleB]}
            courseTitles={courseTitles}
            courseCards={courseCards}
            sequences={sequences}
          />,
        );
      });

      Then("both role cards render side by side with their own course counts", () => {
        const nav = within(screen.getByRole("navigation", { name: "immediately-effective paths" }));
        expect(nav.getAllByRole("listitem").length).toBe(2);

        // Each card states its own manifest's facts: role A's two core courses and their hours,
        // role B's one — never one shared value for both.
        const first = screen.getByRole("link", { name: "Role A" }).closest("li") as HTMLElement;
        const second = screen.getByRole("link", { name: "Role B" }).closest("li") as HTMLElement;
        expect(first.textContent).toContain("0 of 2 core courses done");
        expect(first.textContent).toContain("About 7 h");
        expect(first.textContent).not.toContain("0 of 1 core courses done");
        expect(second.textContent).toContain("0 of 1 core courses done");
        expect(second.textContent).toContain("About 3 h");
      });

      And("neither card is a placeholder or an empty grid cell", () => {
        const nav = screen.getByRole("navigation", { name: "immediately-effective paths" });
        expect(nav.querySelectorAll(":scope > ul > li").length).toBe(2);
        expect(within(nav).getAllByRole("link", { name: /View path/ }).length).toBe(2);
      });
    },
  );
});
