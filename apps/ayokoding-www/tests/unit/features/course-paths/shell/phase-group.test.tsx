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
import { PhaseGroup } from "../../../../../src/features/course-paths/shell/phase-group";

afterEach(cleanup);

const corePhase: PathPhase = {
  id: "fixture-core",
  title: "Fixture core",
  kind: "core",
  outcome: { can: "complete this fixture path" },
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

describe("PhaseGroup — core phase (AC-4.3 RED)", () => {
  it("labels the group 'Phase n · Title' and lists that phase's courses in order", () => {
    render(
      <PhaseGroup
        locale="en"
        pathId="careers/fundamentally-strong/generalist-track"
        phase={corePhase}
        phaseNumber={1}
        startPosition={1}
        courseTitles={courseTitles}
        outlineCourseIds={[]}
        currentCourseId="software-engineering-practices"
      />,
    );

    expect(screen.getByText("Phase 1 · Fixture core")).toBeTruthy();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toMatch(/^1\s*Computer Science Foundations/);
    expect(items[1]?.textContent).toMatch(/^2\s*▸?\s*Software Engineering Practices/);
  });

  it("keeps the current-row marker, weight, background, and readout contract", () => {
    render(
      <PhaseGroup
        locale="en"
        pathId="careers/fundamentally-strong/generalist-track"
        phase={corePhase}
        phaseNumber={1}
        startPosition={1}
        courseTitles={courseTitles}
        outlineCourseIds={[]}
        currentCourseId="software-engineering-practices"
      />,
    );

    const current = screen.getByRole("link", { name: "Software Engineering Practices" });
    expect(current.getAttribute("aria-current")).toBe("page");
    expect(current.textContent).toContain("▸");
    expect(current.className).toContain("font-semibold");
    expect(current.className).toContain("bg-accent");
  });

  it("carries the path context on every row link and keeps the title as the accessible name", () => {
    render(
      <PhaseGroup
        locale="en"
        pathId="careers/fundamentally-strong/generalist-track"
        phase={corePhase}
        phaseNumber={1}
        startPosition={4}
        courseTitles={courseTitles}
        outlineCourseIds={[]}
        currentCourseId="computer-science-foundations"
      />,
    );

    const link = screen.getByRole("link", { name: "Software Engineering Practices" });
    expect(link.getAttribute("href")).toBe(
      "/en/learn/courses/software-engineering-practices?path=careers/fundamentally-strong/generalist-track",
    );
    expect(link.getAttribute("aria-label")).toBe("Software Engineering Practices");
    // The row number sits outside the link; the second phase course is position 5 overall.
    expect(link.closest("li")?.textContent).toMatch(/^5\s*Software Engineering Practices/);
  });
});

describe("PhaseGroup — extension phase (AC-4.3 RED)", () => {
  it("labels the group with the title alone and badges outline rows", () => {
    render(
      <PhaseGroup
        locale="en"
        pathId="careers/fundamentally-strong/generalist-track"
        phase={extensionPhase}
        startPosition={3}
        courseTitles={courseTitles}
        outlineCourseIds={["capstone-secure-service"]}
        currentCourseId="capstone-secure-service"
      />,
    );

    expect(screen.getByText("Fixture extension")).toBeTruthy();
    expect(screen.queryByText(/Phase \d/)).toBeNull();
    const row = screen.getByRole("link", { name: "Capstone Secure Service" }).closest("li");
    expect(row?.textContent).toContain("Outline");
  });

  it("shows no badge on a complete row", () => {
    render(
      <PhaseGroup
        locale="en"
        pathId="careers/fundamentally-strong/generalist-track"
        phase={extensionPhase}
        startPosition={3}
        courseTitles={courseTitles}
        outlineCourseIds={[]}
        currentCourseId="capstone-secure-service"
      />,
    );

    expect(screen.queryByText("Outline")).toBeNull();
  });

  it("localizes the phase label on the id locale", () => {
    const { container } = render(
      <PhaseGroup
        locale="id"
        pathId="careers/fundamentally-strong/generalist-track"
        phase={corePhase}
        phaseNumber={1}
        startPosition={1}
        courseTitles={courseTitles}
        outlineCourseIds={[]}
        currentCourseId="computer-science-foundations"
      />,
    );

    expect(within(container).getByText("Fase 1 · Fixture core")).toBeTruthy();
  });
});
