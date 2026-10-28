import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PathManifest } from "../../../../../src/features/course-paths/core/schemas";
import { manifestFixture } from "../manifest-fixture";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

let mockPathname = "/en/browse";
let mockSearchParams = new URLSearchParams();
let queryReads = 0;

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => {
    queryReads += 1;
    return mockSearchParams;
  },
}));

// eslint-disable-next-line import/first
import { SidebarHost } from "../../../../../src/features/course-paths/shell/sidebar-host";

afterEach(cleanup);

const manifest: PathManifest = manifestFixture({
  pathId: "skills/python-fundamentals",
  arc: "python-fundamentals",
  title: "Python Fundamentals",
  description: "Learn Python from the ground up.",
  courses: ["just-enough-python"],
});
const secondManifest: PathManifest = manifestFixture({
  pathId: "skills/python-next",
  arc: "python-next",
  title: "Python Next",
  description: "Another path containing the same course.",
  courses: ["just-enough-python"],
});

describe("SidebarHost (Cycle 2.8 — content swap into the existing desktop rail host)", () => {
  it("renders the passed-through children (the generic Sidebar) when there is no active path context", () => {
    mockPathname = "/en/browse";
    mockSearchParams = new URLSearchParams();

    render(
      <SidebarHost locale="en" manifests={[manifest]} courseTitles={{}}>
        <nav aria-label="Sidebar navigation">generic tree</nav>
      </SidebarHost>,
    );

    expect(screen.getByRole("navigation", { name: "Sidebar navigation" })).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: /course list/i })).toBeNull();
  });

  it("renders the PathRail instead of children when the current URL has an active path context", () => {
    mockPathname = "/en/learn/courses/just-enough-python";
    mockSearchParams = new URLSearchParams({ path: manifest.pathId });

    render(
      <SidebarHost locale="en" manifests={[manifest]} courseTitles={{ "just-enough-python": "Just Enough Python" }}>
        <nav aria-label="Sidebar navigation">generic tree</nav>
      </SidebarHost>,
    );

    expect(screen.getByRole("navigation", { name: "Python Fundamentals course list" })).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Sidebar navigation" })).toBeNull();
  });

  it.each(["/en/learn/courses", "/en/browse", "/en/learn/courses-extra/git", "/id/learn/courses/just-enough-python"])(
    "does not read path queries on an ineligible route: %s",
    (pathname) => {
      mockPathname = pathname;
      mockSearchParams = new URLSearchParams({ path: manifest.pathId });
      queryReads = 0;
      render(
        <SidebarHost locale="en" manifests={[manifest]}>
          <nav aria-label="Sidebar navigation">generic tree</nav>
        </SidebarHost>,
      );
      expect(screen.getByRole("navigation", { name: "Sidebar navigation" })).toBeTruthy();
      expect(queryReads).toBe(0);
    },
  );

  it("updates the direct course view when the query is cleared, invalid, or omits the course", () => {
    mockPathname = "/en/learn/courses/just-enough-python";
    mockSearchParams = new URLSearchParams({ path: manifest.pathId });
    const view = () => (
      <SidebarHost locale="en" manifests={[manifest]} courseTitles={{ "just-enough-python": "Just Enough Python" }}>
        <nav aria-label="Sidebar navigation">generic tree</nav>
      </SidebarHost>
    );
    const { rerender } = render(view());
    expect(screen.getByRole("navigation", { name: "Python Fundamentals course list" })).toBeTruthy();
    mockSearchParams = new URLSearchParams();
    rerender(view());
    expect(screen.getByRole("navigation", { name: "Sidebar navigation" })).toBeTruthy();
    mockSearchParams = new URLSearchParams({ path: "unknown" });
    rerender(view());
    expect(screen.getByRole("navigation", { name: "Sidebar navigation" })).toBeTruthy();
    mockSearchParams = new URLSearchParams({ path: manifest.pathId });
    mockPathname = "/en/learn/courses/other-course";
    rerender(view());
    expect(screen.getByRole("navigation", { name: "Sidebar navigation" })).toBeTruthy();
  });

  it("switches between valid paths and reads course subpage queries", () => {
    mockPathname = "/en/learn/courses/just-enough-python";
    mockSearchParams = new URLSearchParams({ path: manifest.pathId });
    const view = () => (
      <SidebarHost locale="en" manifests={[manifest, secondManifest]}>
        <nav aria-label="Sidebar navigation">generic tree</nav>
      </SidebarHost>
    );
    const { rerender } = render(view());
    expect(screen.getByRole("navigation", { name: "Python Fundamentals course list" })).toBeTruthy();
    mockSearchParams = new URLSearchParams({ path: secondManifest.pathId });
    rerender(view());
    expect(screen.getByRole("navigation", { name: "Python Next course list" })).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Python Fundamentals course list" })).toBeNull();
    mockPathname = "/en/learn/courses/just-enough-python/lesson";
    queryReads = 0;
    rerender(view());
    expect(queryReads).toBeGreaterThan(0);
  });
});
