import { renderToString } from "react-dom/server";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { RoadmapCourseCard } from "../../../../../src/features/course-paths/shell/roadmap-course-card";
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
const SEQUENCE = ["learning/beginner", "learning/advanced"];

function renderCard(overrides: Partial<React.ComponentProps<typeof RoadmapCourseCard>> = {}) {
  return render(
    <ul>
      <RoadmapCourseCard
        locale="en"
        pathId={PATH_ID}
        position={3}
        courseId="just-enough-bash"
        data={{ title: "Just Enough Bash", format: "primer", estimatedHours: 3, isOutline: false }}
        sequence={SEQUENCE}
        {...overrides}
      />
    </ul>,
  );
}

describe("RoadmapCourseCard — order, title, and time (S20)", () => {
  it("shows the position number before the title, which is the card's only link", () => {
    renderCard();

    const row = screen.getByRole("listitem");
    expect(row.textContent).toMatch(/^3\s*Just Enough Bash/);
    const links = within(row).getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute("href")).toBe(`/en/learn/courses/just-enough-bash?path=${PATH_ID}`);
    // The whole card is clickable through the title link's overlay, so the target is never tiny.
    expect(links[0]?.className).toContain("after:absolute");
    expect(links[0]?.className).toContain("after:inset-0");
    expect(row.className).toContain("relative");
  });

  it("shows the format label and the estimated time", () => {
    renderCard();

    expect(screen.getByText("Language primer")).toBeTruthy();
    expect(screen.getByText("About 3 h")).toBeTruthy();
  });

  it("shows an Outline badge instead of a format and a time for an outline course", () => {
    renderCard({
      courseId: "capstone-secure-service",
      data: { title: "Capstone Secure Service", isOutline: true },
      sequence: SEQUENCE,
    });

    expect(screen.getByText("Outline")).toBeTruthy();
    expect(screen.queryByText("About 3 h")).toBeNull();
  });

  it("hides the meta row in the pending-restructure flat list while keeping the title link", () => {
    renderCard({ showMeta: false });

    expect(screen.getByRole("link", { name: "Just Enough Bash" })).toBeTruthy();
    expect(screen.queryByText("Language primer")).toBeNull();
    expect(screen.queryByText("About 3 h")).toBeNull();
  });

  it("localizes the format label, the time, and the status on the id locale", () => {
    renderCard({ locale: "id" });

    expect(screen.getByText("Primer bahasa")).toBeTruthy();
    expect(screen.getByText("Sekitar 3 jam")).toBeTruthy();
    expect(screen.getByText("Belum dimulai")).toBeTruthy();
  });
});

describe("RoadmapCourseCard — status in words (S20)", () => {
  it("shows Not started, In progress, and Done as words", () => {
    renderCard();
    expect(screen.getByText("Not started")).toBeTruthy();
    cleanup();

    learningProgressStore.reset();
    learningProgressStore.update((state) => setPageComplete(state, "just-enough-bash", "learning/beginner", true));
    renderCard();
    expect(screen.getByText("In progress")).toBeTruthy();
    cleanup();

    learningProgressStore.update((state) => setPageComplete(state, "just-enough-bash", "learning/advanced", true));
    renderCard();
    expect(screen.getByText("Done")).toBeTruthy();
  });

  it("shows a placeholder instead of a status word before hydration", () => {
    const html = renderToString(
      <ul>
        <RoadmapCourseCard
          locale="en"
          pathId={PATH_ID}
          position={1}
          courseId="just-enough-bash"
          data={{ title: "Just Enough Bash", format: "primer", estimatedHours: 3, isOutline: false }}
          sequence={SEQUENCE}
        />
      </ul>,
    );

    expect(html).not.toContain("Not started");
    expect(html).toContain('aria-hidden="true"');
  });
});
