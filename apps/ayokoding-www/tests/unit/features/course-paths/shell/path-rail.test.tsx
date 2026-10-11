import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PathManifest } from "../../../../../src/features/course-paths/core/schemas";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// plan ayokoding-learn-revamp-01 §4.3 (Phase 5 RED wiring): the helper module does not exist yet —
// the static import below producing TS2307 under `tsc --noEmit` is the expected RED type-error
// face (do not stub the module). At GREEN the factory intercepts PathRail's own import of the
// same file, so the assertions here pin the wiring without exercising the helper's arithmetic.
vi.mock("../../../../../src/features/course-paths/shell/active-course-scroll", () => ({
  scrollActiveCourseIntoView: vi.fn(),
}));

// eslint-disable-next-line import/first
import { PathRail } from "../../../../../src/features/course-paths/shell/path-rail";
// eslint-disable-next-line import/first
import { scrollActiveCourseIntoView } from "../../../../../src/features/course-paths/shell/active-course-scroll";

afterEach(cleanup);

beforeEach(() => {
  vi.mocked(scrollActiveCourseIntoView).mockClear();
});

const manifest: PathManifest = {
  pathId: "skills/python-fundamentals",
  arc: "python-fundamentals",
  title: "Python Fundamentals",
  description: "Learn Python from the ground up.",
  courseOrder: ["version-control-and-git", "just-enough-python", "data-structures-and-algorithms-essentials"],
};

const courseTitles = {
  "version-control-and-git": "Git",
  "just-enough-python": "Just Enough Python",
  "data-structures-and-algorithms-essentials": "Data Structures & Algorithms",
};

describe("PathRail (Cycle 2.8 — Screen 3 Option B)", () => {
  it("is a <nav> whose accessible name is '{Path} course list'", () => {
    render(
      <PathRail locale="en" manifest={manifest} currentCourseId="just-enough-python" courseTitles={courseTitles} />,
    );

    expect(screen.getByRole("navigation", { name: "Python Fundamentals course list" })).toBeTruthy();
  });

  it("renders a semantic <ol> listing every course in manifest order", () => {
    const { container } = render(
      <PathRail locale="en" manifest={manifest} currentCourseId="just-enough-python" courseTitles={courseTitles} />,
    );

    const ol = container.querySelector("ol");
    expect(ol).not.toBeNull();
    const items = ol!.querySelectorAll("li");
    expect(items.length).toBe(3);
    expect(items[0]?.textContent).toContain("Git");
    expect(items[1]?.textContent).toContain("Just Enough Python");
    expect(items[2]?.textContent).toContain("Data Structures");
  });

  it("marks the current course with aria-current='page' AND a non-colour signal (▸ marker + font-semibold)", () => {
    render(
      <PathRail locale="en" manifest={manifest} currentCourseId="just-enough-python" courseTitles={courseTitles} />,
    );

    const current = screen.getByRole("link", { name: /Just Enough Python/i });
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(current.textContent).toContain("▸");
    expect(current.className).toContain("font-semibold");
  });

  it("shows each row's position number before its title while the current row keeps every current-course signal (plan ayokoding-learn-revamp-01 §4.2)", () => {
    const { container } = render(
      <PathRail locale="en" manifest={manifest} currentCourseId="just-enough-python" courseTitles={courseTitles} />,
    );

    const ol = container.querySelector("ol");
    expect(ol).not.toBeNull();
    const items = within(ol as HTMLElement).getAllByRole("listitem");
    const expected = [
      { position: "1", title: "Git" },
      { position: "2", title: "Just Enough Python" },
      { position: "3", title: "Data Structures & Algorithms" },
    ];
    expected.forEach(({ position, title }, index) => {
      const rowText = items[index]?.textContent ?? "";
      expect(
        rowText,
        `rail row ${index + 1} should render its position number "${position}" before the title (rendered: "${rowText}")`,
      ).toMatch(new RegExp(`^${position}\\s*▸?\\s*${title}$`, "u"));
      // The link keeps its aria-label={title}; the row number stays outside the link, so the
      // link's accessible name is never a numbered title (tech-docs §4.2, Decision D4).
      expect(within(items[index]!).getByRole("link", { name: title })).toBeTruthy();
    });

    // The current row (position 2 of 3) keeps aria-current="page", the ▸ marker, and bg-accent,
    // and its own position number renders before them.
    const current = screen.getByRole("link", { name: "Just Enough Python" });
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(current.textContent).toContain("▸");
    expect(current.className).toContain("bg-accent");
    expect(current.closest("li")?.textContent ?? "").toMatch(/^2\s*▸/u);
  });

  it("every row link carries the path context, and the row's aria-label holds the untruncated title", () => {
    render(
      <PathRail locale="en" manifest={manifest} currentCourseId="just-enough-python" courseTitles={courseTitles} />,
    );

    const link = screen.getByRole("link", { name: /Data Structures & Algorithms/i });
    expect(link.getAttribute("href")).toBe(
      "/en/learn/courses/data-structures-and-algorithms-essentials?path=skills/python-fundamentals",
    );
    expect(link.getAttribute("aria-label")).toBe("Data Structures & Algorithms");
  });

  it("shows a 'course k of N' readout above the list — prd.md's Screen 3 responsive spec requires it at md+ widths (phase-5 EWT finding)", () => {
    render(
      <PathRail locale="en" manifest={manifest} currentCourseId="just-enough-python" courseTitles={courseTitles} />,
    );

    expect(screen.getByText("Course 2 of 3")).toBeTruthy();
  });

  it("the footer offers 'view full path' and 'browse all courses' escape links", () => {
    render(
      <PathRail locale="en" manifest={manifest} currentCourseId="just-enough-python" courseTitles={courseTitles} />,
    );

    const viewFullPath = screen.getByRole("link", { name: /view full path/i });
    expect(viewFullPath.getAttribute("href")).toBe(
      "/en/learn/paths/skills/python-fundamentals?path=skills/python-fundamentals",
    );

    const browseAll = screen.getByRole("link", { name: /browse all courses/i });
    expect(browseAll.getAttribute("href")).toBe("/en/browse");
  });

  it("gives both footer escape links an always-visible underline affordance, not only a :hover cue (UWT-003 fix)", () => {
    render(
      <PathRail locale="en" manifest={manifest} currentCourseId="just-enough-python" courseTitles={courseTitles} />,
    );

    expect(screen.getByRole("link", { name: /view full path/i }).className).toContain("underline");
    expect(screen.getByRole("link", { name: /browse all courses/i }).className).toContain("underline");
  });

  it("gives the current row a background highlight, matching prd.md's own documented spec for this row (DWT-005 fix, phase-5 rule-15 design-tester retest)", () => {
    render(
      <PathRail locale="en" manifest={manifest} currentCourseId="just-enough-python" courseTitles={courseTitles} />,
    );

    const current = screen.getByRole("link", { name: /Just Enough Python/i });
    expect(current.className).toContain("bg-accent");
  });

  it("localizes 'course k of N' and the footer escape links on the id locale (DWT-003 fix, phase-5 rule-15 design-tester retest)", () => {
    render(
      <PathRail locale="id" manifest={manifest} currentCourseId="just-enough-python" courseTitles={courseTitles} />,
    );

    expect(screen.getByText("Kursus 2 dari 3")).toBeTruthy();
    expect(screen.getByRole("link", { name: /lihat jalur lengkap/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /jelajahi semua kursus/i })).toBeTruthy();
  });

  it("asks the auto-scroll helper to bring the current course's row into view on mount and again when currentCourseId changes (plan ayokoding-learn-revamp-01 §4.3)", () => {
    const scrolled = vi.mocked(scrollActiveCourseIntoView);
    const { rerender } = render(
      <PathRail locale="en" manifest={manifest} currentCourseId="just-enough-python" courseTitles={courseTitles} />,
    );

    expect(scrolled).toHaveBeenCalledTimes(1);
    expect(scrolled).toHaveBeenNthCalledWith(1, screen.getByRole("link", { name: "Just Enough Python" }).closest("li"));

    rerender(
      <PathRail
        locale="en"
        manifest={manifest}
        currentCourseId="data-structures-and-algorithms-essentials"
        courseTitles={courseTitles}
      />,
    );

    expect(scrolled).toHaveBeenCalledTimes(2);
    expect(scrolled).toHaveBeenNthCalledWith(
      2,
      screen.getByRole("link", { name: "Data Structures & Algorithms" }).closest("li"),
    );
  });
});
