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
import { ArcLanding } from "../../../../../src/features/course-paths/shell/arc-landing";

afterEach(cleanup);

function manifest(
  overrides: Pick<PathManifest, "pathId" | "arc"> &
    Partial<Pick<PathManifest, "title">> & { courses?: readonly string[] },
): PathManifest {
  return manifestFixture({ description: "desc", ...overrides, title: overrides.title ?? overrides.pathId });
}

const courseTitles = {
  "just-enough-python": "Just Enough Python",
  "just-enough-bash": "Just Enough Bash",
  "version-control-and-git": "Version Control & Git",
};

describe("ArcLanding — two-role state (Cycle 3.1c-i, R7)", () => {
  const roleA = manifest({
    pathId: "careers/immediately-effective/role-a",
    arc: "immediately-effective",
    title: "Role A",
    courses: ["just-enough-python"],
  });
  const roleB = manifest({
    pathId: "careers/immediately-effective/role-b",
    arc: "immediately-effective",
    title: "Role B",
    courses: ["just-enough-bash"],
  });

  it("renders both role cards side by side, no placeholder", () => {
    render(
      <ArcLanding locale="en" arc="immediately-effective" manifests={[roleA, roleB]} courseTitles={courseTitles} />,
    );

    const nav = within(screen.getByRole("navigation", { name: "immediately-effective paths" }));
    expect(nav.getAllByRole("link").length).toBe(2);
  });

  it("renders exactly as many cards as roles — never a fixed 2-slot grid", () => {
    render(<ArcLanding locale="en" arc="immediately-effective" manifests={[roleA]} courseTitles={courseTitles} />);

    const nav = within(screen.getByRole("navigation", { name: "immediately-effective paths" }));
    expect(nav.getAllByRole("link").length).toBe(1);
  });
});

describe("ArcLanding — single-role state (Cycle 3.1c-ii, R7)", () => {
  const soloRole = manifest({
    pathId: "careers/interview-ready/solo-role",
    arc: "interview-ready",
    title: "Solo Role",
    courses: ["just-enough-python", "just-enough-bash", "version-control-and-git"],
  });

  it("renders one role card with an inline first-phase syllabus preview", () => {
    render(<ArcLanding locale="en" arc="interview-ready" manifests={[soloRole]} courseTitles={courseTitles} />);

    expect(screen.getByText(/Starts with:/i)).toBeTruthy();
    expect(screen.getByText(/Just Enough Python/)).toBeTruthy();
  });

  it("never renders a second, visibly empty card", () => {
    const { container } = render(
      <ArcLanding locale="en" arc="interview-ready" manifests={[soloRole]} courseTitles={courseTitles} />,
    );

    const topLevelUl = container.querySelector("nav > ul");
    expect(topLevelUl?.children.length).toBe(1);
  });
});

describe("ArcLanding — empty state", () => {
  it("renders the shared empty state when the arc has no loaded manifest", () => {
    render(<ArcLanding locale="en" arc="fundamentally-strong" manifests={[]} courseTitles={{}} />);

    expect(screen.getByRole("alert")).toBeTruthy();
  });
});
