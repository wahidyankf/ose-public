import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, buttonVariants } from "../../../../src/primitives/button/button";

// UIW-001: keyboard focus must stay visible on every control built from the
// shared Button primitive (WCAG 2.4.7). These are the exact utilities that
// render the designed focus ring; if any of them is removed from the
// primitive — or stops compiling into an app's stylesheet — focused buttons
// go back to showing no indicator.
const FOCUS_RING_CLASSES = [
  "outline-none",
  "focus-visible:border-ring",
  "focus-visible:ring-[3px]",
  "focus-visible:ring-ring/50",
];

describe("Button primitive", () => {
  it("mounts in the DOM", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeTruthy();
  });

  it("renders as its child element when asChild is true", () => {
    render(
      <Button asChild>
        <a href="#go">Go</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Go" });
    expect(link.getAttribute("data-slot")).toBe("button");
  });
});

describe("Button primitive keyboard focus (UIW-001)", () => {
  it("renders the visible focus-ring utilities on the default button", () => {
    render(<Button>Save</Button>);

    const classes = screen.getByRole("button", { name: "Save" }).className.split(/\s+/);
    for (const focusClass of FOCUS_RING_CLASSES) {
      expect(classes).toContain(focusClass);
    }
  });

  it.each([
    { variant: "ghost", size: "icon" },
    { variant: "ghost", size: "icon-sm" },
    { variant: "outline", size: "icon" },
    { variant: "link", size: "default" },
    { variant: "destructive", size: "sm" },
  ] as const)("keeps the focus ring on variant=%s size=%s", (options) => {
    const classes = buttonVariants(options).split(/\s+/);
    for (const focusClass of FOCUS_RING_CLASSES) {
      expect(classes).toContain(focusClass);
    }
  });
});
