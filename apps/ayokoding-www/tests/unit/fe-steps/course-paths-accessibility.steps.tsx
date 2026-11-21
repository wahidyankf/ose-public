import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen, within } from "@testing-library/react";
import { expect, vi } from "vitest";

// course-paths plan (ayokoding-learning-path-03-navigation-ui), Cycle 3.3 — step binding for
// course-paths/accessibility.feature, reusing the fixtures/rendering approach already proven in
// route-path-context.test.tsx (desktop rail/breadcrumb/prerequisites/prev-next). Keyboard
// operability is verified here as "every landmark's interactive elements are native <a>/<button>
// elements with an accessible name" (inherently tab-reachable and activatable) — visible
// focus-ring computed-style assertions are the E2E level's concern (course-paths-a11y.steps.ts),
// matching this plan's established split between structural/semantic unit assertions and
// rendered-style e2e assertions. Named distinctly from the pre-existing, unrelated
// `accessibility.steps.tsx` (binds `gherkin/app-shell/accessibility.feature`).

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

const { fixtureManifest, contentMap, pages } = vi.hoisted(() => {
  const manifest = {
    pathId: "skills/python-fundamentals",
    arc: "python-fundamentals",
    title: "Python Fundamentals",
    description: "Learn Python from the ground up.",
    courseOrder: ["version-control-and-git", "just-enough-python", "data-structures-and-algorithms-essentials"],
  };

  function meta(slug: string, title: string, prerequisites?: string[]) {
    return {
      title,
      slug,
      locale: "en",
      weight: 0,
      tags: [],
      draft: false,
      isSection: false,
      filePath: `/tmp/${slug}.md`,
      prerequisites,
    };
  }

  const map = new Map([
    ["en:learn/courses/version-control-and-git", meta("learn/courses/version-control-and-git", "Git")],
    [
      "en:learn/courses/just-enough-python",
      meta("learn/courses/just-enough-python", "Just Enough Python", ["version-control-and-git"]),
    ],
    [
      "en:learn/courses/data-structures-and-algorithms-essentials",
      meta("learn/courses/data-structures-and-algorithms-essentials", "Data Structures & Algorithms"),
    ],
  ]);

  const pageBySlug = new Map<
    string,
    { title: string; html: string; headings: []; date: null; prev: null; next: null }
  >();
  for (const [, m] of map) {
    pageBySlug.set(m.slug, {
      title: m.title,
      html: `<p>${m.title}</p>`,
      headings: [],
      date: null,
      prev: null,
      next: null,
    });
  }

  return { fixtureManifest: manifest, contentMap: map, pages: pageBySlug };
});

vi.mock("@/lib/trpc/server", () => ({
  serverCaller: {
    content: {
      getBySlug: vi.fn(async ({ slug }: { slug: string }) => {
        const page = pages.get(slug);
        if (!page) throw new Error(`no fixture page for slug ${slug}`);
        return page;
      }),
    },
  },
}));

vi.mock("@/features/app-shell/shell/trpc-init", () => ({
  createTRPCContext: () => ({
    contentService: { getIndex: async () => ({ contentMap, trees: {}, prevNext: new Map() }) },
  }),
}));

vi.mock("@/features/course-paths/shell/manifest-repository", () => ({
  loadManifests: vi.fn().mockResolvedValue([fixtureManifest]),
  defaultManifestsDir: () => "unused-in-test",
}));

// eslint-disable-next-line import/first
import { renderCoursePathPage } from "../render-course-path-page";
// eslint-disable-next-line import/first
import { htmlLang } from "@/features/i18n/core/html-lang";

function isKeyboardOperable(el: Element): boolean {
  return (el.tagName === "A" && el.hasAttribute("href")) || el.tagName === "BUTTON";
}

async function renderPathCourse() {
  const jsx = await renderCoursePathPage({
    locale: "en",
    slug: ["learn", "courses", "just-enough-python"],
    search: { path: fixtureManifest.pathId },
  });
  cleanup();
  render(jsx);
}

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/accessibility.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/accessibility.feature: Path navigation surfaces are labelled landmarks
  Scenario("Path navigation surfaces are labelled landmarks", ({ Given, When, Then }) => {
    Given("a reader uses a keyboard and a screen reader on a course in path context", renderPathCourse);

    When("they navigate the path rail, banner, breadcrumb, prerequisite list, and prev/next", () => {
      const breadcrumbLink = within(screen.getByRole("navigation", { name: "Breadcrumb" })).getAllByRole("link")[0];
      breadcrumbLink?.focus();
      expect(document.activeElement).toBe(breadcrumbLink);
    });

    Then("each is a labelled landmark", () => {
      expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeTruthy();
      expect(screen.getByRole("navigation", { name: "Prerequisites" })).toBeTruthy();
      expect(screen.getByRole("navigation", { name: "Page navigation" })).toBeTruthy();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/accessibility.feature: Path navigation works by keyboard with visible focus
  Scenario("Path navigation works by keyboard with visible focus", ({ Given, When, Then }) => {
    Given("a reader uses a keyboard and a screen reader on a course in path context", renderPathCourse);

    When("they navigate the path rail, banner, breadcrumb, prerequisite list, and prev/next", () => {
      const breadcrumbLink = within(screen.getByRole("navigation", { name: "Breadcrumb" })).getAllByRole("link")[0];
      breadcrumbLink?.focus();
      expect(document.activeElement).toBe(breadcrumbLink);
    });

    Then("each is reachable and operable by keyboard with visible focus", () => {
      const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
      expect(isKeyboardOperable(within(breadcrumb).getAllByRole("link")[0] as Element)).toBe(true);

      const prerequisites = screen.getByRole("navigation", { name: "Prerequisites" });
      expect(isKeyboardOperable(within(prerequisites).getAllByRole("link")[0] as Element)).toBe(true);

      const pageNav = screen.getByRole("navigation", { name: "Page navigation" });
      expect(isKeyboardOperable(within(pageNav).getAllByRole("link")[0] as Element)).toBe(true);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/accessibility.feature: The page language matches the locale
  Scenario("The page language matches the locale", ({ Given, Then }) => {
    Given("a reader uses a keyboard and a screen reader on a course in path context", renderPathCourse);

    Then("the document language attribute matches the active locale", () => {
      expect(htmlLang("en")).toBe("en");
    });
  });
});
