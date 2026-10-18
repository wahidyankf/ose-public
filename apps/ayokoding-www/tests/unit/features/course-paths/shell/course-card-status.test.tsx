import { renderToString } from "react-dom/server";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// eslint-disable-next-line import/first
import { CourseCardStatus } from "../../../../../src/features/course-paths/shell/course-card-status";
// eslint-disable-next-line import/first
import { learningProgressStore } from "../../../../../src/features/learning-progress/shell/progress-storage";
// eslint-disable-next-line import/first
import { setPageComplete } from "../../../../../src/features/learning-progress/core/progress-state";

afterEach(cleanup);

beforeEach(() => {
  learningProgressStore.reset();
  window.localStorage.clear();
});

const SEQUENCE = ["learning/beginner", "learning/advanced"];

function renderStatus(locale = "en") {
  return render(<CourseCardStatus locale={locale} courseId="just-enough-bash" sequence={SEQUENCE} />);
}

describe("CourseCardStatus", () => {
  it("shows Not started as a word with a decoration icon for an untouched course", () => {
    const { container } = renderStatus();

    expect(screen.getByText("Not started")).toBeTruthy();
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("shows In progress once a page of the course is complete", () => {
    learningProgressStore.update((state) => setPageComplete(state, "just-enough-bash", "learning/beginner", true));
    renderStatus();

    expect(screen.getByText("In progress")).toBeTruthy();
    expect(screen.queryByText("Not started")).toBeNull();
  });

  it("shows Done once every page of the course is complete", () => {
    learningProgressStore.update((state) =>
      setPageComplete(
        setPageComplete(state, "just-enough-bash", "learning/beginner", true),
        "just-enough-bash",
        "learning/advanced",
        true,
      ),
    );
    renderStatus();

    expect(screen.getByText("Done")).toBeTruthy();
  });

  it("ignores a completed page that is no longer in the course's sequence", () => {
    learningProgressStore.update((state) => setPageComplete(state, "just-enough-bash", "learning/removed", true));
    renderStatus();

    expect(screen.getByText("Not started")).toBeTruthy();
  });

  it("renders a placeholder, never a status word, before hydration", () => {
    const html = renderToString(<CourseCardStatus locale="en" courseId="just-enough-bash" sequence={SEQUENCE} />);

    expect(html).not.toContain("Not started");
    expect(html).toContain('aria-hidden="true"');
  });

  it("keeps the slot block-level in both states, so its box never inherits a line-box strut", () => {
    const { container: before } = renderStatus();
    const beforeSlot = before.querySelector("[data-progress-slot='course-status']");
    expect(beforeSlot?.classList.contains("flex")).toBe(true);
    expect(beforeSlot?.classList.contains("inline-flex")).toBe(false);

    learningProgressStore.update((state) => setPageComplete(state, "just-enough-bash", "learning/beginner", true));
    const { container: after } = renderStatus();
    const afterSlot = after.querySelector("[data-progress-slot='course-status']");
    expect(afterSlot?.className).toBe(beforeSlot?.className);
  });

  it("localizes the status word on the id locale", () => {
    renderStatus("id");

    expect(screen.getByText("Belum dimulai")).toBeTruthy();
  });
});
