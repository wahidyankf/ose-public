import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
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
import { Breadcrumb } from "@/features/navigation/shell/breadcrumb";
import { PathLanding } from "@/features/course-paths/shell/path-landing";
import { courseRehomeRedirects } from "@/redirects/course-rehome";
import { manifestFixture } from "../features/course-paths/manifest-fixture";

const fixtureManifest: PathManifest = manifestFixture({
  pathId: "careers/interview-ready/example-role",
  arc: "interview-ready",
  title: "Interview-Ready Example Role",
  description: "An interview-first track.",
  courses: ["just-enough-python", "just-enough-bash", "version-control-and-git"],
});

const courseTitles = {
  "just-enough-python": "Just Enough Python",
  "just-enough-bash": "Just Enough Bash",
  "version-control-and-git": "Version Control & Git",
};

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
  Scenario("A path landing page lists its courses in manifest order", ({ Given, When, Then, And }) => {
    Given("a fixture path manifest is loaded by the manifest repository", () => {
      expect(fixtureManifest.courseOrder).toHaveLength(3);
    });

    When("a reader opens that fixture path's landing page under /en/learn/paths/", () => {
      cleanup();
      render(<PathLanding locale="en" manifest={fixtureManifest} courseTitles={courseTitles} />);
    });

    Then("the courses appear in the fixture manifest's phase order", () => {
      const list = document.querySelector("ol");
      expect(list).not.toBeNull();
      const items = within(list as HTMLElement).getAllByRole("listitem");
      // The path position number (Phase 4) sits outside each link, so the link's own
      // textContent is exactly the title and the order assertion keeps its meaning.
      const linkTexts = items.map((item) => within(item).getByRole("link").textContent);
      expect(linkTexts).toEqual(["Just Enough Python", "Just Enough Bash", "Version Control & Git"]);
    });

    And("every course link carries the path context query parameter", () => {
      const link = screen.getByRole("link", { name: "Just Enough Python" });
      expect(link.getAttribute("href")).toBe(
        "/en/learn/courses/just-enough-python?path=careers/interview-ready/example-role",
      );
    });
  });

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

  Scenario("A legacy fundamentally-strong URL redirects to the canonical course URL", ({ Given, When, Then, And }) => {
    let rule: (typeof courseRehomeRedirects)[number] | undefined;

    Given(
      "a re-homed course previously lived under the legacy fundamentally-strong/software-engineer content path",
      () => {
        expect(courseRehomeRedirects.length).toBeGreaterThan(0);
      },
    );

    When("a reader requests the legacy URL", () => {
      rule = courseRehomeRedirects.find(
        (candidate) =>
          candidate.source === "/en/learn/fundamentally-strong/software-engineer/just-enough-python/:path*",
      );
    });

    Then("the app redirects to the course's canonical /en/learn/courses/<course-id> URL", () => {
      expect(rule).toEqual({
        source: "/en/learn/fundamentally-strong/software-engineer/just-enough-python/:path*",
        destination: "/en/learn/courses/just-enough-python/:path*",
        permanent: true,
      });
    });

    And("the redirect preserves any path context query parameter", () => {
      // Next.js preserves incoming query parameters when a redirect destination does not replace
      // them. This production rule carries no destination query, so `?path=...` remains intact.
      expect(rule?.destination).not.toContain("?");
    });
  });
});
