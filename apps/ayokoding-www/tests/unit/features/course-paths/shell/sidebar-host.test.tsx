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

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
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
});
