import { cleanup, render } from "@testing-library/react";
import type { ReactElement } from "react";
import type { ContentMeta } from "@/features/content/core/types";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import { CoursePageContent } from "@/features/course-paths/shell/course-page-content";
import type { CourseHeaderData } from "@/features/course-paths/shell/course-header-data";
import { PathLanding } from "@/features/course-paths/shell/path-landing";
import { LearnHome } from "@/features/learning-progress/shell/learn-home";
import { manifestFixture } from "../../features/course-paths/manifest-fixture";
import { BASH_SEQUENCE, COURSE_TITLES, LESSON_SEQUENCES } from "../../features/learning-progress/lesson-fixtures";
import { lessonPageElement } from "./lesson-page";

/**
 * The four screens the accessibility and no-layout-shift scenarios (S8, S35–S39) all name — the
 * Learn home, a path page, a learning page, and a course landing page — each opened exactly as its
 * page opens it, against the synthetic three-course backend-track library the `learning-progress`
 * step files share. One definition, so the two scenarios that walk all four screens cannot drift
 * apart, and a unit assertion stays comparable with its browser binding.
 *
 * Every screen renders the real components; only the data around them is synthetic.
 */
export const PATH_ID = "careers/immediately-effective/backend-track";
export const BASH_ID = "just-enough-bash";
export const BACKEND_ID = "backend-essentials";

/** The path page's manifest: the same three courses, in the same order, as the E2E fixture. */
export const BACKEND_TRACK: PathManifest = manifestFixture({
  pathId: PATH_ID,
  arc: "immediately-effective",
  title: "Backend Track",
  description: "Write shell scripts, serve an HTTP backend, and store its data.",
  phases: [
    {
      id: "fixture-core",
      title: "Fixture core",
      kind: "core",
      outcome: { can: "complete this fixture path" },
      courses: [BASH_ID, BACKEND_ID, "sql-essentials"],
    },
  ],
});

/** Every course's lesson page paths — a course counts only when all of them are done. */
export const PATH_SEQUENCES: Record<string, readonly string[]> = Object.fromEntries(
  Object.entries(LESSON_SEQUENCES).map(([courseId, pages]) => [courseId, pages.map((page) => page.pagePath)]),
);

function contentMeta(slug: string, title: string, estimatedHours?: number): [string, ContentMeta] {
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

/** The arc and course metadata the Learn home's cards read from the content index. */
const LEARN_HOME_CONTENT_MAP = new Map<string, ContentMeta>([
  contentMeta("learn/paths/careers/immediately-effective", "Immediately Effective"),
  contentMeta(`learn/courses/${BASH_ID}`, COURSE_TITLES[BASH_ID] as string, 4),
  contentMeta(`learn/courses/${BACKEND_ID}`, COURSE_TITLES[BACKEND_ID] as string, 6),
  contentMeta("learn/courses/sql-essentials", COURSE_TITLES["sql-essentials"] as string, 8),
]);

/** The course landing header plan 03 builds for `just-enough-bash`, plus plan 04's two slots. */
const COURSE_LANDING_HEADER: CourseHeaderData = {
  courseId: BASH_ID,
  description: "Write shell scripts that do real work.",
  category: null,
  format: "primer",
  estimatedHours: 3,
  isOutline: false,
  startSlug: `learn/courses/${BASH_ID}/learning/overview`,
};

function learnHomeElement(): ReactElement {
  return (
    <LearnHome
      locale="en"
      title="Learn"
      description="Follow a path from your first course to a finished project."
      manifests={[BACKEND_TRACK]}
      contentMap={LEARN_HOME_CONTENT_MAP}
      sequences={PATH_SEQUENCES}
      catalogCounts={{ courses: 3, categories: 1 }}
    />
  );
}

function pathPageElement(): ReactElement {
  return <PathLanding locale="en" manifest={BACKEND_TRACK} courseTitles={COURSE_TITLES} sequences={PATH_SEQUENCES} />;
}

/** The learning page, inside the path context its context bar and action row report. */
function learningPageElement(): ReactElement {
  return lessonPageElement({ courseId: BASH_ID, pagePath: "learning/beginner", pathParam: PATH_ID });
}

function courseLandingElement(): ReactElement {
  return (
    <CoursePageContent
      locale="en"
      slug={`learn/courses/${BASH_ID}`}
      title={COURSE_TITLES[BASH_ID] as string}
      html="<p>Course body.</p>"
      headings={[]}
      breadcrumbSegments={[{ label: "Home", slug: "" }]}
      renderData={{ activeContext: null, prerequisiteLinks: [], pathBadges: [], prev: null, next: null }}
      courseId={BASH_ID}
      courseHeader={COURSE_LANDING_HEADER}
      courseHeaderProgress={{ courseId: BASH_ID, sequence: PATH_SEQUENCES[BASH_ID] as string[] }}
      courseHeaderAction={{ courseId: BASH_ID, sequence: BASH_SEQUENCE, startSlug: COURSE_LANDING_HEADER.startSlug }}
    />
  );
}

/** The name of one of the four screens, exactly as the scenarios write it. */
export type ProgressScreenName = "the Learn home" | "a path page" | "a learning page" | "a course landing page";

/** One screen: its React tree (what the server renders and the browser hydrates) and jsdom mount. */
export interface ProgressScreen {
  name: ProgressScreenName;
  element: () => ReactElement;
  open: () => HTMLElement;
}

const SCREEN_ELEMENTS: Record<ProgressScreenName, () => ReactElement> = {
  "the Learn home": learnHomeElement,
  "a path page": pathPageElement,
  "a learning page": learningPageElement,
  "a course landing page": courseLandingElement,
};

/**
 * The four screens, in the order the scenarios name them. `open` unmounts whatever was rendered
 * before, so each screen is read while it is the only mounted tree.
 */
export const PROGRESS_SCREENS: readonly ProgressScreen[] = (Object.keys(SCREEN_ELEMENTS) as ProgressScreenName[]).map(
  (name) => ({
    name,
    element: SCREEN_ELEMENTS[name],
    open: (): HTMLElement => {
      cleanup();
      return render(SCREEN_ELEMENTS[name]()).container;
    },
  }),
);

/** Open one named screen — the single-screen twin of the four-screen walk. */
export function openProgressScreen(name: ProgressScreenName): HTMLElement {
  const screen = PROGRESS_SCREENS.find((candidate) => candidate.name === name);
  if (screen === undefined) {
    throw new Error(`No progress screen is named "${name}"`);
  }
  return screen.open();
}

/** One `[data-progress-slot]` element as the two markups must agree on it (S8). */
export interface SlotFingerprint {
  /** The slot's own name, at its position in the document. */
  slot: string;
  tag: string;
  /** The class list, verbatim and in order: the classes are what size the slot. */
  classes: string;
  /** The element after the slot — the content a size change would push down. */
  next: string;
}

/** Fingerprint every progress slot in a markup, in document order. */
export function slotFingerprints(root: ParentNode): SlotFingerprint[] {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-progress-slot]")).map((slot) => {
    const next = slot.nextElementSibling;
    return {
      slot: slot.getAttribute("data-progress-slot") ?? "",
      tag: slot.tagName,
      classes: slot.className,
      next: next === null ? "" : `${next.tagName}.${next.className}`,
    };
  });
}
