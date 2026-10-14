import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen, within } from "@testing-library/react";
import { expect } from "vitest";
import "./helpers/test-setup";
import type { ContentMeta } from "@/features/content/core/types";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import { PROGRESS_STORAGE_KEY } from "@/features/learning-progress/core/progress-schema";
import { recordVisit, setPageComplete } from "@/features/learning-progress/core/progress-state";
import { LearnHome } from "@/features/learning-progress/shell/learn-home";
import { learningProgressStore } from "@/features/learning-progress/shell/progress-storage";
import { manifestFixture } from "../features/course-paths/manifest-fixture";
// eslint-disable-next-line import/first
import { learnHomeRedirects } from "../../../src/redirects/learn-home";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/learning-progress/learn-home.feature",
  ),
);

/** `content/en/learn/_index.md`'s description — the intro that folds in the old Overview text. */
const INTRO = "Follow a path from your first course to a finished project, or pick single courses from the catalog.";

/** Every course's lesson page paths, so a course counts as done only when all of them are done. */
const SEQUENCES: Record<string, string[]> = {
  "just-enough-bash": ["learning/overview", "learning/beginner", "learning/advanced"],
  "backend-essentials": ["learning/overview", "learning/beginner"],
  "sql-essentials": ["learning/beginner", "learning/advanced"],
  "version-control-and-git": ["learning/overview", "learning/beginner"],
};

/** The same per-course titles and estimates the app reads from each course's frontmatter. */
const COURSE_TITLES: Record<string, string> = {
  "just-enough-bash": "Just Enough Bash",
  "backend-essentials": "Backend Essentials",
  "sql-essentials": "SQL Essentials",
  "version-control-and-git": "Version Control & Git",
};

const COURSE_ESTIMATES: Record<string, number> = {
  "just-enough-bash": 4,
  "backend-essentials": 6,
  "sql-essentials": 8,
  "version-control-and-git": 7,
};

const BACKEND_TRACK = manifestFixture({
  pathId: "careers/immediately-effective/backend-track",
  arc: "immediately-effective",
  title: "Backend Track",
  description: "Write shell scripts, serve an HTTP backend, and store its data.",
  goals: ["sql-essentials"],
  phases: [
    {
      id: "shell-foundations",
      title: "Shell foundations",
      kind: "core",
      outcome: { can: "edit code quickly" },
      courses: ["just-enough-bash", "backend-essentials"],
    },
    {
      id: "optional-shell",
      title: "Optional shell workflow",
      kind: "extension",
      courses: ["sql-essentials"],
    },
  ],
});

/** A second career track: one core phase, and no goals, so the goal line's rule shows both ways. */
const INTERVIEW_TRACK = manifestFixture({
  pathId: "careers/interview-ready/backend-track",
  arc: "interview-ready",
  title: "Backend Track (Interview-Ready)",
  description: "Rehearse the interviews you are about to sit.",
  courses: ["sql-essentials"],
});

const SKILLS_PATH = manifestFixture({
  pathId: "skills/just-enough-tools",
  arc: "just-enough-tools",
  title: "Just Enough Tools",
  description: "Get productive with the everyday tools a project needs.",
  courses: ["version-control-and-git"],
});

const MANIFESTS: PathManifest[] = [BACKEND_TRACK, INTERVIEW_TRACK, SKILLS_PATH];
const CAREER_PATHS: PathManifest[] = [BACKEND_TRACK, INTERVIEW_TRACK];

function meta(slug: string, title: string, estimatedHours?: number): [string, ContentMeta] {
  return [
    `en:${slug}`,
    {
      title,
      slug,
      locale: "en",
      weight: 0,
      tags: [],
      draft: false,
      isSection: true,
      filePath: `/content/en/${slug}/_index.md`,
      ...(estimatedHours === undefined ? {} : { estimatedHours }),
    },
  ];
}

const CONTENT_MAP = new Map<string, ContentMeta>([
  meta("learn/paths/careers/immediately-effective", "Immediately Effective"),
  meta("learn/paths/careers/interview-ready", "Interview Ready"),
  ...Object.entries(COURSE_TITLES).map(
    ([courseId, title]) =>
      meta(`learn/courses/${courseId}`, title, COURSE_ESTIMATES[courseId]) as [string, ContentMeta],
  ),
]);

/** Render the Learn home as the app does for a reader who just opened `/en/learn`. */
function openLearnHome(): void {
  cleanup();
  render(
    <LearnHome
      locale="en"
      title="Learn"
      description={INTRO}
      manifests={MANIFESTS}
      contentMap={CONTENT_MAP}
      sequences={SEQUENCES}
      catalogCounts={{ courses: 181, categories: 14 }}
    />,
  );
}

/** The course IDs a manifest lists in its phases of `kind`. */
function phaseCourseIds(manifest: PathManifest, kind: "core" | "extension"): string[] {
  return manifest.phases
    .filter((phase) => phase.kind === kind)
    .flatMap((phase) => phase.courses.map((reference) => (typeof reference === "string" ? reference : reference.id)));
}

/** The card `<li>` one path's title link renders inside. */
function cardOf(manifest: PathManifest): HTMLElement {
  const card = screen.getByRole("link", { name: manifest.title }).closest("li");
  expect(card, `the ${manifest.title} card should render inside a list item`).not.toBeNull();
  return card as HTMLElement;
}

/**
 * The rule the app's own matcher applies to `pathname` — the same exact-source matching
 * `learn-three-bucket.steps.tsx` models: a source with no `:path*` suffix matches that address and
 * nothing beneath it.
 */
function applyLearnHomeRedirect(pathname: string): string | undefined {
  for (const rule of learnHomeRedirects) {
    if (rule.source.endsWith("/:path*")) {
      const base = rule.source.slice(0, -"/:path*".length);
      if (pathname === base || pathname.startsWith(`${base}/`)) return rule.destination;
      continue;
    }
    if (pathname === rule.source) return rule.destination;
  }
  return undefined;
}

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {
      learningProgressStore.reset();
      window.localStorage.clear();
      expect(LearnHome).toBeTypeOf("function");
    });
  });

  Scenario("The Learn home is a landing page, not a list of courses", ({ When, Then, And }) => {
    When("a reader opens /en/learn", () => {
      openLearnHome();
    });

    Then(
      'the page shows an introduction, career path cards, skills path cards, and a "Browse all courses" link to the catalog',
      () => {
        expect(screen.getByRole("heading", { level: 1, name: "Learn" })).toBeTruthy();
        expect(screen.getByText(INTRO)).toBeTruthy();
        expect(screen.getByRole("heading", { level: 2, name: "Career paths" })).toBeTruthy();
        expect(screen.getByRole("link", { name: BACKEND_TRACK.title })).toBeTruthy();
        expect(screen.getByRole("heading", { level: 2, name: "Skill paths" })).toBeTruthy();
        expect(screen.getByRole("link", { name: SKILLS_PATH.title })).toBeTruthy();
        expect(screen.getByRole("link", { name: /Browse all courses/ }).getAttribute("href")).toBe("/en/learn/courses");
      },
    );

    And("the page links to no individual course page", () => {
      const coursePageLinks = Array.from(document.querySelectorAll("a"))
        .map((link) => link.getAttribute("href") ?? "")
        .filter((href) => href.startsWith("/en/learn/courses/"));
      expect(coursePageLinks).toEqual([]);
    });
  });

  Scenario("A returning reader sees a Continue learning card", ({ Given, When, Then, And }) => {
    Given("a reader completed some learning pages while following a path", () => {
      learningProgressStore.update((state) =>
        recordVisit(
          setPageComplete(state, "just-enough-bash", "learning/overview", true),
          "just-enough-bash",
          BACKEND_TRACK.pathId,
        ),
      );
      expect(learningProgressStore.getSnapshot().status).toBe("ready");
    });

    When("the reader opens /en/learn", () => {
      openLearnHome();
    });

    Then('a "Continue learning" card names that path and its next course', () => {
      expect(screen.getByText("Continue learning")).toBeTruthy();
      expect(screen.getAllByText(BACKEND_TRACK.title).length).toBeGreaterThan(0);
      expect(screen.getByRole("link", { name: /Continue:/ }).textContent).toContain("Just Enough Bash");
    });

    And("its button links to the next learning page in path context", () => {
      expect(screen.getByRole("link", { name: /Continue:/ }).getAttribute("href")).toBe(
        `/en/learn/courses/just-enough-bash/learning/beginner?path=${BACKEND_TRACK.pathId}`,
      );
    });
  });

  Scenario("A new reader sees a Start learning card in the same place", ({ Given, When, Then }) => {
    Given("a reader has no saved progress", () => {
      learningProgressStore.reset();
      window.localStorage.clear();
      expect(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull();
    });

    When("the reader opens /en/learn", () => {
      openLearnHome();
    });

    Then('the same card area shows "Start learning" with a link to the paths', () => {
      expect(screen.getByText("Start learning")).toBeTruthy();
      expect(screen.getByRole("link", { name: "Choose a path" }).getAttribute("href")).toBe("/en/learn#career-paths");
    });
  });

  Scenario("Path cards show who it is for, the goal, size, time, and progress", ({ When, Then, And }) => {
    When("a reader opens /en/learn", () => {
      openLearnHome();
    });

    Then(
      "each career path card shows the path title, who it is for, its goal, its core phase count, its estimated time, and its progress in words",
      () => {
        for (const manifest of CAREER_PATHS) {
          const coreCourseIds = phaseCourseIds(manifest, "core");
          const corePhaseCount = manifest.phases.filter((phase) => phase.kind === "core").length;
          const extensionCount = manifest.phases.filter((phase) => phase.kind === "extension").length;
          const hours = coreCourseIds.reduce((total, id) => total + (COURSE_ESTIMATES[id] ?? 0), 0);
          const goalTitles = (manifest.goals ?? []).map((goal) => COURSE_TITLES[goal] ?? goal);
          const text = cardOf(manifest).textContent ?? "";

          expect(text).toContain(manifest.title); // the path title
          expect(text).toContain(manifest.description); // who it is for
          expect(text).toContain(`${corePhaseCount} core phases · ${extensionCount} optional`); // its size
          expect(text).toContain(`About ${hours} h`); // its estimated time
          expect(text).toContain(`0 of ${coreCourseIds.length} core courses done`); // its progress
          expect(text).toContain("Not started");

          if (goalTitles.length === 0) {
            // A path whose manifest declares no goals shows no goal line at all.
            expect(text).not.toContain("Goal:");
          } else {
            expect(text).toContain(`Goal: ${goalTitles.join(", ")}`);
          }
        }
      },
    );

    And("each card links to its path page", () => {
      for (const manifest of CAREER_PATHS) {
        const href = `/en/learn/paths/${manifest.pathId}`;
        expect(screen.getByRole("link", { name: manifest.title }).getAttribute("href")).toBe(href);
        expect(
          within(cardOf(manifest))
            .getByRole("link", { name: /View path/ })
            .getAttribute("href"),
        ).toBe(href);
      }
    });
  });

  Scenario("The old Learn overview address redirects to the Learn home", ({ When, Then }) => {
    let requested = "";

    When("a visitor requests /en/learn/overview", () => {
      requested = "/en/learn/overview";
    });

    Then("the response is a permanent redirect with status 308 to /en/learn", () => {
      // Next.js answers a `permanent: true` rule with 308, so the flag and the destination are
      // exactly what the browser receives.
      expect(learnHomeRedirects.find((rule) => rule.source === requested)).toEqual({
        source: "/en/learn/overview",
        destination: "/en/learn",
        permanent: true,
      });
      expect(applyLearnHomeRedirect(requested)).toBe("/en/learn");
    });
  });

  Scenario("A deeper address under the old overview is not redirected", ({ When, Then }) => {
    let requested = "";

    When("a visitor requests /en/learn/overview/anything", () => {
      requested = "/en/learn/overview/anything";
    });

    Then("the response status is 404", () => {
      // No rule matches an address under the old overview, so the app's own matcher falls through
      // to the not-found page.
      expect(applyLearnHomeRedirect(requested)).toBeUndefined();
      expect(learnHomeRedirects.some((rule) => rule.source === requested)).toBe(false);
      expect(learnHomeRedirects.some((rule) => rule.source.includes(":path*"))).toBe(false);
    });
  });
});
