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
});
