import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PathManifest } from "../../../../../src/features/course-paths/core/schemas";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { PathLanding } from "../../../../../src/features/course-paths/shell/path-landing";

afterEach(cleanup);

const manifest: PathManifest = {
  pathId: "careers/interview-ready/example-role",
  arc: "interview-ready",
  title: "Interview-Ready Example Role",
  description: "An interview-first track.",
  courseOrder: ["just-enough-python", "just-enough-bash", "version-control-and-git"],
};

const courseTitles = {
  "just-enough-python": "Just Enough Python",
  "just-enough-bash": "Just Enough Bash",
  "version-control-and-git": "Version Control & Git",
};

describe("PathLanding (Cycle 3.1 — Screen 2)", () => {
  it("renders the path title as the H1", () => {
    render(<PathLanding locale="en" manifest={manifest} courseTitles={courseTitles} />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Interview-Ready Example Role");
  });

  it("lists the courses in manifest courseOrder inside a semantic <ol>, each row showing its position number before the title (plan ayokoding-learn-revamp-01 §4.2)", () => {
    const { container } = render(<PathLanding locale="en" manifest={manifest} courseTitles={courseTitles} />);

    const ol = container.querySelector("ol");
    expect(ol).not.toBeNull();
    const items = within(ol as HTMLElement).getAllByRole("listitem");
    const expected = [
      { position: "1", title: "Just Enough Python" },
      { position: "2", title: "Just Enough Bash" },
      { position: "3", title: "Version Control & Git" },
    ];
    expected.forEach(({ position, title }, index) => {
      const rowText = items[index]?.textContent ?? "";
      expect(
        rowText,
        `syllabus row ${index + 1} should render its position number "${position}" before the title (rendered: "${rowText}")`,
      ).toMatch(new RegExp(`^${position}\\s*${title}$`, "u"));
      // The number sits outside the link (tech-docs §4.2), so the link's accessible name stays
      // exactly the title (WCAG 2.5.3 Label in Name).
      expect(within(items[index]!).getByRole("link", { name: title })).toBeTruthy();
    });
  });

  it("every course link carries the path context query parameter", () => {
    render(<PathLanding locale="en" manifest={manifest} courseTitles={courseTitles} />);

    const link = screen.getByRole("link", { name: "Just Enough Python" });
    expect(link.getAttribute("href")).toBe(
      "/en/learn/courses/just-enough-python?path=careers/interview-ready/example-role",
    );
  });

  it("renders no body content when bodyHtml is not supplied (careers paths, no regression)", () => {
    const { container } = render(<PathLanding locale="en" manifest={manifest} courseTitles={courseTitles} />);

    expect(container.querySelector(".prose")).toBeNull();
  });

  it("gives every syllabus link an always-visible underline affordance, not only a :hover cue (UWT-003 fix)", () => {
    render(<PathLanding locale="en" manifest={manifest} courseTitles={courseTitles} />);

    const link = screen.getByRole("link", { name: "Just Enough Python" });
    expect(link.className).toContain("underline");
  });

  it("renders the supplied body html between the title and the syllabus (Cycle 3.1d)", () => {
    render(
      <PathLanding
        locale="en"
        manifest={manifest}
        courseTitles={courseTitles}
        bodyHtml="<p>A distinct runway-justification paragraph.</p>"
      />,
    );

    expect(screen.getByText("A distinct runway-justification paragraph.")).toBeTruthy();
  });

  it("frames the H1 with a hue-wash strip matching the manifest's documented arc hue, not a hardcoded honey bar (DWT-001 fix, phase-5 rule-15 design-tester retest)", () => {
    const { container } = render(<PathLanding locale="en" manifest={manifest} courseTitles={courseTitles} />);

    const bar = container.querySelector('[aria-hidden="true"]');
    expect(bar).not.toBeNull();
    expect(bar!.className).toContain("bg-[var(--hue-current-wash)]");
    expect(bar!.getAttribute("style")).toContain("--hue-current-wash: var(--hue-honey-wash)");
  });

  it("falls back to a plain neutral bar for a manifest whose arc is not in the documented DD-50 hue map", () => {
    const unmapped: PathManifest = { ...manifest, pathId: "skills/e2e-fixture-alpha", arc: "e2e-fixture-alpha-track" };
    const { container } = render(<PathLanding locale="en" manifest={unmapped} courseTitles={courseTitles} />);

    const bar = container.querySelector('[aria-hidden="true"]');
    expect(bar!.className).toContain("bg-border");
    expect(bar!.className).not.toContain("hue");
  });

  it("localizes the 'Syllabus' heading on the id locale (DWT-003 fix, phase-5 rule-15 design-tester retest)", () => {
    render(<PathLanding locale="id" manifest={manifest} courseTitles={courseTitles} />);

    expect(screen.getByRole("heading", { level: 2, name: "Silabus" })).toBeTruthy();
  });
});
