import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Cycle 2.10 — the no-path regression guard, the single most important test in this plan
// (tech-docs.md §Screen 3): asserted in BOTH directions, so a permanently-swapped host would
// fail this test exactly as surely as a host that never swaps.

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

let mockPathname = "/en/browse";
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

// MobileNav fetches the generic content tree client-side on open — not this guard's concern.
vi.mock("@/lib/trpc/client", () => ({
  trpcClient: {
    content: {
      getTree: { query: vi.fn().mockResolvedValue([]) },
    },
  },
}));

const { fixtureManifest, contentMap, pages } = vi.hoisted(() => {
  // Hand-expanded (not manifestFixture): vi.hoisted factories run before imports, so the
  // fixture helper is unreachable here. `phases` mirrors `courseOrder` exactly, the way the
  // schema's legacy normalization derives it.
  const manifest = {
    pathId: "skills/python-fundamentals",
    arc: "python-fundamentals",
    title: "Python Fundamentals",
    description: "Learn Python from the ground up.",
    assumes: [],
    phases: [
      {
        id: "phase-a",
        title: "Phase A",
        kind: "core" as const,
        outcome: { can: "complete this fixture path" },
        courses: ["just-enough-python"],
      },
    ],
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

vi.mock("@/features/navigation/shell/toc", () => ({
  TableOfContents: () => null,
}));

// eslint-disable-next-line import/first
import { SidebarHost } from "../../../../../src/features/course-paths/shell/sidebar-host";
// eslint-disable-next-line import/first
import { MobileNav } from "@/features/app-shell/shell/mobile-nav";
// eslint-disable-next-line import/first
import { renderCoursePathPage } from "../../../render-course-path-page";

afterEach(() => {
  cleanup();
  mockPathname = "/en/browse";
  mockSearchParams = new URLSearchParams();
});

const courseTitles = { "just-enough-python": "Just Enough Python" };

describe("Cycle 2.10 — no-path regression guard (direction 1: no ?path=)", () => {
  it("SidebarHost renders the generic Sidebar children, not the rail", () => {
    mockPathname = "/en/learn/courses/just-enough-python";
    mockSearchParams = new URLSearchParams();

    render(
      <SidebarHost locale="en" manifests={[fixtureManifest]} courseTitles={courseTitles}>
        <nav aria-label="Sidebar navigation">generic tree</nav>
      </SidebarHost>,
    );

    expect(screen.getByRole("navigation", { name: "Sidebar navigation" })).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: /course list/i })).toBeNull();
  });

  it("MobileNav renders SidebarTree (Menu + tree), not the rail", async () => {
    mockPathname = "/en/learn/courses/just-enough-python";
    mockSearchParams = new URLSearchParams();

    render(
      <MobileNav
        locale="en"
        open={true}
        onOpenChange={() => {}}
        manifests={[fixtureManifest]}
        courseTitles={courseTitles}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: /course list/i })).toBeNull();
  });

  it("<ROUTE> shows no path breadcrumb segment and no path banner", async () => {
    mockPathname = "/en/learn/courses/just-enough-python";
    mockSearchParams = new URLSearchParams();

    const jsx = await renderCoursePathPage({
      locale: "en",
      slug: ["learn", "courses", "just-enough-python"],
      search: {},
    });
    render(jsx);

    // No path crumb in the breadcrumb (canonical trail only) — "Python Fundamentals" may
    // legitimately appear elsewhere as a "this course is part of" badge (Cycle 2.5); the
    // regression this guard protects is specifically the breadcrumb and the banner.
    const breadcrumb = within(screen.getByRole("navigation", { name: "Breadcrumb" }));
    expect(breadcrumb.queryByText("Python Fundamentals")).toBeNull();
    expect(screen.queryByText(/on path/i)).toBeNull();
  });
});

describe("Cycle 2.10 — no-path regression guard (direction 2: valid ?path=)", () => {
  it("SidebarHost renders the rail, not the generic Sidebar children", () => {
    mockPathname = "/en/learn/courses/just-enough-python";
    mockSearchParams = new URLSearchParams({ path: fixtureManifest.pathId });

    render(
      <SidebarHost locale="en" manifests={[fixtureManifest]} courseTitles={courseTitles}>
        <nav aria-label="Sidebar navigation">generic tree</nav>
      </SidebarHost>,
    );

    expect(screen.getByRole("navigation", { name: "Python Fundamentals course list" })).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Sidebar navigation" })).toBeNull();
  });

  it("MobileNav renders the rail, not SidebarTree", async () => {
    mockPathname = "/en/learn/courses/just-enough-python";
    mockSearchParams = new URLSearchParams({ path: fixtureManifest.pathId });

    render(
      <MobileNav
        locale="en"
        open={true}
        onOpenChange={() => {}}
        manifests={[fixtureManifest]}
        courseTitles={courseTitles}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Python Fundamentals course list" })).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Mobile navigation" })).toBeNull();
  });

  it("<ROUTE> shows the path breadcrumb segment and the path banner", async () => {
    mockPathname = "/en/learn/courses/just-enough-python";
    mockSearchParams = new URLSearchParams({ path: fixtureManifest.pathId });

    const jsx = await renderCoursePathPage({
      locale: "en",
      slug: ["learn", "courses", "just-enough-python"],
      search: { path: fixtureManifest.pathId },
    });
    render(jsx);

    expect(screen.getByRole("link", { name: "Python Fundamentals" })).toBeTruthy();
    expect(screen.getByText(/on path/i)).toBeTruthy();
  });
});
