import { renderToString } from "react-dom/server";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
import { RoadmapProgressCard } from "../../../../../src/features/course-paths/shell/roadmap-progress-card";
// eslint-disable-next-line import/first
import { learningProgressStore } from "../../../../../src/features/learning-progress/shell/progress-storage";
// eslint-disable-next-line import/first
import { setPageComplete } from "../../../../../src/features/learning-progress/core/progress-state";

afterEach(cleanup);

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
});

const PATH_ID = "careers/immediately-effective/backend-track";

const MANIFEST: PathManifest = manifestFixture({
  pathId: PATH_ID,
  arc: "immediately-effective",
  title: "Backend Track",
  description: "Write shell scripts, serve an HTTP backend, and store its data.",
  phases: [
    {
      id: "shell-foundations",
      title: "Shell foundations",
      kind: "core",
      outcome: { can: "edit code quickly" },
      courses: ["just-enough-bash", "backend-essentials"],
    },
    {
      id: "optional-shell",
      title: "Optional shell workflow",
      kind: "extension",
      courses: ["sql-essentials"],
    },
  ],
});

const MARKED: PathManifest = manifestFixture({
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
      courses: ["accounting-foundations", "journal-entries-and-posting-mechanics"],
    },
  ],
});

function cards(): Record<string, RoadmapCourseData> {
  return {
    "just-enough-bash": { title: "Just Enough Bash", format: "primer", estimatedHours: 3, isOutline: false },
    "backend-essentials": { title: "Backend Essentials", format: "by-example", estimatedHours: 6, isOutline: false },
    "sql-essentials": { title: "SQL Essentials", isOutline: true },
    "accounting-foundations": { title: "Accounting Foundations", isOutline: true },
    "journal-entries-and-posting-mechanics": { title: "Journal Entries and Posting Mechanics", isOutline: true },
  };
}

function sequences() {
  return {
    "just-enough-bash": ["learning/beginner", "learning/advanced"],
    "backend-essentials": ["learning/overview"],
    "sql-essentials": ["learning/beginner"],
    "accounting-foundations": ["learning/beginner"],
    "journal-entries-and-posting-mechanics": ["learning/beginner", "learning/advanced"],
  };
}

function renderCard(manifest: PathManifest = MANIFEST) {
  return render(<RoadmapProgressCard locale="en" manifest={manifest} courseCards={cards()} sequences={sequences()} />);
}

describe("RoadmapProgressCard — the server render offers Start (S21)", () => {
  it("renders exactly one Start button to the first core course in path context before any progress is known", () => {
    const html = renderToString(
      <RoadmapProgressCard locale="en" manifest={MANIFEST} courseCards={cards()} sequences={sequences()} />,
    );

    const container = document.createElement("div");
    container.innerHTML = html;
    const links = Array.from(container.querySelectorAll("a"));
    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute("href")).toBe(`/en/learn/courses/just-enough-bash?path=${PATH_ID}`);
    expect(links[0]?.textContent).toContain("Start:");
    expect(links[0]?.textContent).toContain("Just Enough Bash");
    // Fixed-size slot: seeded content is hidden until hydration rather than shifting the page.
    expect(html).not.toContain("0 of 2 core courses done");
  });

  it("labels the card with the progress heading and the browser-only note", () => {
    renderCard();

    expect(screen.getByText("Your progress (saved in this browser)")).toBeTruthy();
  });
});

describe("RoadmapProgressCard — a returning reader sees Continue (S22)", () => {
  it("points Continue at the first unfinished page of the next core course, keeping ?path=", () => {
    learningProgressStore.update((state) => setPageComplete(state, "just-enough-bash", "learning/beginner", true));
    renderCard();

    const link = screen.getByRole("link", { name: /Continue:/ });
    expect(link.getAttribute("href")).toBe(`/en/learn/courses/just-enough-bash/learning/advanced?path=${PATH_ID}`);
    expect(link.textContent).toContain("Continue: Just Enough Bash");
    expect(screen.getByText("0 of 2 core courses done")).toBeTruthy();
  });

  it("starts at the course landing page when a course has no completed page yet", () => {
    learningProgressStore.update((state) => setPageComplete(state, "just-enough-bash", "learning/beginner", true));
    learningProgressStore.update((state) => setPageComplete(state, "just-enough-bash", "learning/advanced", true));
    renderCard();

    const link = screen.getByRole("link", { name: /Continue:/ });
    expect(link.getAttribute("href")).toBe(`/en/learn/courses/backend-essentials?path=${PATH_ID}`);
    expect(link.textContent).toContain("Continue: Backend Essentials");
    expect(screen.getByText("1 of 2 core courses done")).toBeTruthy();
  });
});

describe("RoadmapProgressCard — completion and flat mode", () => {
  it("says the core is complete and drops the button when every core course is done", () => {
    learningProgressStore.update((state) =>
      ["learning/beginner", "learning/advanced"].reduce(
        (next, pagePath) => setPageComplete(next, "just-enough-bash", pagePath, true),
        setPageComplete(state, "backend-essentials", "learning/overview", true),
      ),
    );
    const { container } = renderCard();

    expect(screen.getByText("Core path complete. The optional extensions are below.", { exact: false })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Start:|Continue:/ })).toBeNull();
    // The meter's value still carries through the visible text (S24, S35).
    expect(screen.getByText("2 of 2 core courses done")).toBeTruthy();
    expect(container.querySelector(".bg-green-700")).not.toBeNull();
  });

  it("counts every course of a path waiting for its restructure and starts at its first course", () => {
    learningProgressStore.update((state) =>
      setPageComplete(state, "accounting-foundations", "learning/beginner", true),
    );
    renderCard(MARKED);

    expect(screen.getByText("1 of 2 courses done")).toBeTruthy();
    const link = screen.getByRole("link", { name: /Continue:/ });
    expect(link.getAttribute("href")).toBe(
      "/en/learn/courses/journal-entries-and-posting-mechanics?path=skills/conventional-accounting",
    );
  });

  it("keeps the same fixed-height slot in every mode", () => {
    const { container } = renderCard();

    expect(container.firstElementChild?.className).toContain("h-40");
    expect(container.firstElementChild?.className).toContain("sm:h-36");
  });

  it("localizes the heading, the count, and the button on the id locale", () => {
    render(<RoadmapProgressCard locale="id" manifest={MANIFEST} courseCards={cards()} sequences={sequences()} />);

    expect(screen.getByText("Progres Anda (tersimpan di browser ini)")).toBeTruthy();
    expect(screen.getByText("0 dari 2 kursus inti selesai")).toBeTruthy();
    expect(screen.getByRole("link").textContent).toContain("Mulai: Just Enough Bash");
  });
});
