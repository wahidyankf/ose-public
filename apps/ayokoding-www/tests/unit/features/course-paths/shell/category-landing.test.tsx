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

describe("CategoryLanding — careers instance (Cycle 3.1b-i, R7; plan 04 Phase 7)", () => {
  const interviewReady = manifest({ pathId: "careers/interview-ready/role-a", arc: "interview-ready" });
  const immediatelyA = manifest({ pathId: "careers/immediately-effective/role-b", arc: "immediately-effective" });
  const immediatelyB = manifest({ pathId: "careers/immediately-effective/role-c", arc: "immediately-effective" });

  it("renders one section per arc, each arc heading linking to the arc page", () => {
    render(<CategoryLanding locale="en" category="careers" manifests={[interviewReady, immediatelyA, immediatelyB]} />);

    const nav = within(screen.getByRole("navigation", { name: "Careers arcs" }));
    const headings = nav.getAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual(["Interview Ready", "Immediately Effective"]);
    expect(screen.getByRole("link", { name: "Interview Ready" }).getAttribute("href")).toBe(
      "/en/learn/paths/careers/interview-ready",
    );
    expect(screen.getByRole("link", { name: "Immediately Effective" }).getAttribute("href")).toBe(
      "/en/learn/paths/careers/immediately-effective",
    );
  });

  it("shows exactly two path cards in the immediately-effective section", () => {
    const { container } = render(
      <CategoryLanding locale="en" category="careers" manifests={[interviewReady, immediatelyA, immediatelyB]} />,
    );

    const section = container.querySelector("section[aria-labelledby='careers-arc-immediately-effective']");
    expect(section?.querySelectorAll(":scope > ul > li").length).toBe(2);
    // Every card is the shared `LearnPathCard`: the title links to the path page, and the card
    // carries the "View path" control the Learn home's cards use.
    expect(
      within(section as HTMLElement)
        .getByRole("link", { name: "careers/immediately-effective/role-b" })
        .getAttribute("href"),
    ).toBe("/en/learn/paths/careers/immediately-effective/role-b");
    expect(within(section as HTMLElement).getAllByRole("link", { name: /View path/ }).length).toBe(2);
  });

  it("no longer renders the arc-chooser cards it replaced (no arc CTA, no course-count badge)", () => {
    render(<CategoryLanding locale="en" category="careers" manifests={[interviewReady, immediatelyA, immediatelyB]} />);

    expect(screen.queryByText("Explore arc")).toBeNull();
    expect(screen.queryByText("Explore this arc's roles")).toBeNull();
    expect(screen.queryByText(/^\~\d+ courses$/)).toBeNull();
    expect(screen.queryByRole("link", { name: /Explore the .* arc/ })).toBeNull();
  });

  it("humanizes the arc title instead of rendering the raw kebab-case slug (UWT-001 fix)", () => {
    render(<CategoryLanding locale="en" category="careers" manifests={[interviewReady, immediatelyA, immediatelyB]} />);

    expect(screen.getByRole("heading", { name: "Immediately Effective" })).toBeTruthy();
    expect(screen.queryByText("immediately-effective")).toBeNull();
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

  it("localizes the path cards' controls on the id locale", () => {
    render(<CategoryLanding locale="id" category="careers" manifests={[interviewReady, immediatelyA, immediatelyB]} />);

    expect(screen.getAllByRole("link", { name: /Lihat jalur/ }).length).toBe(3);
    expect(screen.queryByRole("link", { name: /View path/ })).toBeNull();
  });
});

describe("CategoryLanding — skills instance (Cycle 3.1b-ii, R7/R8; plan 04 Phase 7)", () => {
  const subjectA = manifest({ pathId: "skills/subject-a", arc: "track-a", title: "Subject A" });
  const subjectB = manifest({ pathId: "skills/subject-b", arc: "track-b", title: "Subject B" });

  it("states the fixed-arc ramp promise once, with no arc-selection control anywhere", () => {
    render(<CategoryLanding locale="en" category="skills" manifests={[subjectA, subjectB]} />);

    expect(screen.getByText(/Get up and running fast on the ramp/)).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Careers arcs" })).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("renders one shared learning path card plus a ramp milestone strip per subject", () => {
    render(<CategoryLanding locale="en" category="skills" manifests={[subjectA, subjectB]} />);

    const nav = within(screen.getByRole("navigation", { name: "Skills paths" }));
    expect(nav.getAllByRole("link", { name: "Subject A" })).toHaveLength(1);
    expect(nav.getAllByRole("link", { name: "Subject B" })).toHaveLength(1);
    expect(nav.getAllByRole("link", { name: /View path/ }).length).toBe(2);
    // The ramp preview stays: three milestones (Dangerous, Comfortable, Confident) per card.
    expect(nav.getAllByText("Dangerous").length).toBe(2);
    expect(nav.getAllByText("Confident").length).toBe(2);
    // The old hub `PathCard`'s course-count badge is gone with it.
    expect(screen.queryByText(/^\~\d+ courses$/)).toBeNull();
  });

  it("renders the shared empty state when no skills manifest is loaded", () => {
    render(<CategoryLanding locale="en" category="skills" manifests={[]} />);

    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
