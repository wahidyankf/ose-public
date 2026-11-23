import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react";
import { expect, vi } from "vitest";

// course-paths plan (ayokoding-learning-path-03-navigation-ui), Cycle 2.6 — step binding for
// invalid-path-fallback.feature, reusing the fixture already proven in route-path-context.test.tsx.

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

// The not-found page is Next's notFound(): the unit binding asserts the route calls it, and a
// sentinel error stands in for the framework's 404 response.
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  usePathname: () => "/en/learn/courses/just-enough-python",
  useSearchParams: () => new URLSearchParams(),
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

vi.mock("@/lib/trpc/server", async () => {
  const { TRPCError } = await import("@trpc/server");
  return {
    serverCaller: {
      content: {
        getBySlug: vi.fn(async ({ slug }: { slug: string }) => {
          const page = pages.get(slug);
          if (!page) throw new TRPCError({ code: "NOT_FOUND", message: `no page for slug ${slug}` });
          return page;
        }),
        getTree: vi.fn(async () => []),
      },
    },
  };
});

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
import ContentPage from "@/app/[locale]/(content)/[...slug]/page";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/invalid-path-fallback.feature",
  ),
);

describeFeature(feature, ({ Scenario, ScenarioOutline }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/invalid-path-fallback.feature: An invalid path context falls back to the canonical view
  Scenario("An invalid path context falls back to the canonical view", ({ Given, When, Then, And }) => {
    let jsx: React.ReactElement;
    let requestedPath = "";

    Given("a reader opens a course URL with a path context that names no known path", () => {
      requestedPath = "careers/does-not-exist/anywhere";
      expect(requestedPath).not.toBe(fixtureManifest.pathId);
    });

    When("the course page renders", async () => {
      jsx = await renderCoursePathPage({
        locale: "en",
        slug: ["learn", "courses", "just-enough-python"],
        search: { path: requestedPath },
      });
      cleanup();
      render(jsx);
    });

    Then("the course renders the canonical standalone view", () => {
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Just Enough Python");
      expect(screen.queryByRole("navigation", { name: "Page navigation" })).toBeNull();
    });

    And("no error is shown", () => {
      expect(screen.queryByRole("alert")).toBeNull();
      expect(document.body.textContent?.toLowerCase()).not.toContain("error");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/course-paths/invalid-path-fallback.feature: A paths URL that names no known category, arc, or path shows the not-found page
  ScenarioOutline(
    "A paths URL that names no known category, arc, or path shows the not-found page",
    ({ Given, Then }, variables) => {
      Given("a reader opens the paths URL <url>", () => {
        expect(String(variables.url).startsWith("/en/learn/paths/")).toBe(true);
      });

      Then("the not-found page is shown with a 404 status", async () => {
        const slug = String(variables.url)
          .replace(/^\/en\//, "")
          .split("/");
        await expect(ContentPage({ params: Promise.resolve({ locale: "en", slug }) })).rejects.toThrow(
          "NEXT_NOT_FOUND",
        );
      });
    },
  );
});
