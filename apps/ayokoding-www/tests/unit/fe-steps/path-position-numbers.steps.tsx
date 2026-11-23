import path from "node:path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen, within } from "@testing-library/react";
import { expect, vi } from "vitest";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import { manifestFixture } from "../features/course-paths/manifest-fixture";

// plan (ayokoding-learn-revamp-01-navigation-and-display), Phase 3 RED (unit, S4) — step
// bindings for path-position-numbers.feature's "A course page in path context shows no
// catalogue number in course titles", rendering the course page chrome the way
// path-order-nav.steps.tsx does (same mocks and renderCoursePathPage setup) for the
// backend-track fixture path's three courses, with every course title taken from the committed
// content/en/learn/courses/<slug>/_index.md frontmatter (an in-memory double here; the e2e suite
// renders the real course pages) instead of a synthetic fixture. RED until the Phase 3 title-strip
// codemod runs: the real titles still carried their leading catalogue and pass numbers.

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/navigation/shell/toc", () => ({
  TableOfContents: () => null,
}));

let mockPathname = "/en/browse";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/lib/trpc/client", () => ({
  trpcClient: {
    content: {
      getTree: { query: vi.fn().mockResolvedValue([]) },
    },
  },
}));

interface StoredContentMeta {
  title: string;
  slug: string;
  locale: string;
  weight: number;
  tags: string[];
  draft: boolean;
  isSection: boolean;
  filePath: string;
  prerequisites: string[];
}

interface StoredPage {
  title: string;
  html: string;
  headings: string[];
  date: null;
  prev: null;
  next: null;
}

/**
 * Populated in the Given step from the real content tree. The mocked data ports below read it
 * lazily at call time — vi.mock factories run during the static-import phase, before module
 * body code, so they must never touch this store eagerly (same reason path-order-nav.steps.tsx
 * declares its fixture through vi.hoisted).
 */
const store = vi.hoisted(() => ({
  pages: new Map<string, StoredPage>(),
  contentMap: new Map<string, StoredContentMeta>(),
  manifests: [] as PathManifest[],
}));

vi.mock("@/lib/trpc/server", () => ({
  serverCaller: {
    content: {
      getBySlug: vi.fn(async ({ slug }: { slug: string }) => {
        const page = store.pages.get(slug);
        if (!page) throw new Error(`no real-content page fixture for slug ${slug}`);
        return page;
      }),
    },
  },
}));

vi.mock("@/features/app-shell/shell/trpc-init", () => ({
  createTRPCContext: () => ({
    contentService: { getIndex: async () => ({ contentMap: store.contentMap, trees: {}, prevNext: new Map() }) },
  }),
}));

vi.mock("@/features/course-paths/shell/manifest-repository", () => ({
  loadManifests: vi.fn(async () => store.manifests),
  defaultManifestsDir: () => "unused-in-test",
}));

// eslint-disable-next-line import/first
import { renderCoursePathPage } from "../render-course-path-page";
// eslint-disable-next-line import/first
import { PathLanding } from "@/features/course-paths/shell/path-landing";
// eslint-disable-next-line import/first
import { SyllabusPreview } from "@/features/course-paths/shell/syllabus-preview";

const COURSES_ROOT = "content/en/learn/courses";
const COURSE_IDS = ["just-enough-bash", "backend-essentials", "sql-essentials"] as const;

// The e2e suite's fixture path manifest
// (apps/ayokoding-www-fe-e2e/fixtures/manifests/careers/immediately-effective/backend-track.json):
// exactly the three courses this plan binds S4 with, so backend-essentials sits at 2 of 3.
const BACKEND_TRACK_COURSES = ["just-enough-bash", "backend-essentials", "sql-essentials"] as const;
const BACKEND_TRACK_MANIFEST: PathManifest = manifestFixture({
  pathId: "careers/immediately-effective/backend-track",
  arc: "immediately-effective",
  title: "Backend Track (Immediately-Effective)",
  description: "Fixture path whose courseOrder is exactly the three courses this binding renders.",
  courses: [...BACKEND_TRACK_COURSES],
});
const BACKEND_TRACK_PATH_ID = BACKEND_TRACK_MANIFEST.pathId;

// S1–S3 bind the position NUMBER itself, not the real content titles (the S4 scenario above
// already binds those), so their bindings render the backend-track fixture shape with opaque
// synthetic titles — mirroring the e2e fixture manifest's courseOrder so both adapters of each
// scenario tell the same story.
const POSITION_FIXTURE_TITLES: Readonly<Record<string, string>> = {
  "just-enough-bash": "Just Enough Bash",
  "backend-essentials": "Backend Essentials",
  "sql-essentials": "SQL Essentials",
};
const POSITION_FIXTURE_TITLE_ORDER: readonly string[] = BACKEND_TRACK_COURSES.map(
  (courseId) => POSITION_FIXTURE_TITLES[courseId] ?? courseId,
);
const POSITION_FIXTURE_ROWS = [
  { position: "1", title: "Just Enough Bash" },
  { position: "2", title: "Backend Essentials" },
  { position: "3", title: "SQL Essentials" },
] as const;

/** Assert one rendered row shows `position` before `title` (tech-docs §4.2: number, then title). */
function expectRowShowsPositionBeforeTitle(row: HTMLElement, position: string, title: string): void {
  const rowText = row.textContent ?? "";
  expect(
    rowText,
    `row should render its position number "${position}" before the title "${title}" (rendered: "${rowText}")`,
  ).toMatch(new RegExp(`^${position}\\s*(?:▸\\s*)?${title}`, "u"));
}

/** A stale catalogue number (a leading two-digit index and middle dot) — tech-docs §4.1's closed list. */
const CATALOGUE_NUMBERED_TITLE = /^\d+\s*·\s/u;
/** A stale pass number (a leading pass index) — tech-docs §4.1's closed list. */
const PASS_NUMBERED_TITLE = /^Pass \d+ /u;

interface CourseFrontmatter {
  title: string;
  prerequisites: string[];
}

/**
 * The committed frontmatter (title and declared prerequisites) of each course these scenarios render,
 * as each course's `_index.md` states it. This in-memory double stands in for the content tree.
 */
const COURSE_FRONTMATTER: ReadonlyMap<string, CourseFrontmatter> = new Map([
  ["just-enough-bash", { title: "Just Enough Bash", prerequisites: [] }],
  ["backend-essentials", { title: "Backend Essentials", prerequisites: ["sql-essentials", "just-enough-python"] }],
  ["sql-essentials", { title: "SQL Essentials", prerequisites: ["just-enough-python"] }],
  ["just-enough-python", { title: "Just Enough Python", prerequisites: [] }],
]);

/** Read one course's frontmatter (title + declared prerequisites) from the content double. */
function readCourseFrontmatter(courseId: string): CourseFrontmatter {
  const frontmatter = COURSE_FRONTMATTER.get(courseId);
  if (!frontmatter) throw new Error(`no course frontmatter in the content double for ${courseId}`);
  return { title: frontmatter.title, prerequisites: [...frontmatter.prerequisites] };
}

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/path-position-numbers.feature",
  ),
);

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/path-position-numbers.feature: A course page in path context shows no catalogue number in course titles
  Scenario("A course page in path context shows no catalogue number in course titles", ({ Given, When, Then, And }) => {
    interface RenderedSurfaces {
      courseId: string;
      h1Text: string;
      breadcrumbCrumbTexts: string[];
      prevNextLinkTexts: string[];
      prerequisiteLinkTexts: string[];
      declaredPrerequisiteCount: number;
    }

    let renderedSurfaces: RenderedSurfaces[] = [];
    const readoutTextByCourseId = new Map<string, string>();
    let frontmatterByCourseId = new Map<string, CourseFrontmatter>();

    Given("a reader opens a course in path context", () => {
      frontmatterByCourseId = new Map<string, CourseFrontmatter>();
      const declaredPrerequisiteIds = new Set<string>();
      for (const courseId of COURSE_IDS) {
        const frontmatter = readCourseFrontmatter(courseId);
        frontmatterByCourseId.set(courseId, frontmatter);
        for (const prerequisiteId of frontmatter.prerequisites) {
          declaredPrerequisiteIds.add(prerequisiteId);
        }
      }
      // Prerequisite links are one of the asserted surfaces, so every directly declared
      // prerequisite also needs a real title in the content index.
      for (const prerequisiteId of declaredPrerequisiteIds) {
        if (!frontmatterByCourseId.has(prerequisiteId)) {
          frontmatterByCourseId.set(prerequisiteId, readCourseFrontmatter(prerequisiteId));
        }
      }

      store.contentMap.clear();
      for (const [courseId, frontmatter] of frontmatterByCourseId) {
        store.contentMap.set(`en:learn/courses/${courseId}`, {
          title: frontmatter.title,
          slug: `learn/courses/${courseId}`,
          locale: "en",
          weight: 0,
          tags: [],
          draft: false,
          isSection: false,
          filePath: `${COURSES_ROOT}/${courseId}/_index.md`,
          prerequisites: frontmatter.prerequisites,
        });
      }

      store.pages.clear();
      for (const courseId of COURSE_IDS) {
        const frontmatter = frontmatterByCourseId.get(courseId);
        if (!frontmatter) throw new Error(`missing real frontmatter for course ${courseId}`);
        store.pages.set(`learn/courses/${courseId}`, {
          title: frontmatter.title,
          html: `<p>Course body for ${courseId}.</p>`,
          headings: [],
          date: null,
          prev: null,
          next: null,
        });
      }

      store.manifests = [BACKEND_TRACK_MANIFEST];
    });

    When("the page renders", async () => {
      renderedSurfaces = [];
      readoutTextByCourseId.clear();
      for (const courseId of COURSE_IDS) {
        const jsx = await renderCoursePathPage({
          locale: "en",
          slug: ["learn", "courses", courseId],
          search: { path: BACKEND_TRACK_PATH_ID },
        });
        cleanup();
        render(jsx);

        const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
        const pageNav = within(screen.getByRole("navigation", { name: "Page navigation" }));
        // The prerequisites nav renders nothing at all when the course declares no
        // prerequisites (plan 02 revised `just-enough-bash` to `[]` under rubric rule T4),
        // so query it optionally and pin the absence to the declaration below.
        const prerequisitesNav = screen.queryByRole("navigation", { name: "Prerequisites" });

        renderedSurfaces.push({
          courseId,
          h1Text: screen.getByRole("heading", { level: 1 }).textContent ?? "",
          breadcrumbCrumbTexts: [...breadcrumb.querySelectorAll("li")].map((crumb) => crumb.textContent ?? ""),
          // A prev/next link's text is "<Previous|Next label><course title>" — strip the
          // navigation label so the title-only patterns below test the title itself.
          prevNextLinkTexts: pageNav
            .getAllByRole("link")
            .map((link) => (link.textContent ?? "").replace(/^(Previous|Next)/u, "").trim()),
          prerequisiteLinkTexts:
            prerequisitesNav === null
              ? []
              : within(prerequisitesNav)
                  .getAllByRole("link")
                  .map((link) => link.textContent ?? ""),
          declaredPrerequisiteCount: frontmatterByCourseId.get(courseId)?.prerequisites.length ?? 0,
        });

        readoutTextByCourseId.set(courseId, screen.getByText(/course \d+ of \d+/iu).textContent ?? "");
      }
    });

    Then(
      "the page heading, breadcrumb, previous and next links, and prerequisite links show course titles without a leading number",
      () => {
        const offences: string[] = [];
        for (const surface of renderedSurfaces) {
          const candidates: Array<[string, string]> = [
            [`h1 on ${surface.courseId}`, surface.h1Text],
            ...surface.breadcrumbCrumbTexts.map((crumbText, index): [string, string] => [
              `breadcrumb crumb ${index + 1} on ${surface.courseId}`,
              crumbText,
            ]),
            ...surface.prevNextLinkTexts.map((linkText, index): [string, string] => [
              `prev/next link ${index + 1} on ${surface.courseId}`,
              linkText,
            ]),
            ...surface.prerequisiteLinkTexts.map((linkText, index): [string, string] => [
              `prerequisite link ${index + 1} on ${surface.courseId}`,
              linkText,
            ]),
          ];
          for (const [surfaceLabel, titleText] of candidates) {
            if (CATALOGUE_NUMBERED_TITLE.test(titleText) || PASS_NUMBERED_TITLE.test(titleText)) {
              offences.push(`${surfaceLabel}: "${titleText}"`);
            }
          }
          // A missing prerequisites nav is legitimate only when the course declares none —
          // otherwise the nav (or its links) failed to render.
          if (surface.prerequisiteLinkTexts.length === 0) {
            expect(
              surface.declaredPrerequisiteCount,
              `${surface.courseId} renders no prerequisite links but declares ${surface.declaredPrerequisiteCount}`,
            ).toBe(0);
          }
        }
        expect(
          offences.length,
          `${offences.length} course-title surface(s) still carry a leading number:\n` +
            offences.map((offence) => `  - ${offence}`).join("\n"),
        ).toBe(0);
      },
    );

    And("the only course order number on the page is the course's position in the active path", () => {
      const readout = readoutTextByCourseId.get("backend-essentials");
      expect(
        readout,
        `backend-essentials' path readout should read "Course 2 of 3" (its position in the backend-track path) but read: ${readout ?? "(no readout rendered)"}`,
      ).toMatch(/course 2 of 3/iu);
    });
  });

  // plan ayokoding-learn-revamp-01, Phase 4 RED (unit, S1) — the syllabus numbering binding.
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/path-position-numbers.feature: The path syllabus numbers each course by its position in the path
  Scenario("The path syllabus numbers each course by its position in the path", ({ Given, When, Then, And }) => {
    Given("a learning path lists its courses in manifest order", () => {
      expect(BACKEND_TRACK_MANIFEST.courseOrder).toEqual(["just-enough-bash", "backend-essentials", "sql-essentials"]);
    });

    When("a reader opens that path's landing page", () => {
      cleanup();
      render(<PathLanding locale="en" manifest={BACKEND_TRACK_MANIFEST} courseTitles={POSITION_FIXTURE_TITLES} />);
    });

    Then("each syllabus row shows its position number starting at 1 before the course title", () => {
      const syllabus = screen.getByRole("navigation", { name: "Backend Track (Immediately-Effective) syllabus" });
      const rows = within(syllabus).getAllByRole("listitem");
      expect(rows).toHaveLength(POSITION_FIXTURE_ROWS.length);
      POSITION_FIXTURE_ROWS.forEach(({ position, title }, index) => {
        const row = rows[index];
        if (!row) throw new Error(`missing syllabus row ${index + 1}`);
        expectRowShowsPositionBeforeTitle(row, position, title);
        // The number sits outside the link (tech-docs §4.2), so the link's accessible name stays
        // exactly the title (WCAG 2.5.3 Label in Name).
        expect(within(row).getByRole("link", { name: title })).toBeTruthy();
      });
    });

    And("the position numbers follow the manifest order with no gaps", () => {
      const syllabus = screen.getByRole("navigation", { name: "Backend Track (Immediately-Effective) syllabus" });
      const rows = within(syllabus).getAllByRole("listitem");
      const leadingNumbers = rows.map((row) => (row.textContent ?? "").match(/^\d+/u)?.[0] ?? "");
      expect(leadingNumbers).toEqual(POSITION_FIXTURE_ROWS.map(({ position }) => position));
    });

    And("every course link carries the path context query parameter", () => {
      // Folded in from the former breadcrumb scenario "A path landing page lists its courses in manifest order".
      const syllabus = screen.getByRole("navigation", { name: "Backend Track (Immediately-Effective) syllabus" });
      const links = within(syllabus).getAllByRole("link");
      expect(links.length).toBe(POSITION_FIXTURE_ROWS.length);
      for (const link of links) {
        expect(link.getAttribute("href")).toContain(`?path=${BACKEND_TRACK_MANIFEST.pathId}`);
      }
    });
  });

  // plan ayokoding-learn-revamp-01, Phase 4 RED (unit, S3) — the arc-preview numbering binding.
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/path-position-numbers.feature: The arc card preview numbers its courses by their path position
  Scenario("The arc card preview numbers its courses by their path position", ({ Given, When, Then, And }) => {
    Given("a fixture arc manifest lists exactly one role", () => {
      // The backend-track fixture manifest is the arc's single role; the preview renders its
      // course titles in courseOrder (the whole SyllabusPreview surface).
      expect(BACKEND_TRACK_MANIFEST.courseOrder).toHaveLength(3);
    });

    When("a reader opens that arc's landing page", () => {
      cleanup();
      render(<SyllabusPreview locale="en" phaseTitle="Fixture core" courseTitles={POSITION_FIXTURE_TITLE_ORDER} />);
    });

    Then('the role card\'s "Starts with" preview numbers its courses 1, 2, and so on in path order', () => {
      const items = screen.getAllByRole("listitem");
      expect(items.map((item) => item.textContent ?? "")).toEqual([
        "1 Just Enough Bash",
        " · 2 Backend Essentials",
        " · 3 SQL Essentials",
      ]);
    });

    And("no preview item shows a second number inside the course title", () => {
      // Strip the rendered position number and its separator; only the bare title must remain —
      // a second number inside the title (the old DWT-002 collision) would survive this strip.
      const items = screen.getAllByRole("listitem");
      const bareTitles = items.map((item) => (item.textContent ?? "").replace(/^\s*·\s*/u, "").replace(/^\d+\s*/u, ""));
      expect(bareTitles).toEqual([...POSITION_FIXTURE_TITLE_ORDER]);
    });
  });
});
