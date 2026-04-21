import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, it, expect } from "vitest";
import { Icon, type IconName } from "./icon";

const ALL_ICON_NAMES: IconName[] = [
  "dumbbell",
  "check",
  "check-circle",
  "clock",
  "timer",
  "flame",
  "trend",
  "bar-chart",
  "plus",
  "plus-circle",
  "minus",
  "x",
  "x-circle",
  "arrow-left",
  "arrow-up",
  "arrow-down",
  "chevron-right",
  "chevron-down",
  "chevron-up",
  "home",
  "history",
  "calendar",
  "settings",
  "user",
  "pencil",
  "trash",
  "grip",
  "play",
  "zap",
  "moon",
  "sun",
  "rotate-ccw",
  "more-vertical",
  "info",
  "save",
];

describe("Icon", () => {
  it("renders SVG for known icon", () => {
    const { container } = render(<Icon name="check" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders fallback circle for unknown name", () => {
    const { container } = render(<Icon name={"nonexistent" as string} />);
    expect(container.querySelector("circle")).toBeTruthy();
  });

  it("sets aria-hidden for decorative icon", () => {
    const { container } = render(<Icon name="home" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("sets role=img and aria-label for labeled icon", () => {
    render(<Icon name="home" aria-label="Home" />);
    expect(screen.getByRole("img", { name: "Home" })).toBeTruthy();
  });

  it("renders at custom size", () => {
    const { container } = render(<Icon name="check" size={32} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("32");
  });

  it("has no accessibility violations (labeled)", async () => {
    const { container } = render(<Icon name="home" aria-label="Home" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders filled check-circle variant", () => {
    const { container } = render(<Icon name="check-circle" filled />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders filled flame variant", () => {
    const { container } = render(<Icon name="flame" filled />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders with filled=false (default stroke mode)", () => {
    const { container } = render(<Icon name="check-circle" filled={false} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("fill")).toBe("none");
  });

  it("accepts className prop", () => {
    const { container } = render(<Icon name="check" className="custom-class" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("custom-class");
  });

  it.each(ALL_ICON_NAMES)("renders SVG for icon name %s", (name) => {
    const { container } = render(<Icon name={name} aria-label={name} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
