import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProgressMeter } from "@/features/learning-progress/shell/progress-meter";

afterEach(cleanup);

function track(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

function fill(container: HTMLElement): HTMLElement {
  return track(container).firstElementChild as HTMLElement;
}

describe("ProgressMeter", () => {
  it("hides the decorated track from assistive tech and draws the fill at value / max", () => {
    const { container } = render(<ProgressMeter value={3} max={12} tone="primary" />);

    expect(track(container).getAttribute("aria-hidden")).toBe("true");
    expect(track(container).className.split(/\s+/)).toEqual(
      expect.arrayContaining(["h-2", "rounded-full", "bg-muted"]),
    );
    expect(fill(container).style.width).toBe("25%");
  });

  it("renders an empty track when max is 0", () => {
    const { container } = render(<ProgressMeter value={0} max={0} tone="primary" />);

    expect(fill(container).style.width).toBe("0%");
  });

  it("gives each tone its own fill colour", () => {
    const primary = render(<ProgressMeter value={1} max={2} tone="primary" />);
    expect(fill(primary.container).className).toContain("bg-primary");
    cleanup();

    const progress = render(<ProgressMeter value={1} max={2} tone="progress" />);
    expect(fill(progress.container).className).toContain("bg-amber-700");
    cleanup();

    const done = render(<ProgressMeter value={2} max={2} tone="done" />);
    expect(fill(done.container).className).toContain("bg-green-700");
  });

  it("animates the width only when motion is safe", () => {
    const { container } = render(<ProgressMeter value={1} max={2} tone="primary" />);
    const classes = fill(container).className.split(/\s+/);

    expect(classes).toContain("motion-safe:transition-[width]");
    expect(classes).toContain("motion-safe:duration-300");
    expect(classes.filter((name) => name.startsWith("transition"))).toEqual([]);
  });
});
