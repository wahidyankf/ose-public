import { renderToString } from "react-dom/server";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PathPhase } from "../../../../../src/features/course-paths/core/schemas";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { PhaseProgress } from "../../../../../src/features/course-paths/shell/phase-progress";
// eslint-disable-next-line import/first
import { learningProgressStore } from "../../../../../src/features/learning-progress/shell/progress-storage";
// eslint-disable-next-line import/first
import { setPageComplete } from "../../../../../src/features/learning-progress/core/progress-state";

afterEach(cleanup);

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
});

const PHASE: PathPhase = {
  id: "shell-foundations",
  title: "Shell foundations",
  kind: "core",
  outcome: { can: "edit code quickly" },
  courses: ["just-enough-bash", "backend-essentials"],
};

const SEQUENCES = {
  "just-enough-bash": ["learning/beginner"],
  "backend-essentials": ["learning/overview"],
};

function renderPhaseProgress(locale = "en") {
  return render(<PhaseProgress locale={locale} phase={PHASE} sequences={SEQUENCES} />);
}

describe("PhaseProgress", () => {
  it("states the phase status in words with its done count and a meter", () => {
    // A phase counts whole courses, so the first course has to be finished for one to count.
    learningProgressStore.update((state) => setPageComplete(state, "just-enough-bash", "learning/beginner", true));
    const { container } = renderPhaseProgress();

    expect(screen.getByText("In progress")).toBeTruthy();
    expect(screen.getByText("1 of 2 done")).toBeTruthy();
    const track = container.querySelector("[aria-hidden='true'] > div");
    expect(track?.getAttribute("style")).toContain("50%");
    expect(track?.className).toContain("bg-amber-700");
  });

  it("reports a finished phase as Done with a full green meter", () => {
    learningProgressStore.update((state) =>
      setPageComplete(
        setPageComplete(state, "just-enough-bash", "learning/beginner", true),
        "backend-essentials",
        "learning/overview",
        true,
      ),
    );
    const { container } = renderPhaseProgress();

    expect(screen.getByText("Done")).toBeTruthy();
    expect(screen.getByText("2 of 2 done")).toBeTruthy();
    expect(container.querySelector("[aria-hidden='true'] > div")?.className).toContain("bg-green-700");
  });

  it("reports a phase with nothing done as Not started with an empty track", () => {
    const { container } = renderPhaseProgress();

    expect(screen.getByText("Not started")).toBeTruthy();
    expect(screen.getByText("0 of 2 done")).toBeTruthy();
    expect(container.querySelector("[aria-hidden='true'] > div")?.getAttribute("style")).toContain("0%");
  });

  it("shows placeholders instead of a count and a status word before hydration", () => {
    const html = renderToString(<PhaseProgress locale="en" phase={PHASE} sequences={SEQUENCES} />);

    expect(html).not.toContain("of 2 done");
    expect(html).toContain('aria-hidden="true"');
  });

  it("localizes the status word and the count on the id locale", () => {
    renderPhaseProgress("id");

    expect(screen.getByText("Belum dimulai")).toBeTruthy();
    expect(screen.getByText("0 dari 2 selesai")).toBeTruthy();
  });
});
