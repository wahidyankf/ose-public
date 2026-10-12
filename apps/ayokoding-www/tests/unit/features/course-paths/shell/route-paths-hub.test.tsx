import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// <ROUTE>-level integration tests (course-paths plan, Phase 3) for the hub/category/arc/path-landing
// dispatch — same established pattern as `route-path-context.test.tsx`: call the page function
// directly and `render()` its returned JSX, with `serverCaller`/`createTRPCContext`/manifest loading
// mocked.

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

const { manifests, contentMap } = vi.hoisted(() => {
  // Phase-4 shape: the mocked manifests must satisfy the domain `PathManifest` contract the
  // terminal landing now renders from (`phases` for the sections, `assumes` for the note) — the
  // pre-phase `{courseOrder}`-only literal crashes `corePhases`/`assumes` iteration.
  function m(pathId: string, arc: string, courseOrder: string[] = []) {
    return {
      pathId,
      arc,
      title: `Title for ${pathId}`,
      description: `Description for ${pathId}`,
      assumes: [],
      phases: [{ id: "phase-a", title: "Phase A", kind: "core", courses: courseOrder }],
      courseOrder,
    };
  }

  const manifestList = [
    m("careers/interview-ready/solo-role", "interview-ready", ["just-enough-python"]),
    m("careers/immediately-effective/role-a", "immediately-effective", ["just-enough-python"]),
    m("careers/immediately-effective/role-b", "immediately-effective", ["just-enough-bash"]),
    m("skills/example-subject", "example-track", ["just-enough-python"]),
  ];

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
    ["en:learn/courses/just-enough-bash", meta("learn/courses/just-enough-bash", "Just Enough Bash")],
  ]);

  return { manifests: manifestList, contentMap: map };
});

const { MockTRPCError } = vi.hoisted(() => {
  class MockTRPCError extends Error {
    code: string;
    constructor({ code, message }: { code: string; message?: string }) {
      super(message);
      this.code = code;
    }
  }
  return { MockTRPCError };
});

vi.mock("@/lib/trpc/server", () => ({
  serverCaller: {
    content: {
      getBySlug: vi.fn(async () => {
        throw new MockTRPCError({ code: "NOT_FOUND", message: "not found" });
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
  loadManifests: vi.fn().mockResolvedValue(manifests),
  defaultManifestsDir: () => "unused-in-test",
}));

vi.mock("@trpc/server", () => ({
  TRPCError: MockTRPCError,
}));

// eslint-disable-next-line import/first
import ContentPage from "@/app/[locale]/(content)/[...slug]/page";

afterEach(cleanup);

function renderPathsSlug(slug: string[]) {
  return ContentPage({
    params: Promise.resolve({ locale: "en", slug }),
  });
}

describe("<ROUTE> paths-hub/category/arc/path-landing dispatch (Phase 3)", () => {
  it("renders the paths hub, grouped by category, at learn/paths", async () => {
    const jsx = await renderPathsSlug(["learn", "paths"]);
    render(jsx);

    expect(screen.getByRole("heading", { level: 2, name: /careers/i })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: /skills/i })).toBeTruthy();
  });

  it("renders the careers category landing (arc chooser) at learn/paths/careers", async () => {
    const jsx = await renderPathsSlug(["learn", "paths", "careers"]);
    render(jsx);

    const nav = within(screen.getByRole("navigation", { name: "Careers arcs" }));
    expect(nav.getAllByRole("link").length).toBe(2);
  });

  it("renders the skills category landing (no chooser) at learn/paths/skills", async () => {
    const jsx = await renderPathsSlug(["learn", "paths", "skills"]);
    render(jsx);

    expect(screen.queryByRole("navigation", { name: "Careers arcs" })).toBeNull();
    expect(screen.getByRole("navigation", { name: "Skills paths" })).toBeTruthy();
  });

  it("renders the immediately-effective arc landing with both role cards at learn/paths/careers/immediately-effective", async () => {
    const jsx = await renderPathsSlug(["learn", "paths", "careers", "immediately-effective"]);
    render(jsx);

    const nav = within(screen.getByRole("navigation", { name: "immediately-effective paths" }));
    expect(nav.getAllByRole("link").length).toBe(2);
  });

  it("renders the terminal path landing for a matching manifest at learn/paths/careers/interview-ready/solo-role", async () => {
    const jsx = await renderPathsSlug(["learn", "paths", "careers", "interview-ready", "solo-role"]);
    render(jsx);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Title for careers/interview-ready/solo-role");
  });

  it("renders the terminal path landing for a 2-segment skills manifest at learn/paths/skills/example-subject", async () => {
    const jsx = await renderPathsSlug(["learn", "paths", "skills", "example-subject"]);
    render(jsx);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Title for skills/example-subject");
  });
});
