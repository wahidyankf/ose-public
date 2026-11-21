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

function phasedManifest(): PathManifest {
  return manifestFixture({
    pathId: "careers/fundamentally-strong/generalist-track",
    arc: "fundamentally-strong",
    title: "Generalist Track",
    description: "A deep route through the foundations.",
    assumes: ["just-enough-python"],
    phases: [
      {
        id: "fixture-core",
        title: "Fixture core",
        kind: "core",
        outcome: { can: "complete this fixture path", cannotYet: "lead a team" },
        courses: ["computer-science-foundations", "software-engineering-practices"],
      },
      {
        id: "fixture-extension",
        title: "Fixture extension",
        kind: "extension",
        courses: ["capstone-secure-service"],
      },
    ],
  });
}

const phasedTitles = {
  "computer-science-foundations": "Computer Science Foundations",
  "software-engineering-practices": "Software Engineering Practices",
  "capstone-secure-service": "Capstone Secure Service",
  "just-enough-python": "Just Enough Python",
};

const feature = await loadFeature(path.join(behavioursRoot, "path-phases.feature"));

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/path-phases.feature: A path landing groups its courses under titled phases
  Scenario("A path landing groups its courses under titled phases", ({ Given, When, Then, And }) => {
    let manifest: PathManifest;

    Given("a fixture path manifest declares a core phase and an extension phase", () => {
      manifest = phasedManifest();
      expect(manifest.phases.map((phase) => phase.kind)).toEqual(["core", "extension"]);
    });

    When("a reader opens that path's landing page under /en/learn/paths/", () => {
      cleanup();
      render(
        <PathLanding
          locale="en"
          manifest={manifest}
          courseTitles={phasedTitles}
          outlineCourseIds={[]}
          assumedCourseTitles={{ "just-enough-python": "Just Enough Python" }}
        />,
      );
    });

    Then("each phase renders as a heading with its title", () => {
      // Plan 04 Phase 4 renders the phase milestones as `h3`s under the roadmap's `h2` headings.
      expect(screen.getByRole("heading", { level: 3, name: /Fixture core/ })).toBeTruthy();
      expect(screen.getByRole("heading", { level: 3, name: /Fixture extension/ })).toBeTruthy();
    });

    And("the core phase's courses appear before the extension phase's courses", () => {
      const nav = screen.getByRole("navigation", { name: /syllabus/ });
      const rows = within(nav).getAllByRole("listitem");
      // The "Before you start" note now sits outside the roadmap's nav (an assumed course is not a
      // path member), so every row here is a course card, in manifest order.
      const links = rows.map((row) => within(row).getByRole("link").textContent);
      expect(links).toEqual([
        "Computer Science Foundations",
        "Software Engineering Practices",
        "Capstone Secure Service",
      ]);
    });

    And("course position numbers continue across the phase boundary", () => {
      const nav = screen.getByRole("navigation", { name: /syllabus/ });
      const rows = within(nav).getAllByRole("listitem");
      const positions = rows.map((row) => row.textContent?.match(/^\d+/)?.[0]);
      expect(positions).toEqual(["1", "2", "3"]);
    });
  });
});
