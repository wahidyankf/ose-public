import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";

// course-paths plan (ayokoding-learning-path-03-navigation-ui), Cycle 2.4 — step binding for
// prerequisite-display.feature, reusing the fixture already proven in prerequisite-list.test.tsx.

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { PrerequisiteList } from "@/features/course-paths/shell/prerequisite-list";
import type { PrerequisiteLink } from "@/features/course-paths/shell/course-path-nav";

const prerequisites: PrerequisiteLink[] = [
  { title: "Version Control and Git", slug: "learn/courses/version-control-and-git" },
];

// A course whose canonical metadata declares `prerequisites: []` (the Just Enough Python course).
const prerequisitesOfNoPrerequisiteCourse: PrerequisiteLink[] = [];

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/prerequisite-display.feature",
  ),
);

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/prerequisite-display.feature: A course page surfaces its declared prerequisites
  Scenario("A course page surfaces its declared prerequisites", ({ Given, When, Then, And }) => {
    Given("a course declares prerequisites in its canonical metadata", () => {
      expect(prerequisites).toEqual([
        { title: "Version Control and Git", slug: "learn/courses/version-control-and-git" },
      ]);
    });

    When("a reader opens the course page with or without a path context", () => {
      cleanup();
      render(
        <PrerequisiteList
          locale="en"
          prerequisites={[
            {
              ...prerequisites[0]!,
              pathId: "skills/python-fundamentals",
            },
          ]}
        />,
      );
    });

    Then("the page lists each prerequisite course with a link to its canonical URL", () => {
      expect(screen.getByRole("link", { name: "Version Control and Git" }).getAttribute("href")).toBe(
        "/en/learn/courses/version-control-and-git?path=skills/python-fundamentals",
      );
    });

    And("the prerequisite list renders even in the canonical no-path view", () => {
      cleanup();
      render(<PrerequisiteList locale="en" prerequisites={prerequisites} />);
      expect(screen.getByRole("link", { name: "Version Control and Git" }).getAttribute("href")).toBe(
        "/en/learn/courses/version-control-and-git",
      );
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/prerequisite-display.feature: A course that declares no prerequisites shows no prerequisites heading or list
  Scenario(
    "A course that declares no prerequisites shows no prerequisites heading or list",
    ({ Given, When, Then }) => {
      let rendered: HTMLElement;

      Given("the just-enough-python course page declares no prerequisites in its canonical metadata", () => {
        expect(prerequisitesOfNoPrerequisiteCourse).toEqual([]);
      });

      When("a reader opens the just-enough-python course page with or without a path context", () => {
        cleanup();
        rendered = render(
          <PrerequisiteList locale="en" prerequisites={prerequisitesOfNoPrerequisiteCourse} />,
        ).container;
      });

      Then('the page shows no "Prerequisites" heading and no prerequisites list', () => {
        expect(rendered.innerHTML).toBe("");
        expect(screen.queryByRole("navigation", { name: "Prerequisites" })).toBeNull();
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/prerequisite-display.feature: A prerequisite link keeps the path context only when that course belongs to the active path
  Scenario(
    "A prerequisite link keeps the path context only when that course belongs to the active path",
    ({ Given, When, Then, And }) => {
      let links: PrerequisiteLink[];

      Given(
        "a course in an active path declares two prerequisites, one that is in that path and one that is not",
        () => {
          // The path-aware nav sets `pathId` only on the link whose course is a member of the active path.
          links = [
            {
              title: "SQL Essentials",
              slug: "learn/courses/sql-essentials",
              pathId: "careers/immediately-effective/backend-track",
            },
            { title: "Just Enough Python", slug: "learn/courses/just-enough-python" },
          ];
        },
      );

      When("a reader opens the course page in that path context", () => {
        cleanup();
        render(<PrerequisiteList locale="en" prerequisites={links} />);
      });

      Then("the link to the prerequisite in the path keeps the path context", () => {
        expect(screen.getByRole("link", { name: "SQL Essentials" }).getAttribute("href")).toBe(
          "/en/learn/courses/sql-essentials?path=careers/immediately-effective/backend-track",
        );
      });

      And(
        "the link to the prerequisite outside the path opens its canonical course page without a path context",
        () => {
          expect(screen.getByRole("link", { name: "Just Enough Python" }).getAttribute("href")).toBe(
            "/en/learn/courses/just-enough-python",
          );
        },
      );
    },
  );
});
