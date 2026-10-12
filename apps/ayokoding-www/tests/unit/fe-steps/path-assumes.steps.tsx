import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen, within } from "@testing-library/react";
import { expect, vi } from "vitest";
import type { PathManifest } from "@/features/course-paths/core/schemas";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { PathLanding } from "@/features/course-paths/shell/path-landing";
import { manifestFixture } from "../features/course-paths/manifest-fixture";

const behavioursRoot = path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths");

const courseTitles = {
  "computer-science-foundations": "Computer Science Foundations",
  "software-engineering-practices": "Software Engineering Practices",
  "just-enough-python": "Just Enough Python",
};

const feature = await loadFeature(path.join(behavioursRoot, "path-assumes.feature"));

describeFeature(feature, ({ Scenario }) => {
  Scenario("A path names its assumed courses before the syllabus", ({ Given, When, Then, And }) => {
    let manifest: PathManifest;

    Given("a fixture path manifest declares assumed courses", () => {
      manifest = manifestFixture({
        pathId: "careers/fundamentally-strong/generalist-track",
        arc: "fundamentally-strong",
        title: "Generalist Track",
        description: "A deep route through the foundations.",
        assumes: ["just-enough-python"],
        courses: ["computer-science-foundations", "software-engineering-practices"],
      });
      expect(manifest.assumes).toEqual(["just-enough-python"]);
    });

    When("a reader opens that path's landing page", () => {
      cleanup();
      render(
        <PathLanding
          locale="en"
          manifest={manifest}
          courseTitles={courseTitles}
          outlineCourseIds={[]}
          assumedCourseTitles={{ "just-enough-python": "Just Enough Python" }}
        />,
      );
    });

    Then('a "Before you start" note appears before the first phase', () => {
      const note = screen.getByText("Before you start").closest("div");
      const firstPhase = screen.getByRole("heading", { level: 2, name: /Phase A/ });
      expect(note).not.toBeNull();
      expect((note as HTMLElement).compareDocumentPosition(firstPhase) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    And("it links every assumed course to its canonical course page without a path query parameter", () => {
      const link = screen.getByRole("link", { name: "Just Enough Python" });
      expect(link.getAttribute("href")).toBe("/en/learn/courses/just-enough-python");
      expect(link.getAttribute("href")).not.toContain("?path=");
    });
  });

  Scenario("A path that assumes nothing shows no Before you start note", ({ Given, When, Then }) => {
    let manifest: PathManifest;

    Given("a path manifest declares no assumed courses", () => {
      manifest = manifestFixture({
        pathId: "careers/interview-ready/backend-track",
        arc: "interview-ready",
        title: "Backend Track",
        description: "desc",
        courses: ["computer-science-foundations"],
      });
      expect(manifest.assumes).toEqual([]);
    });

    When("its landing page renders", () => {
      cleanup();
      render(<PathLanding locale="en" manifest={manifest} courseTitles={courseTitles} outlineCourseIds={[]} />);
    });

    Then('no "Before you start" note is rendered', () => {
      expect(screen.queryByText("Before you start")).toBeNull();
      // The syllabus itself still renders.
      expect(screen.getByRole("navigation", { name: /syllabus/ })).toBeTruthy();
      expect(within(screen.getByRole("navigation", { name: /syllabus/ })).getAllByRole("listitem")).toHaveLength(1);
    });
  });
});
