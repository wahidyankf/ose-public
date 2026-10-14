import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen, within } from "@testing-library/react";
import { expect, vi } from "vitest";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import { resolvePathNav } from "@/features/course-paths/core/path-nav";
import { contentUrl } from "@/features/content/core/content-url";
import { slugForCourseId, toCoursePathClientData } from "@/features/course-paths/shell/course-path-nav";

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

  Scenario("A core phase states what the reader can do after it", ({ Given, When, Then, And }) => {
    let manifest: PathManifest;

    Given("a fixture core phase declares an outcome", () => {
      manifest = phasedManifest();
      expect(manifest.phases[0]?.outcome).toEqual({
        can: "complete this fixture path",
        cannotYet: "lead a team",
      });
    });

    When("a reader opens that path's landing page", () => {
      cleanup();
      render(
        <PathLanding
          locale="en"
          manifest={manifest}
          courseTitles={phasedTitles}
          outlineCourseIds={[]}
          assumedCourseTitles={{}}
        />,
      );
    });

    Then('the phase shows "After this phase you can" followed by the outcome', () => {
      expect(screen.getByText("After this phase you can complete this fixture path")).toBeTruthy();
    });

    And('when the outcome declares what the reader cannot yet do, the phase also shows "You cannot yet"', () => {
      expect(screen.getByText("You cannot yet lead a team")).toBeTruthy();
    });
  });

  Scenario("Extension phases sit under an optional heading after the core", ({ Given, When, Then, And }) => {
    let manifest: PathManifest;

    Given("a fixture path manifest declares an extension phase", () => {
      manifest = phasedManifest();
      expect(manifest.phases.some((phase) => phase.kind === "extension")).toBe(true);
    });

    When("a reader opens that path's landing page", () => {
      cleanup();
      render(
        <PathLanding
          locale="en"
          manifest={manifest}
          courseTitles={phasedTitles}
          outlineCourseIds={[]}
          assumedCourseTitles={{}}
        />,
      );
    });

    Then('an "Optional extensions" heading appears after the last core phase', () => {
      const extensionsHeading = screen.getByRole("heading", { level: 2, name: "Optional extensions" });
      const coreHeading = screen.getByRole("heading", { level: 3, name: /Fixture core/ });
      expect(coreHeading.compareDocumentPosition(extensionsHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    And("every extension phase is listed under that heading", () => {
      const extensionsHeading = screen.getByRole("heading", { level: 2, name: "Optional extensions" });
      const extensionHeading = screen.getByRole("heading", { level: 3, name: /Fixture extension/ });
      expect(extensionsHeading.compareDocumentPosition(extensionHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
  });

  Scenario("The path rail groups the path's courses by phase", ({ Given, When, Then, And }) => {
    let manifest: PathManifest;

    Given("a reader opens a course in path context on a desktop-width viewport", () => {
      manifest = phasedManifest();
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
      expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    });

    When("the page renders", () => {
      cleanup();
      render(
        <PathRail
          locale="en"
          manifest={manifest}
          currentCourseId="software-engineering-practices"
          courseTitles={phasedTitles}
          outlineCourseIds={[]}
        />,
      );
    });

    Then("the left rail shows each phase title followed by that phase's courses", () => {
      expect(screen.getByText("Phase 1 · Fixture core")).toBeTruthy();
      expect(screen.getByText("Fixture extension")).toBeTruthy();
      const nav = screen.getByRole("navigation", { name: "Generalist Track course list" });
      const rows = within(nav).getAllByRole("listitem");
      expect(rows).toHaveLength(3);
    });

    And("the current course is still marked by a marker and weight, not by colour alone", () => {
      const current = screen.getByRole("link", { name: "Software Engineering Practices" });
      expect(current.getAttribute("aria-current")).toBe("page");
      expect(current.textContent).toContain("▸");
      expect(current.className).toContain("font-semibold");
    });
  });

  Scenario("Next crosses from the last core course into the first extension course", ({ Given, When, Then, And }) => {
    let manifest: PathManifest;
    let nextId: string | null = null;

    Given("a reader is on the last course of a fixture path's last core phase", () => {
      manifest = phasedManifest();
      expect(manifest.phases[0]?.courses.map(String)).toContain("software-engineering-practices");
    });

    When("the reader reads the prev/next navigation", () => {
      nextId = resolvePathNav(manifest, "software-engineering-practices").next?.id ?? null;
    });

    Then("next is the first course of the first extension phase", () => {
      expect(nextId).toBe("capstone-secure-service");
    });

    And("the link preserves the path context query parameter", () => {
      expect(nextId).not.toBeNull();
      expect(contentUrl("en", slugForCourseId(nextId as string), manifest.pathId)).toBe(
        `/en/learn/courses/capstone-secure-service?path=${manifest.pathId}`,
      );
    });
  });

  Scenario("The runtime path data exposes phases and the flattened order", ({ Given, When, Then, And }) => {
    let manifests: PathManifest[];
    let payload: ReturnType<typeof toCoursePathClientData>;

    Given("the fixture manifest set is loaded by the running server", () => {
      manifests = [phasedManifest()];
      expect(manifests).toHaveLength(1);
    });

    When('a client requests coursePaths.getRouteData for locale "en"', () => {
      // The procedure's transform half (`toCoursePathClientData` over route data); the IO half
      // (`loadRoutePathData`) is covered by its own shell tests.
      payload = toCoursePathClientData(
        {
          contentMap: new Map(),
          manifests,
          prerequisitesByCourse: {},
          libraryCourseIds: [],
          outlineCourseIds: [],
        },
        "en",
      );
    });

    Then("each manifest in the response carries its phases with id, title, kind, outcome, and courses", () => {
      expect(payload.manifests).toHaveLength(1);
      const [served] = payload.manifests;
      expect(served?.phases.map((phase) => ({ id: phase.id, title: phase.title, kind: phase.kind }))).toEqual([
        { id: "fixture-core", title: "Fixture core", kind: "core" },
        { id: "fixture-extension", title: "Fixture extension", kind: "extension" },
      ]);
      expect(served?.phases[0]?.outcome).toEqual({
        can: "complete this fixture path",
        cannotYet: "lead a team",
      });
      expect(served?.phases.flatMap((phase) => phase.courses.map(String))).toEqual([
        "computer-science-foundations",
        "software-engineering-practices",
        "capstone-secure-service",
      ]);
    });

    And("each manifest also carries a courseOrder equal to its phases' courses in order", () => {
      const [served] = payload.manifests;
      expect(served?.courseOrder.map(String)).toEqual(served?.phases.flatMap((phase) => phase.courses.map(String)));
    });
  });

  Scenario("A skills path awaiting restructure renders as today's flat list", ({ Given, When, Then, And }) => {
    let manifest: PathManifest;

    Given("a skills manifest carries its restructure marker", () => {
      manifest = manifestFixture({
        pathId: "skills/conventional-accounting",
        arc: "conventional-accounting",
        title: "Conventional Accounting",
        description: "A mechanical one-phase shape awaiting its content plan.",
        restructurePendingIn: "plan-06",
        phases: [
          {
            id: "all-courses",
            title: "All courses",
            kind: "core",
            courses: ["just-enough-python", "capstone-secure-service"],
          },
        ],
      });
      expect(manifest.restructurePendingIn).toBe("plan-06");
    });

    When("its landing page and a course in that path render", () => {
      cleanup();
      render(
        <>
          <PathLanding
            locale="en"
            manifest={manifest}
            courseTitles={{
              "just-enough-python": "Just Enough Python",
              "capstone-secure-service": "Capstone Secure Service",
            }}
            outlineCourseIds={["capstone-secure-service"]}
            assumedCourseTitles={{}}
          />
          <PathRail
            locale="en"
            manifest={manifest}
            currentCourseId="just-enough-python"
            courseTitles={{
              "just-enough-python": "Just Enough Python",
              "capstone-secure-service": "Capstone Secure Service",
            }}
            outlineCourseIds={["capstone-secure-service"]}
          />
        </>,
      );
    });

    Then("the syllabus and the path rail list its courses in order without phase headings", () => {
      const navs = screen.getAllByRole("navigation");
      expect(navs.length).toBe(2);
      for (const nav of navs) {
        const rows = within(nav).getAllByRole("listitem");
        expect(rows).toHaveLength(2);
      }
      expect(screen.queryByRole("heading", { name: /All courses/ })).toBeNull();
    });

    And('no outcome line, "Optional extensions" heading, "Before you start" note, or Outline badge appears', () => {
      expect(screen.queryByText("After this phase you can", { exact: false })).toBeNull();
      expect(screen.queryByText("Optional extensions")).toBeNull();
      expect(screen.queryByText("Before you start")).toBeNull();
      expect(screen.queryByText("Outline")).toBeNull();
    });
  });
});
