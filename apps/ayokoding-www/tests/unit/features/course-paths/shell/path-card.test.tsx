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

// eslint-disable-next-line import/first
import { PathCard, CategorySection, ArcGroup } from "../../../../../src/features/course-paths/shell/path-card";

afterEach(cleanup);

const manifest: PathManifest = manifestFixture({
  pathId: "careers/interview-ready/example-role",
  arc: "interview-ready",
  title: "Interview-Ready Example Role",
  description: "An interview-first track.",
  courses: ["just-enough-python", "just-enough-bash", "capstone-forge-ready"],
});

describe("PathCard", () => {
  it("is a single <a> wrapping the card content (no link-in-link)", () => {
    render(<PathCard locale="en" manifest={manifest} context="hub" />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/en/learn/paths/careers/interview-ready/example-role");
    expect(link.querySelector("a")).toBeNull();
  });

  it("hub context renders the formal path title and description", () => {
    render(<PathCard locale="en" manifest={manifest} context="hub" />);

    expect(screen.getByText("Interview-Ready Example Role")).toBeTruthy();
    expect(screen.getByText("An interview-first track.")).toBeTruthy();
  });

  it("shows a course-count badge derived from courseOrder length by default", () => {
    render(<PathCard locale="en" manifest={manifest} context="hub" />);

    expect(screen.getByText("~3 courses")).toBeTruthy();
  });

  it("omits the course-count badge when showCourseCount is false (pre-manifest skills cards)", () => {
    render(<PathCard locale="en" manifest={manifest} context="hub" showCourseCount={false} />);

    expect(screen.queryByText(/courses/)).toBeNull();
  });

  it("the link's accessible name states the goal and course count", () => {
    render(<PathCard locale="en" manifest={manifest} context="hero" />);

    expect(screen.getByRole("link", { name: /Start the Interview-Ready Example Role path.*3 courses/i })).toBeTruthy();
  });

  it("the accessible name is identical between the hero and hub contexts for the same manifest, and never silently embeds the full manifest.description (EWT-001 fix)", () => {
    const { unmount } = render(<PathCard locale="en" manifest={manifest} context="hero" />);
    const heroLabel = screen.getByRole("link").getAttribute("aria-label");
    unmount();

    render(<PathCard locale="en" manifest={manifest} context="hub" />);
    const hubLabel = screen.getByRole("link").getAttribute("aria-label");

    expect(heroLabel).toBe(hubLabel);
    expect(heroLabel).not.toContain(manifest.description);
    expect(heroLabel).not.toContain(manifest.arc);
  });

  it("hero context shows the humanized arcTitle, not the raw manifest.arc slug, when given one (UWT-001 fix)", () => {
    render(<PathCard locale="en" manifest={manifest} context="hero" arcTitle="Interview-Ready" />);

    expect(screen.getByText("Interview-Ready")).toBeTruthy();
    expect(screen.queryByText(manifest.arc)).toBeNull();
  });

  it("hero context falls back to the raw manifest.arc when no arcTitle is given", () => {
    render(<PathCard locale="en" manifest={manifest} context="hero" />);

    expect(screen.getByText(manifest.arc)).toBeTruthy();
  });

  it("clamps the description so sibling cards in a grid row don't vary unboundedly in height (UWT-006 fix)", () => {
    render(<PathCard locale="en" manifest={manifest} context="hub" />);

    expect(screen.getByText(manifest.description).className).toContain("line-clamp-3");
  });

  it("gives the card a hue-coded left border and a hue-wash course-count badge for a manifest with a documented arc hue (DWT-001 fix, phase-5 rule-15 design-tester retest)", () => {
    render(<PathCard locale="en" manifest={manifest} context="hub" />);

    const card = screen.getByRole("link").firstElementChild as HTMLElement;
    expect(card.className).toContain("border-l-4");
    expect(card.className).toContain("border-l-[var(--hue-current)]");
    expect(card.getAttribute("style")).toContain("--hue-current: var(--hue-honey)");

    const badge = screen.getByText("~3 courses");
    expect(badge.className).toContain("bg-[var(--hue-current-wash)]");
  });

  it("renders no hue border/wash for a manifest whose arc is not in the documented DD-50 hue map", () => {
    const unmapped: PathManifest = { ...manifest, pathId: "skills/e2e-fixture-alpha", arc: "e2e-fixture-alpha-track" };
    render(<PathCard locale="en" manifest={unmapped} context="hub" />);

    const card = screen.getByRole("link").firstElementChild as HTMLElement;
    expect(card.className).not.toContain("border-l-4");
  });

  it("localizes the 'Start' CTA on the id locale (DWT-003 fix, phase-5 rule-15 design-tester retest)", () => {
    render(<PathCard locale="id" manifest={manifest} context="hub" />);

    expect(screen.getByText("Mulai")).toBeTruthy();
    expect(screen.queryByText("Start")).toBeNull();
  });
});

describe("CategorySection", () => {
  it("is a <section aria-labelledby> with a real <h2> heading", () => {
    render(
      <CategorySection id="careers" heading="Careers" strapline="Converging within your role">
        <p>content</p>
      </CategorySection>,
    );

    const heading = screen.getByRole("heading", { level: 2, name: "Careers" });
    const section = heading.closest("section");
    expect(section?.getAttribute("aria-labelledby")).toBe(heading.id);
  });
});

describe("ArcGroup", () => {
  it("renders an <h3> arc heading (humanized, never the raw slug — DWT-001-adjacent fix) followed by a <ul> of its children", () => {
    render(
      <ArcGroup arc="interview-ready">
        <li>role card</li>
      </ArcGroup>,
    );

    // No `arcTitle` passed, so it falls back to `humanizeKebabSlug(arc)` — "Interview Ready", not
    // the raw "interview-ready" slug (this hub sub-heading rendered the raw slug before this fix).
    const heading = screen.getByRole("heading", { level: 3, name: "Interview Ready" });
    expect(heading).toBeTruthy();
    expect(screen.queryByText("interview-ready")).toBeNull();
    expect(screen.getByRole("list").textContent).toContain("role card");
  });

  it("prefers a passed arcTitle over the humanized fallback", () => {
    render(
      <ArcGroup arc="interview-ready" arcTitle="Interview-Ready">
        <li>role card</li>
      </ArcGroup>,
    );

    expect(screen.getByRole("heading", { level: 3, name: "Interview-Ready" })).toBeTruthy();
  });
});
