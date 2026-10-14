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
import type { RoadmapCourseData } from "../../../../../src/features/course-paths/shell/roadmap-course-card";
// eslint-disable-next-line import/first
import { PathLanding } from "../../../../../src/features/course-paths/shell/path-landing";

afterEach(cleanup);

const manifest: PathManifest = manifestFixture({
  pathId: "careers/interview-ready/example-role",
  arc: "interview-ready",
  title: "Interview-Ready Example Role",
  description: "An interview-first track.",
  courses: ["just-enough-python", "just-enough-bash", "version-control-and-git"],
});

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
      // The row now also carries the course's status in words (plan 04 Phase 4), so the position
      // number and the title are the row's leading text, not its whole text.
      expect(
        rowText,
        `syllabus row ${index + 1} should render its position number "${position}" before the title (rendered: "${rowText}")`,
      ).toMatch(new RegExp(`^${position}\\s*${title}`, "u"));
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

  it("localizes the roadmap chrome on the id locale (DWT-003 fix, phase-5 rule-15 design-tester retest)", () => {
    render(<PathLanding locale="id" manifest={manifest} courseTitles={courseTitles} />);

    // Plan 04 Phase 4 replaced plan 02's "Syllabus" h2 with the roadmap's own headings, which must
    // localize just as it did: "Jalur inti · n fase" heads the core of this one-core-phase path.
    expect(screen.getByRole("heading", { level: 2, name: "Jalur inti · 1 fase" })).toBeTruthy();
    expect(screen.queryByText("Core path")).toBeNull();
  });
});

describe("PathLanding — the roadmap (plan ayokoding-learn-revamp-04, Phase 4)", () => {
  const phasedManifest: PathManifest = manifestFixture({
    pathId: "careers/fundamentally-strong/generalist-track",
    arc: "fundamentally-strong",
    title: "Generalist Track",
    description: "A deep route through the foundations.",
    assumes: ["just-enough-python"],
    phases: [
      {
        id: "fixture-core",
        title: "Fixture core",
        kind: "core",
        outcome: { can: "complete this fixture path", cannotYet: "lead a team" },
        courses: ["computer-science-foundations", "software-engineering-practices"],
      },
      {
        id: "fixture-extension",
        title: "Fixture extension",
        kind: "extension",
        courses: ["capstone-secure-service"],
      },
    ],
  });

  const phasedTitles = {
    "computer-science-foundations": "Computer Science Foundations",
    "software-engineering-practices": "Software Engineering Practices",
    "capstone-secure-service": "Capstone Secure Service",
    "just-enough-python": "Just Enough Python",
  };

  const phasedCards: Record<string, RoadmapCourseData> = {
    "computer-science-foundations": {
      title: "Computer Science Foundations",
      format: "annotated-concept",
      estimatedHours: 4,
      isOutline: false,
    },
    "software-engineering-practices": {
      title: "Software Engineering Practices",
      format: "by-example",
      estimatedHours: 8,
      isOutline: false,
    },
    "capstone-secure-service": { title: "Capstone Secure Service", isOutline: true },
  };

  function renderPhased(locale = "en", extra?: Partial<React.ComponentProps<typeof PathLanding>>) {
    return render(
      <PathLanding
        locale={locale}
        manifest={phasedManifest}
        courseTitles={phasedTitles}
        outlineCourseIds={["capstone-secure-service"]}
        assumedCourseTitles={{ "just-enough-python": "Just Enough Python" }}
        courseCards={phasedCards}
        sequences={{
          "computer-science-foundations": ["learning/beginner"],
          "software-engineering-practices": ["learning/overview"],
          "capstone-secure-service": ["learning/beginner"],
        }}
        {...extra}
      />,
    );
  }

  it("renders the roadmap inside the syllabus nav with its progress card", () => {
    renderPhased();

    const nav = screen.getByRole("navigation", { name: "Generalist Track syllabus" });
    expect(within(nav).getByText("Your progress (saved in this browser)")).toBeTruthy();
    expect(within(nav).getByText("0 of 2 core courses done")).toBeTruthy();
    expect(within(nav).getByRole("heading", { level: 2, name: /Core path · 1 phase/ })).toBeTruthy();
  });

  it("shows each phase as a numbered milestone with its outcome and its own progress", () => {
    const { container } = renderPhased();

    const core = container.querySelector("#phase-fixture-core");
    expect(core).not.toBeNull();
    expect(within(core as HTMLElement).getByRole("heading", { level: 3, name: /Phase 1 · Fixture core/ })).toBeTruthy();
    expect(within(core as HTMLElement).getByText("After this phase you can complete this fixture path")).toBeTruthy();
    expect(within(core as HTMLElement).getByText("You cannot yet lead a team")).toBeTruthy();
    expect(within(core as HTMLElement).getByText("0 of 2 done")).toBeTruthy();
  });

  it("keeps the extension phase closed under the Optional extensions heading", () => {
    const { container } = renderPhased();

    expect(screen.getByRole("heading", { level: 2, name: "Optional extensions" })).toBeTruthy();
    expect(container.textContent).toContain("Take these after the core");
    const details = container.querySelector("details");
    expect(details?.hasAttribute("open")).toBe(false);
    expect(details?.querySelector("summary")?.textContent).toContain("Fixture extension");
    expect(details?.querySelector("summary")?.textContent).toContain("1 course");
  });

  it("keeps position numbers continuous across the phase boundary", () => {
    const { container } = renderPhased();

    const nav = screen.getByRole("navigation", { name: "Generalist Track syllabus" });
    const rows = within(nav).getAllByRole("listitem");
    // Two core cards then the extension's card, whose number continues the sequence.
    expect(rows.map((row) => row.textContent?.match(/^\d+/)?.[0])).toEqual(["1", "2", "3"]);
    expect(container.querySelector("details ol > li")?.textContent).toMatch(/^3\s*Capstone Secure Service/);
  });

  it("shows the Outline badge only on the outline course's card", () => {
    renderPhased();

    expect(screen.getAllByText("Outline")).toHaveLength(1);
    const outlineRow = screen.getByRole("link", { name: "Capstone Secure Service" }).closest("li");
    expect(outlineRow?.textContent).toContain("Outline");
  });

  it("lists every assumed course with canonical links, outside the roadmap's list", () => {
    const { container } = renderPhased();

    expect(screen.getByText("Before you start")).toBeTruthy();
    const link = screen.getByRole("link", { name: "Just Enough Python" });
    expect(link.getAttribute("href")).toBe("/en/learn/courses/just-enough-python");
    const note = screen.getByText("Before you start").closest("div");
    const firstPhase = screen.getByRole("heading", { level: 3, name: /Phase 1 · Fixture core/ });
    expect(note).not.toBeNull();
    expect((note as HTMLElement).compareDocumentPosition(firstPhase) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    // The assumed course is background, not a member of the path, so it is not a roadmap row.
    expect(container.querySelector("#phase-fixture-core ol > li")?.textContent).toMatch(
      /^1\s*Computer Science Foundations/,
    );
  });

  it("omits the 'Before you start' note when assumes is empty", () => {
    const empty: PathManifest = manifestFixture({
      pathId: "careers/interview-ready/backend-track",
      arc: "interview-ready",
      title: "Backend Track",
      description: "desc",
      phases: [
        {
          id: "only-core",
          title: "Only core",
          kind: "core",
          outcome: { can: "complete this fixture path" },
          courses: ["computer-science-foundations"],
        },
      ],
    });
    render(
      <PathLanding
        locale="en"
        manifest={empty}
        courseTitles={phasedTitles}
        outlineCourseIds={[]}
        assumedCourseTitles={{}}
        courseCards={phasedCards}
        sequences={{}}
      />,
    );

    expect(screen.queryByText("Before you start")).toBeNull();
  });

  it("renders Indonesian strings for locale id", () => {
    renderPhased("id");

    expect(screen.getByText("Sebelum memulai")).toBeTruthy();
    expect(screen.getByText("Progres Anda (tersimpan di browser ini)")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: /Fase 1 · Fixture core/ })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Pendalaman opsional" })).toBeTruthy();
    expect(screen.getByText("Setelah fase ini Anda bisa complete this fixture path")).toBeTruthy();
    expect(screen.getByText("Anda belum bisa lead a team")).toBeTruthy();
    expect(screen.getByText("Kerangka")).toBeTruthy();
  });
});

describe("PathLanding — marked skills path renders today's flat list (AC-4.5 RED)", () => {
  const markedManifest: PathManifest = manifestFixture({
    pathId: "skills/conventional-accounting",
    arc: "conventional-accounting",
    title: "Conventional Accounting",
    description: "A mechanical one-phase shape awaiting its content plan.",
    restructurePendingIn: "plan-06",
    phases: [
      {
        id: "all-courses",
        title: "All courses",
        kind: "core",
        courses: ["just-enough-python", "capstone-secure-service"],
      },
    ],
  });

  const markedTitles = {
    "just-enough-python": "Just Enough Python",
    "capstone-secure-service": "Capstone Secure Service",
  };

  it("lists its courses in order with positions 1…N and no phase chrome", () => {
    const { container } = render(
      <PathLanding
        locale="en"
        manifest={markedManifest}
        courseTitles={markedTitles}
        outlineCourseIds={["capstone-secure-service"]}
        assumedCourseTitles={{}}
      />,
    );

    const rows = within(container.querySelector("nav") as HTMLElement).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.textContent).toMatch(/^1\s*Just Enough Python/);
    expect(rows[1]?.textContent).toMatch(/^2\s*Capstone Secure Service/);
    expect(container.querySelectorAll("h3")).toHaveLength(0);
    expect(screen.queryByText("Optional extensions")).toBeNull();
    expect(screen.queryByText("After this phase you can", { exact: false })).toBeNull();
    expect(screen.queryByText("Before you start")).toBeNull();
    expect(screen.queryByText("Outline")).toBeNull();
  });
});
