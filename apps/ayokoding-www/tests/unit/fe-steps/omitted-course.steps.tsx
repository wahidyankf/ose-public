import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";

// course-paths plan (ayokoding-learning-path-03-navigation-ui), Cycle 2.7 — step binding for
// omitted-course.feature, reusing the fixture already proven in route-path-context.test.tsx.

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
    courseOrder: ["just-enough-python"],
  };

  function meta(slug: string, title: string) {
    return {
      title,
      slug,
      locale: "en",
      weight: 0,
      tags: [],
      draft: false,
      isSection: false,
      filePath: `/tmp/${slug}.md`,
    };
  }

  const map = new Map([
    ["en:learn/courses/just-enough-python", meta("learn/courses/just-enough-python", "Just Enough Python")],
    // Deliberately absent from `manifest.courseOrder` — the scenario's omitted course.
    ["en:learn/courses/capstone-forge-ready", meta("learn/courses/capstone-forge-ready", "Capstone: Forge Ready")],
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

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/omitted-course.feature"),
);

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/omitted-course.feature: A course omitted from a path shows no path nav for that path
  Scenario("A course omitted from a path shows no path nav for that path", ({ Given, When, Then, And }) => {
    let jsx: React.ReactElement;

    Given("a course is not listed in a given path's manifest", () => {
      expect(fixtureManifest.courseOrder).not.toContain("capstone-forge-ready");
      expect(contentMap.has("en:learn/courses/capstone-forge-ready")).toBe(true);
    });

    When("a reader opens that course with that path's context", async () => {
      jsx = await renderCoursePathPage({
        locale: "en",
        slug: ["learn", "courses", "capstone-forge-ready"],
        search: { path: fixtureManifest.pathId },
      });
      cleanup();
      render(jsx);
    });

    Then("the course renders the canonical standalone view", () => {
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Capstone: Forge Ready");
      expect(screen.queryByText("Python Fundamentals")).toBeNull();
    });

    And("neither the path rail nor the path banner is shown for that path", () => {
      expect(screen.queryByRole("navigation", { name: /course list/i })).toBeNull();
      expect(screen.queryByText(/on path/i)).toBeNull();
    });
  });
});
