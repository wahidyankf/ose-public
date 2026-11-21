import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen, within } from "@testing-library/react";
import { expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { PathLanding } from "@/features/course-paths/shell/path-landing";
// eslint-disable-next-line import/first
import { PathRail } from "@/features/course-paths/shell/path-rail";
import { manifestFixture } from "../features/course-paths/manifest-fixture";

const behavioursRoot = path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths");

const outlineFeature = await loadFeature(path.join(behavioursRoot, "outline-course-status.feature"));

const outlineCourseIds = ["capstone-secure-service"];
const courseTitles = {
  "computer-science-foundations": "Computer Science Foundations",
  "capstone-secure-service": "Capstone Secure Service",
};

function outlineManifest() {
  const manifest = manifestFixture({
    pathId: "careers/fundamentally-strong/generalist-track",
    arc: "fundamentally-strong",
    title: "Generalist Track",
    description: "A deep route through the foundations.",
    courses: ["computer-science-foundations", "capstone-secure-service"],
  });
  expect(manifest.courseOrder.map(String)).toContain("capstone-secure-service");
  return manifest;
}

describeFeature(outlineFeature, ({ Scenario }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/outline-course-status.feature: The path syllabus marks an outline course with an Outline badge
  Scenario("The path syllabus marks an outline course with an Outline badge", ({ Given, When, Then, And }) => {
    let manifest: ReturnType<typeof manifestFixture>;

    Given("a fixture path lists a course whose frontmatter declares status outline", () => {
      manifest = outlineManifest();
    });

    When("a reader opens that path's landing page", () => {
      cleanup();
      render(
        <PathLanding
          locale="en"
          manifest={manifest}
          courseTitles={courseTitles}
          outlineCourseIds={outlineCourseIds}
          assumedCourseTitles={{}}
        />,
      );
    });

    Then('the outline course shows a text badge reading "Outline" in the syllabus', () => {
      const syllabus = screen.getByRole("navigation", { name: /syllabus/ });
      const outlineRow = within(syllabus).getByRole("link", { name: "Capstone Secure Service" }).closest("li");
      expect(outlineRow?.textContent).toContain("Outline");
    });

    And("a course without status outline shows no badge in the syllabus", () => {
      const syllabus = screen.getByRole("navigation", { name: /syllabus/ });
      const completeRow = within(syllabus).getByRole("link", { name: "Computer Science Foundations" }).closest("li");
      expect(completeRow?.textContent).not.toContain("Outline");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/outline-course-status.feature: The path rail marks an outline course with an Outline badge
  Scenario("The path rail marks an outline course with an Outline badge", ({ Given, When, Then, And }) => {
    let manifest: ReturnType<typeof manifestFixture>;

    Given("a fixture path lists a course whose frontmatter declares status outline", () => {
      manifest = outlineManifest();
    });

    When("a reader opens a course in that path", () => {
      cleanup();
      render(
        <PathRail
          locale="en"
          manifest={manifest}
          currentCourseId="computer-science-foundations"
          courseTitles={courseTitles}
          outlineCourseIds={outlineCourseIds}
        />,
      );
    });

    Then('the outline course shows a text badge reading "Outline" in the path rail', () => {
      const rail = screen.getByRole("navigation", { name: "Generalist Track course list" });
      const outlineRow = within(rail).getByRole("link", { name: "Capstone Secure Service" }).closest("li");
      expect(outlineRow?.textContent).toContain("Outline");
    });

    And("a course without status outline shows no badge in the path rail", () => {
      const rail = screen.getByRole("navigation", { name: "Generalist Track course list" });
      const completeRow = within(rail).getByRole("link", { name: "Computer Science Foundations" }).closest("li");
      expect(completeRow?.textContent).not.toContain("Outline");
    });
  });
});
