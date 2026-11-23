import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ScrollArea } from "../../../../src/primitives/scroll-area/scroll-area";

describe("ScrollArea scenarios", () => {
  // @scenario specs/libs/web-ui/behaviours/scroll-area/scroll-area.feature: A scroll area scrolls overflowing content
  it("scrolls overflowing content through its viewport", () => {
    const { container } = render(
      <ScrollArea className="h-[100px]">
        <div style={{ height: "400px" }}>Long content</div>
      </ScrollArea>,
    );
    const viewport = container.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
    expect(viewport).not.toBeNull();
    if (viewport === null) return;

    expect(viewport.style.overflowY).toBe("scroll");
    viewport.scrollTop = 150;

    expect(viewport.scrollTop).toBe(150);
  });
});
