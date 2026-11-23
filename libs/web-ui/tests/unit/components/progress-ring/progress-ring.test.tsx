import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgressRing } from "../../../../src/components/progress-ring/progress-ring";

describe("ProgressRing", () => {
  it("renders progressbar role", () => {
    const { container } = render(<ProgressRing progress={0.5} />);
    expect(container.querySelector("progress")).toBeTruthy();
  });

  it("aria-valuenow reflects progress", () => {
    const { container } = render(<ProgressRing progress={0.75} />);
    expect(container.querySelector("progress")?.getAttribute("aria-valuenow")).toBe("75");
  });

  it("aria-valuemin is 0", () => {
    const { container } = render(<ProgressRing progress={0.5} />);
    expect(container.querySelector("progress")?.getAttribute("aria-valuemin")).toBe("0");
  });

  it("aria-valuemax is 100", () => {
    const { container } = render(<ProgressRing progress={0.5} />);
    expect(container.querySelector("progress")?.getAttribute("aria-valuemax")).toBe("100");
  });

  it("clamps progress above 1", () => {
    const { container } = render(<ProgressRing progress={1.5} />);
    expect(container.querySelector("progress")?.getAttribute("aria-valuenow")).toBe("100");
  });

  it("clamps progress below 0", () => {
    const { container } = render(<ProgressRing progress={-0.5} />);
    expect(container.querySelector("progress")?.getAttribute("aria-valuenow")).toBe("0");
  });

  it("renders custom size", () => {
    const { container } = render(<ProgressRing progress={0.5} size={120} />);
    expect(container.querySelector("svg")?.getAttribute("width")).toBe("120");
  });
});

describe("ProgressRing native value", () => {
  it("reports the value through a native progress element", () => {
    const { container } = render(<ProgressRing progress={0.75} />);
    const bar = container.querySelector("progress");
    expect(bar?.value).toBe(75);
    expect(bar?.max).toBe(100);
  });

  it("hides the decorative ring from assistive technology", () => {
    const { container } = render(<ProgressRing progress={0.5} />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});
