import fs from "node:fs";
import path from "node:path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen, within } from "@testing-library/react";
import matter from "gray-matter";
import { expect, vi } from "vitest";

// plan (ayokoding-learn-revamp-01-navigation-and-display), Phase 3 RED (unit, S4) — step
// bindings for path-position-numbers.feature's "A course page in path context shows no
// catalogue number in course titles", rendering the course page chrome the way
// path-order-nav.steps.tsx does (same mocks and renderCoursePathPage setup) for the
// backend-track fixture path's three courses, but with every course title read from the real
// content/en/learn/courses/<slug>/_index.md frontmatter (node:fs + gray-matter) instead of a
// synthetic fixture. RED until the Phase 3 title-strip codemod runs: the real titles still
// carried their leading catalogue and pass numbers.

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

interface StoredManifest {
  pathId: string;
  arc: string;
  title: string;
  description: string;
  courseOrder: string[];
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
  manifests: [] as StoredManifest[],
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
import { PathRail } from "@/features/course-paths/shell/path-rail";
// eslint-disable-next-line import/first
import { SyllabusPreview } from "@/features/course-paths/shell/syllabus-preview";

const COURSES_ROOT = "content/en/learn/courses";
const COURSE_IDS = ["just-enough-bash", "backend-essentials", "sql-essentials"] as const;

// The e2e suite's fixture path manifest
// (apps/ayokoding-www-fe-e2e/fixtures/manifests/careers/immediately-effective/backend-track.json):
// exactly the three courses this plan binds S4 with, so backend-essentials sits at 2 of 3.
const BACKEND_TRACK_MANIFEST: StoredManifest = {
  pathId: "careers/immediately-effective/backend-track",
  arc: "immediately-effective",
  title: "Backend Track (Immediately-Effective)",
  description: "Fixture path whose courseOrder is exactly the three courses this binding renders.",
  courseOrder: ["just-enough-bash", "backend-essentials", "sql-essentials"],
};
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
const POSITION_FIXTURE_TITLE_ORDER: readonly string[] = BACKEND_TRACK_MANIFEST.courseOrder.map(
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
  ).toMatch(new RegExp(`^${position}\\s*(?:▸\\s*)?${title}$`, "u"));
}

/** A stale catalogue number (a leading two-digit index and middle dot) — tech-docs §4.1's closed list. */
const CATALOGUE_NUMBERED_TITLE = /^\d+\s*·\s/u;
/** A stale pass number (a leading pass index) — tech-docs §4.1's closed list. */
const PASS_NUMBERED_TITLE = /^Pass \d+ /u;

interface CourseFrontmatter {
  title: string;
  prerequisites: string[];
}

/** Read one course's real frontmatter (title + declared prerequisites) from the content tree. */
function readCourseFrontmatter(courseId: string): CourseFrontmatter {
  const raw = fs.readFileSync(path.join(process.cwd(), COURSES_ROOT, courseId, "_index.md"), "utf8");
  const { data } = matter(raw);
  return {
    title: typeof data.title === "string" ? data.title : "",
    prerequisites: Array.isArray(data.prerequisites)
      ? data.prerequisites.filter((candidate): candidate is string => typeof candidate === "string")
      : [],
  };
}

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/path-position-numbers.feature",
  ),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario("A course page in path context shows no catalogue number in course titles", ({ Given, When, Then, And }) => {
    interface RenderedSurfaces {
      courseId: string;
      h1Text: string;
      breadcrumbCrumbTexts: string[];
      prevNextLinkTexts: string[];
      prerequisiteLinkTexts: string[];
    }

    let renderedSurfaces: RenderedSurfaces[] = [];
    const readoutTextByCourseId = new Map<string, string>();

    Given("a reader opens a course in path context", () => {
      const frontmatterByCourseId = new Map<string, CourseFrontmatter>();
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
        const prerequisitesNav = within(screen.getByRole("navigation", { name: "Prerequisites" }));

        renderedSurfaces.push({
          courseId,
          h1Text: screen.getByRole("heading", { level: 1 }).textContent ?? "",
          breadcrumbCrumbTexts: [...breadcrumb.querySelectorAll("li")].map((crumb) => crumb.textContent ?? ""),
          // A prev/next link's text is "<Previous|Next label><course title>" — strip the
          // navigation label so the title-only patterns below test the title itself.
          prevNextLinkTexts: pageNav
            .getAllByRole("link")
            .map((link) => (link.textContent ?? "").replace(/^(Previous|Next)/u, "").trim()),
          prerequisiteLinkTexts: prerequisitesNav.getAllByRole("link").map((link) => link.textContent ?? ""),
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
  });

  // plan ayokoding-learn-revamp-01, Phase 4 RED (unit, S2) — the rail numbering binding.
  Scenario("The path rail numbers each course by its position in the path", ({ Given, When, Then, And }) => {
    Given("a reader opens a course in path context on a desktop-width viewport", () => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
      expect(window.innerWidth).toBeGreaterThanOrEqual(768);
    });

    When("the page renders", () => {
      cleanup();
      render(
        <PathRail
          locale="en"
          manifest={BACKEND_TRACK_MANIFEST}
          currentCourseId="backend-essentials"
          courseTitles={POSITION_FIXTURE_TITLES}
        />,
      );
    });

    Then("each rail row shows its position number before the course title", () => {
      const rail = screen.getByRole("navigation", { name: "Backend Track (Immediately-Effective) course list" });
      const rows = within(rail).getAllByRole("listitem");
      expect(rows).toHaveLength(POSITION_FIXTURE_ROWS.length);
      POSITION_FIXTURE_ROWS.forEach(({ position, title }, index) => {
        const row = rows[index];
        if (!row) throw new Error(`missing rail row ${index + 1}`);
        expectRowShowsPositionBeforeTitle(row, position, title);
        // The link keeps its aria-label={title}; the row number never leaks into the name
        // (tech-docs §4.2, Decision D4).
        expect(within(row).getByRole("link", { name: title })).toBeTruthy();
      });
    });

    And("the current course's row shows its own position number with the current-course marker", () => {
      const current = screen.getByRole("link", { name: "Backend Essentials" });
      expect(current.getAttribute("aria-current")).toBe("page");
      expect(current.textContent).toContain("▸");
      expect(current.className).toContain("bg-accent");
      // backend-essentials is position 2 of 3, and its number renders before the ▸ marker.
      expect(current.closest("li")?.textContent ?? "").toMatch(/^2\s*▸/u);
    });
  });

  // plan ayokoding-learn-revamp-01, Phase 4 RED (unit, S3) — the arc-preview numbering binding.
  Scenario("The arc card preview numbers its courses by their path position", ({ Given, When, Then, And }) => {
    Given("a fixture arc manifest lists exactly one role", () => {
      // The backend-track fixture manifest is the arc's single role; the preview renders its
      // course titles in courseOrder (the whole SyllabusPreview surface).
      expect(BACKEND_TRACK_MANIFEST.courseOrder).toHaveLength(3);
    });

    When("a reader opens that arc's landing page", () => {
      cleanup();
      render(<SyllabusPreview courseTitles={POSITION_FIXTURE_TITLE_ORDER} />);
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
