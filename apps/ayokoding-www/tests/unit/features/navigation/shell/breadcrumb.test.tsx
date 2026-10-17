import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock next/link as a simple <a> tag.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Import after mocks are registered.
// eslint-disable-next-line import/first
import { Breadcrumb } from "../../../../../src/features/navigation/shell/breadcrumb";

afterEach(cleanup);

const segments = [
  { label: "Home", slug: "" },
  { label: "Tools", slug: "tools" },
  { label: "Cost of Living Calculator", slug: "tools/cost-of-living-calculator" },
];

describe("Breadcrumb", () => {
  it("by default excludes the last (current-page) segment", () => {
    render(<Breadcrumb locale="en" slug="tools/cost-of-living-calculator" segments={segments} />);
    // Final segment is not rendered when showCurrent is absent (legacy behaviour).
    expect(screen.queryByText("Cost of Living Calculator")).toBeNull();
    expect(screen.getByRole("link", { name: "Home" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Tools" })).toBeTruthy();
  });

  it("with showCurrent renders the final segment as a non-link aria-current='page' crumb", () => {
    render(<Breadcrumb locale="en" slug="tools/cost-of-living-calculator" segments={segments} showCurrent />);
    const current = screen.getByText("Cost of Living Calculator");
    expect(current.getAttribute("aria-current")).toBe("page");
    // The current crumb must not be a link.
    expect(current.closest("a")).toBeNull();
    // Ancestor segments remain links.
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/en");
    expect(screen.getByRole("link", { name: "Tools" }).getAttribute("href")).toBe("/en/tools");
  });

  it("with showCurrent uses ChevronRight separators, never a literal '/'", () => {
    const { container } = render(
      <Breadcrumb locale="en" slug="tools/cost-of-living-calculator" segments={segments} showCurrent />,
    );
    // lucide-react ChevronRight renders an <svg>; one separator between each of 3 crumbs.
    expect(container.querySelectorAll("svg").length).toBe(2);
    expect(container.textContent).not.toContain("/");
  });

  it("ChevronRight separators are decorative (aria-hidden), locking in the current contract", () => {
    // swe-ui audit b06d32 Finding 4 flagged the separator icon as missing an explicit
    // aria-hidden="true" prop. Re-validated as FALSE_POSITIVE: lucide-react's Icon
    // primitive already defaults to aria-hidden="true" whenever no children/aria-*/
    // role/title prop is supplied, so the rendered DOM is already correctly hidden
    // from assistive tech. No source fix applied — this test locks in that
    // already-correct behaviour.
    const { container } = render(
      <Breadcrumb locale="en" slug="tools/cost-of-living-calculator" segments={segments} showCurrent />,
    );
    const separators = container.querySelectorAll("svg");
    expect(separators.length).toBeGreaterThan(0);
    separators.forEach((svg) => {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    });
  });
});

const contentSegments = [
  { label: "Learn", slug: "learn" },
  { label: "Software Engineering", slug: "learn/software-engineering" },
  { label: "Data Structures", slug: "learn/software-engineering/data-structures" },
];

describe("Breadcrumb with explicit href override", () => {
  it("when segment has href field, uses that href instead of computed one — UWT-002 fix", () => {
    const segments = [
      { label: "Home", slug: "" },
      { label: "Browse", slug: "browse", href: "/en/browse" },
      { label: "Learn", slug: "learn" },
    ];
    render(<Breadcrumb locale="en" slug="learn" segments={segments} showCurrent />);
    expect(screen.getByRole("link", { name: "Browse" }).getAttribute("href")).toBe("/en/browse");
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/en");
  });
});

describe("Breadcrumb content hrefs", () => {
  it("resolves content ancestor segments through contentUrl (uniform bare join, DD-48)", () => {
    render(
      <Breadcrumb
        locale="en"
        slug="learn/software-engineering/data-structures"
        segments={contentSegments}
        showCurrent
      />,
    );
    // contentUrl() is a uniform bare join post-de-namespacing — no /c/ prefix.
    expect(screen.getByRole("link", { name: "Learn" }).getAttribute("href")).toBe("/en/learn");
    expect(screen.getByRole("link", { name: "Software Engineering" }).getAttribute("href")).toBe(
      "/en/learn/software-engineering",
    );
    // Final segment is non-link aria-current.
    const current = screen.getByText("Data Structures");
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(current.closest("a")).toBeNull();
  });

  it("emits bare hrefs for non-content segments too", () => {
    render(<Breadcrumb locale="en" slug="tools" segments={segments} showCurrent />);
    expect(screen.getByRole("link", { name: "Tools" }).getAttribute("href")).toBe("/en/tools");
  });
});

// DWT-001: at mobile widths (375px) the breadcrumb must render on a single row by
// collapsing middle crumbs behind one ellipsis, per prd.md's "no multi-line breadcrumb
// wrap at 375 px" acceptance and the committed legacy-landing mobile mockups
// (`plans/in-progress/ayokoding-learning-path-01-url-restructure/assets/
// legacy-landing-option-{a,b}-mobile.png`), which show `Home / … / Legacy`.
const manySegments = [
  { label: "Home", slug: "" },
  { label: "Learn", slug: "learn" },
  { label: "Software Engineering", slug: "learn/software-engineering" },
  { label: "Legacy", slug: "learn/legacy/software-engineering" },
  { label: "Data Structures", slug: "learn/legacy/software-engineering/data-structures" },
];

describe("Breadcrumb mobile collapse (DWT-001)", () => {
  it("renders exactly one collapsed ellipsis element, hidden at sm: and up, for a >3-segment breadcrumb", () => {
    const { container } = render(
      <Breadcrumb
        locale="en"
        slug="learn/legacy/software-engineering/data-structures"
        segments={manySegments}
        showCurrent
      />,
    );
    const ellipses = container.querySelectorAll('[data-testid="breadcrumb-ellipsis"]');
    expect(ellipses.length).toBe(1);
    expect(ellipses[0]?.className).toContain("sm:hidden");
  });

  it("hides the middle crumbs on mobile (hidden) and reveals them at sm: and up (sm:flex)", () => {
    render(
      <Breadcrumb
        locale="en"
        slug="learn/legacy/software-engineering/data-structures"
        segments={manySegments}
        showCurrent
      />,
    );
    // Middle segments of the 5 visible crumbs: "Learn", "Software Engineering", "Legacy".
    for (const label of ["Learn", "Software Engineering", "Legacy"]) {
      const li = screen.getByText(label).closest("li");
      expect(li, `missing <li> for ${label}`).not.toBeNull();
      expect(li?.className).toContain("hidden");
      expect(li?.className).toContain("sm:flex");
    }
  });

  it("always shows the first crumb and the last visible crumb — never mobile-hidden", () => {
    render(
      <Breadcrumb
        locale="en"
        slug="learn/legacy/software-engineering/data-structures"
        segments={manySegments}
        showCurrent
      />,
    );
    const home = screen.getByText("Home").closest("li");
    const last = screen.getByText("Data Structures").closest("li");
    expect(home?.className).not.toContain("hidden");
    expect(last?.className).not.toContain("hidden");
    // Terminal crumb keeps its aria-current="page" contract even when collapsed.
    expect(screen.getByText("Data Structures").getAttribute("aria-current")).toBe("page");
  });

  it("base <ol> class no longer wraps unconditionally at mobile — flex-wrap absent or scoped to sm:", () => {
    const { container } = render(
      <Breadcrumb
        locale="en"
        slug="learn/legacy/software-engineering/data-structures"
        segments={manySegments}
        showCurrent
      />,
    );
    const ol = container.querySelector("ol");
    const classes = (ol?.className ?? "").split(/\s+/);
    expect(classes.includes("flex-wrap")).toBe(false);
  });

  it("the ellipsis glyph is aria-hidden with an sr-only accessible label", () => {
    render(
      <Breadcrumb
        locale="en"
        slug="learn/legacy/software-engineering/data-structures"
        segments={manySegments}
        showCurrent
      />,
    );
    expect(screen.getByText("…").getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText(/more breadcrumb items/i)).toBeTruthy();
  });

  it("does NOT render an ellipsis for a <=3-segment breadcrumb (already fits on one row)", () => {
    const { container } = render(
      <Breadcrumb locale="en" slug="tools/cost-of-living-calculator" segments={segments} showCurrent />,
    );
    expect(container.querySelectorAll('[data-testid="breadcrumb-ellipsis"]').length).toBe(0);
  });
});

// Cycle 2.3 (course-paths plan): with an active fixture path context, the trail collapses to
// Home / Learn / <Path Title> / <Course Title> — a documented departure from the plain
// content-tree trail, justified in tech-docs.md §Breadcrumb because the active path is explicit
// and shareable in the URL.
const courseSegments = [
  { label: "Home", slug: "" },
  { label: "Browse", slug: "browse", href: "/en/browse" },
  { label: "Learn", slug: "learn" },
  { label: "Courses", slug: "learn/courses" },
  { label: "Just Enough Python", slug: "learn/courses/just-enough-python" },
];

const pathContext = {
  pathId: "skills/python-fundamentals",
  pathTitle: "Python Fundamentals",
  learnLabel: "Learn",
  learnHref: "/en/browse",
};

describe("Breadcrumb with an active path context (Cycle 2.3)", () => {
  it("shows Home, Learn, the path title, and the course title", () => {
    render(
      <Breadcrumb
        locale="en"
        slug="learn/courses/just-enough-python"
        segments={courseSegments}
        showCurrent
        pathContext={pathContext}
      />,
    );

    expect(screen.getByRole("link", { name: "Home" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Learn" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Python Fundamentals" })).toBeTruthy();
    const current = screen.getByText("Just Enough Python");
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(current.closest("a")).toBeNull();
  });

  it("drops the content-tree ancestor segments (Browse, Courses) the canonical trail carries", () => {
    render(
      <Breadcrumb
        locale="en"
        slug="learn/courses/just-enough-python"
        segments={courseSegments}
        showCurrent
        pathContext={pathContext}
      />,
    );

    expect(screen.queryByRole("link", { name: "Browse" })).toBeNull();
    expect(screen.queryByText("Courses")).toBeNull();
  });

  it("the path crumb links to the path landing page without a self-referential path context query (UWT-015)", () => {
    render(
      <Breadcrumb
        locale="en"
        slug="learn/courses/just-enough-python"
        segments={courseSegments}
        showCurrent
        pathContext={pathContext}
      />,
    );

    expect(screen.getByRole("link", { name: "Python Fundamentals" }).getAttribute("href")).toBe(
      "/en/learn/paths/skills/python-fundamentals",
    );
  });

  it("the Learn crumb uses the supplied label/href, matching the header's own Learn nav link", () => {
    render(
      <Breadcrumb
        locale="en"
        slug="learn/courses/just-enough-python"
        segments={courseSegments}
        showCurrent
        pathContext={pathContext}
      />,
    );

    expect(screen.getByRole("link", { name: "Learn" }).getAttribute("href")).toBe("/en/browse");
  });

  it("without a pathContext, the trail is the plain content-tree segments, unchanged", () => {
    render(<Breadcrumb locale="en" slug="learn/courses/just-enough-python" segments={courseSegments} showCurrent />);

    expect(screen.getByRole("link", { name: "Browse" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Courses" })).toBeTruthy();
    expect(screen.queryByText("Python Fundamentals")).toBeNull();
  });
});
