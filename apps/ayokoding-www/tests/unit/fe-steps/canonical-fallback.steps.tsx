import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen, within } from "@testing-library/react";
import { expect, vi } from "vitest";

// course-paths plan (ayokoding-learning-path-03-navigation-ui), Cycle 2.5 — step bindings for
// canonical-fallback.feature, reusing the fixtures/approach already proven in
// route-path-context.test.tsx and sidebar-host.test.tsx.

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

const { skillsManifest, careersManifest, contentMap, pages } = vi.hoisted(() => {
  const skills = {
    pathId: "skills/python-fundamentals",
    arc: "python-fundamentals",
    title: "Python Fundamentals",
    description: "Learn Python from the ground up.",
    courseOrder: ["version-control-and-git", "just-enough-python"],
  };
  const careers = {
    pathId: "careers/interview-ready/software-engineer",
    arc: "interview-ready",
    title: "Interview-Ready Software Engineer",
    description: "Get interview-ready.",
    courseOrder: ["just-enough-python"],
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

  return { skillsManifest: skills, careersManifest: careers, contentMap: map, pages: pageBySlug };
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
  loadManifests: vi.fn().mockResolvedValue([skillsManifest, careersManifest]),
  defaultManifestsDir: () => "unused-in-test",
}));

// eslint-disable-next-line import/first
import ContentPage from "@/app/[locale]/(content)/[...slug]/page";
// eslint-disable-next-line import/first
import { SidebarHost } from "@/features/course-paths/shell/sidebar-host";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/course-paths/canonical-fallback.feature",
  ),
);

describeFeature(feature, ({ Scenario }) => {
  Scenario("A course deep-linked without path context renders the canonical view", ({ Given, When, Then, And }) => {
    let jsx: React.ReactElement;

    Given("a reader opens a course URL /en/learn/courses/<course-id> with no path context query parameter", () => {
      const requestedUrl = new URL("https://www.ayokoding.com/en/learn/courses/just-enough-python");
      expect(requestedUrl.pathname).toBe("/en/learn/courses/just-enough-python");
      expect(requestedUrl.searchParams.has("path")).toBe(false);
    });

    When("the course page renders", async () => {
      jsx = await ContentPage({
        params: Promise.resolve({ locale: "en", slug: ["learn", "courses", "just-enough-python"] }),
      });
      cleanup();
      render(jsx);
    });

    Then("the course body renders in full with the content-tree breadcrumb and its prerequisite list", () => {
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Just Enough Python");
      expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeTruthy();
      const prereqs = within(screen.getByRole("navigation", { name: "Prerequisites" }));
      expect(prereqs.getByRole("link", { name: "Git" })).toBeTruthy();
    });

    And('a "this course is part of" affordance lists every path that includes the course', () => {
      const partOf = within(screen.getByRole("navigation", { name: "This course is part of" }));
      expect(partOf.getByRole("link", { name: "Python Fundamentals" })).toBeTruthy();
      expect(partOf.getByRole("link", { name: "Interview-Ready Software Engineer" })).toBeTruthy();
    });
  });

  Scenario(
    "A course opened without path context renders the generic sidebar unchanged",
    ({ Given, When, Then, And }) => {
      Given("a reader opens a canonical course URL with no path context query parameter", () => {
        mockPathname = "/en/learn/courses/just-enough-python";
        mockSearchParams = new URLSearchParams();
      });

      When("the page renders", () => {
        cleanup();
        render(
          <SidebarHost locale="en" manifests={[skillsManifest, careersManifest]} courseTitles={{}}>
            <nav aria-label="Sidebar navigation">generic tree</nav>
          </SidebarHost>,
        );
      });

      Then("the left sidebar shows the generic content tree exactly as it does elsewhere in the site", () => {
        expect(screen.getByRole("navigation", { name: "Sidebar navigation" })).toBeTruthy();
      });

      And("no path rail, path readout, or path breadcrumb segment appears", () => {
        expect(screen.queryByRole("navigation", { name: /course list/i })).toBeNull();
        expect(screen.queryByText(/on path/i)).toBeNull();
      });
    },
  );
});
