import { cleanup, render, screen, within } from "@testing-library/react";
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

// eslint-disable-next-line import/first
import { CategoryLanding } from "../../../../../src/features/course-paths/shell/category-landing";

afterEach(cleanup);

function manifest(
  overrides: Pick<PathManifest, "pathId" | "arc"> & Partial<Pick<PathManifest, "title">>,
): PathManifest {
  return manifestFixture({ description: "desc", ...overrides, title: overrides.title ?? overrides.pathId });
}

describe("CategoryLanding — careers instance (Cycle 3.1b-i, R7)", () => {
  const interviewReady = manifest({ pathId: "careers/interview-ready/role-a", arc: "interview-ready" });
  const immediatelyA = manifest({ pathId: "careers/immediately-effective/role-b", arc: "immediately-effective" });
  const immediatelyB = manifest({ pathId: "careers/immediately-effective/role-c", arc: "immediately-effective" });

  it("renders one ArcCard per arc, member roles previewed", () => {
    render(<CategoryLanding locale="en" category="careers" manifests={[interviewReady, immediatelyA, immediatelyB]} />);

    const nav = within(screen.getByRole("navigation", { name: "Careers arcs" }));
    const links = nav.getAllByRole("link");
    expect(links.length).toBe(2);
  });

  it("the immediately-effective arc card previews exactly two member roles", () => {
    render(<CategoryLanding locale="en" category="careers" manifests={[interviewReady, immediatelyA, immediatelyB]} />);

    // No `contentMap` is passed, so the arc title falls back to `humanizeKebabSlug` (UWT-001 fix) —
    // "Immediately Effective", not the raw "immediately-effective" slug.
    const card = screen.getByRole("link", { name: /immediately effective/i });
    expect(within(card).getAllByRole("listitem").length).toBe(2);
  });

  it("humanizes the arc title and role names instead of rendering raw kebab-case slugs (UWT-001 fix)", () => {
    render(<CategoryLanding locale="en" category="careers" manifests={[interviewReady, immediatelyA, immediatelyB]} />);

    expect(screen.getByRole("heading", { name: "Immediately Effective" })).toBeTruthy();
    expect(screen.queryByText("immediately-effective")).toBeNull();
    expect(screen.getByText("Role B")).toBeTruthy();
    expect(screen.queryByText("role-b")).toBeNull();
  });

  it("resolves an arc's humanized title from the given contentMap's _index.md entry, not the fallback humanizer", () => {
    const contentMap = new Map([
      [
        "en:learn/paths/careers/immediately-effective",
        {
          title: "Immediately-Effective",
          slug: "learn/paths/careers/immediately-effective",
          locale: "en",
          weight: 0,
          tags: [],
          draft: false,
          isSection: true,
          filePath: "/tmp/x.md",
        },
      ],
    ]);

    render(
      <CategoryLanding
        locale="en"
        category="careers"
        manifests={[interviewReady, immediatelyA, immediatelyB]}
        contentMap={contentMap}
      />,
    );

    expect(screen.getByRole("heading", { name: "Immediately-Effective" })).toBeTruthy();
  });

  it("renders the shared empty state when no careers manifest is loaded", () => {
    render(<CategoryLanding locale="en" category="careers" manifests={[]} />);

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Careers arcs" })).toBeNull();
  });

  it("gives an ArcCard a hue-coded left border matching its arc's documented DD-50 hue (DWT-001 fix, phase-5 rule-15 design-tester retest)", () => {
    render(<CategoryLanding locale="en" category="careers" manifests={[interviewReady, immediatelyA, immediatelyB]} />);

    const link = screen.getByRole("link", { name: /immediately effective/i });
    const card = link.firstElementChild as HTMLElement;
    expect(card.className).toContain("border-l-4");
    expect(card.className).toContain("border-l-[var(--hue-current)]");
    expect(card.getAttribute("style")).toContain("--hue-current: var(--hue-teal)");
  });

  it("localizes the 'Explore arc' CTA and 'Explore this arc's roles' description on the id locale (DWT-003 fix, phase-5 rule-15 design-tester retest)", () => {
    render(<CategoryLanding locale="id" category="careers" manifests={[interviewReady, immediatelyA, immediatelyB]} />);

    expect(screen.getAllByText("Jelajahi arc").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jelajahi peran arc ini").length).toBeGreaterThan(0);
  });
});

describe("CategoryLanding — skills instance (Cycle 3.1b-ii, R7/R8)", () => {
  const subjectA = manifest({ pathId: "skills/subject-a", arc: "track-a", title: "Subject A" });
  const subjectB = manifest({ pathId: "skills/subject-b", arc: "track-b", title: "Subject B" });

  it("states the fixed-arc ramp promise once, with no arc-selection control anywhere", () => {
    render(<CategoryLanding locale="en" category="skills" manifests={[subjectA, subjectB]} />);

    expect(screen.queryByRole("navigation", { name: "Careers arcs" })).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("renders the shared PathCard hub grid for the subject manifests", () => {
    render(<CategoryLanding locale="en" category="skills" manifests={[subjectA, subjectB]} />);

    const nav = within(screen.getByRole("navigation", { name: "Skills paths" }));
    expect(nav.getAllByRole("link").length).toBe(2);
  });

  it("renders the shared empty state when no skills manifest is loaded", () => {
    render(<CategoryLanding locale="en" category="skills" manifests={[]} />);

    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
