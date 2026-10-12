import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PathPhase } from "../../../../../src/features/course-paths/core/schemas";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { PhaseSection } from "../../../../../src/features/course-paths/shell/phase-section";

afterEach(cleanup);

const corePhase: PathPhase = {
  id: "fixture-core",
  title: "Fixture core",
  kind: "core",
  outcome: { can: "complete this fixture path", cannotYet: "lead a team" },
  courses: ["computer-science-foundations", "software-engineering-practices"],
};

const extensionPhase: PathPhase = {
  id: "fixture-extension",
  title: "Fixture extension",
  kind: "extension",
  courses: ["capstone-secure-service"],
};

const courseTitles = {
  "computer-science-foundations": "Computer Science Foundations",
  "software-engineering-practices": "Software Engineering Practices",
  "capstone-secure-service": "Capstone Secure Service",
};

describe("PhaseSection — core phase (AC-4.2 RED)", () => {
  it("renders an h2 with the Phase badge, the phase title, and the course count", () => {
    render(
      <PhaseSection
        locale="en"
        pathId="careers/fundamentally-strong/generalist-track"
        phase={corePhase}
        phaseNumber={1}
        startPosition={1}
        courseTitles={courseTitles}
        outlineCourseIds={[]}
      />,
    );

    const heading = screen.getByRole("heading", { level: 2, name: /Fixture core/ });
    expect(heading.textContent).toContain("Phase 1");
    expect(heading.textContent).toContain("2 courses");
  });

  it("separates the Phase badge and the title with a space in the heading's accessible name (EWT-001)", () => {
    render(
      <PhaseSection
        locale="en"
        pathId="careers/fundamentally-strong/generalist-track"
        phase={corePhase}
        phaseNumber={1}
        startPosition={1}
        courseTitles={courseTitles}
        outlineCourseIds={[]}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Phase 1 Fixture core (2 courses)" })).toBeTruthy();
  });

  it("states the outcome with 'After this phase you can' and 'You cannot yet'", () => {
    render(
      <PhaseSection
        locale="en"
        pathId="careers/fundamentally-strong/generalist-track"
        phase={corePhase}
        phaseNumber={1}
        startPosition={1}
        courseTitles={courseTitles}
        outlineCourseIds={[]}
      />,
    );

    expect(screen.getByText("After this phase you can complete this fixture path")).toBeTruthy();
    expect(screen.getByText("You cannot yet lead a team")).toBeTruthy();
  });

  it("numbers its rows continuously from startPosition with the shared position-number helper", () => {
    const { container } = render(
      <PhaseSection
        locale="en"
        pathId="careers/fundamentally-strong/generalist-track"
        phase={corePhase}
        phaseNumber={2}
        startPosition={5}
        courseTitles={courseTitles}
        outlineCourseIds={[]}
      />,
    );

    const items = within(container.querySelector("ol") as HTMLElement).getAllByRole("listitem");
    expect(items[0]?.textContent).toMatch(/^5\s*Computer Science Foundations/);
    expect(items[1]?.textContent).toMatch(/^6\s*Software Engineering Practices/);
  });

  it("carries the path context query parameter on every course link", () => {
    render(
      <PhaseSection
        locale="en"
        pathId="careers/fundamentally-strong/generalist-track"
        phase={corePhase}
        phaseNumber={1}
        startPosition={1}
        courseTitles={courseTitles}
        outlineCourseIds={[]}
      />,
    );

    expect(screen.getByRole("link", { name: "Computer Science Foundations" }).getAttribute("href")).toBe(
      "/en/learn/courses/computer-science-foundations?path=careers/fundamentally-strong/generalist-track",
    );
  });
});

describe("PhaseSection — extension phase (AC-4.2 RED)", () => {
  it("renders an h2 with the title and count but no Phase badge", () => {
    render(
      <PhaseSection
        locale="en"
        pathId="careers/fundamentally-strong/generalist-track"
        phase={extensionPhase}
        startPosition={3}
        courseTitles={courseTitles}
        outlineCourseIds={["capstone-secure-service"]}
      />,
    );

    const heading = screen.getByRole("heading", { level: 2, name: /Fixture extension/ });
    expect(heading.textContent).not.toContain("Phase");
    expect(heading.textContent).toContain("1 course");
  });

  it("shows the Outline badge only on outline rows", () => {
    render(
      <PhaseSection
        locale="en"
        pathId="careers/fundamentally-strong/generalist-track"
        phase={{
          id: "mixed",
          title: "Mixed",
          kind: "core",
          outcome: { can: "complete this fixture path" },
          courses: ["computer-science-foundations", "capstone-secure-service"],
        }}
        phaseNumber={1}
        startPosition={1}
        courseTitles={courseTitles}
        outlineCourseIds={["capstone-secure-service"]}
      />,
    );

    expect(screen.getAllByText("Outline")).toHaveLength(1);
    const outlineRow = screen.getByRole("link", { name: "Capstone Secure Service" }).closest("li");
    expect(outlineRow?.textContent).toContain("Outline");
    const completeRow = screen.getByRole("link", { name: "Computer Science Foundations" }).closest("li");
    expect(completeRow?.textContent).not.toContain("Outline");
  });

  it("localizes the Phase badge and outcome lines on the id locale", () => {
    render(
      <PhaseSection
        locale="id"
        pathId="careers/fundamentally-strong/generalist-track"
        phase={corePhase}
        phaseNumber={1}
        startPosition={1}
        courseTitles={courseTitles}
        outlineCourseIds={[]}
      />,
    );

    const heading = screen.getByRole("heading", { level: 2, name: /Fixture core/ });
    expect(heading.textContent).toContain("Fase 1");
    expect(screen.getByText("Setelah fase ini Anda bisa complete this fixture path")).toBeTruthy();
    expect(screen.getByText("Anda belum bisa lead a team")).toBeTruthy();
  });

  it("localizes the course count on the id locale (UWT-001)", () => {
    render(
      <PhaseSection
        locale="id"
        pathId="careers/fundamentally-strong/generalist-track"
        phase={corePhase}
        phaseNumber={1}
        startPosition={1}
        courseTitles={courseTitles}
        outlineCourseIds={[]}
      />,
    );

    const heading = screen.getByRole("heading", { level: 2, name: /Fixture core/ });
    expect(heading.textContent).toContain("(2 kursus)");
    expect(heading.textContent).not.toContain("courses");
  });
});
