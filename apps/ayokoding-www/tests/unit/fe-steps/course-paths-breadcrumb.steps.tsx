import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { Breadcrumb } from "@/features/navigation/shell/breadcrumb";

const courseSegments = [
  { label: "Home", slug: "" },
  { label: "Browse", slug: "browse", href: "/en/browse" },
  { label: "Learn", slug: "learn" },
  { label: "Courses", slug: "learn/courses" },
  { label: "Just Enough Python", slug: "learn/courses/just-enough-python" },
];

const pathContext = {
  pathId: "skills/python-fundamentals",
  pathTitle: "Python Fundamentals",
  learnLabel: "Learn",
  learnHref: "/en/browse",
};

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/breadcrumb.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/breadcrumb.feature: The breadcrumb reflects the active path
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/breadcrumb.feature: The breadcrumb reflects the active path
  Scenario("The breadcrumb reflects the active path", ({ Given, When, Then, And }) => {
    Given("a reader is on a course with an active path context", () => {
      expect(pathContext.pathId).toBe("skills/python-fundamentals");
      expect(courseSegments.at(-1)?.slug).toBe("learn/courses/just-enough-python");
    });

    When("the breadcrumb renders", () => {
      cleanup();
      render(
        <Breadcrumb
          locale="en"
          slug="learn/courses/just-enough-python"
          segments={courseSegments}
          showCurrent
          pathContext={pathContext}
        />,
      );
    });

    Then("it shows Home, Learn, the path title, and the course title", () => {
      expect(screen.getByRole("link", { name: "Home" })).toBeTruthy();
      expect(screen.getByRole("link", { name: "Learn" })).toBeTruthy();
      expect(screen.getByRole("link", { name: "Python Fundamentals" })).toBeTruthy();
      const current = screen.getByText("Just Enough Python");
      expect(current.getAttribute("aria-current")).toBe("page");
    });

    And(
      "the path crumb links to the path landing page /en/learn/paths/<path-id> without a self-referential path context query",
      () => {
        expect(screen.getByRole("link", { name: "Python Fundamentals" }).getAttribute("href")).toBe(
          "/en/learn/paths/skills/python-fundamentals",
        );
      },
    );
  });
});
