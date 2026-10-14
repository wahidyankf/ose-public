import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProgressPlaceholder } from "@/features/learning-progress/shell/progress-placeholder";

afterEach(cleanup);

describe("ProgressPlaceholder", () => {
  it("renders a hidden muted block sized by the className prop", () => {
    const { container } = render(<ProgressPlaceholder className="h-4 w-24" />);
    const block = container.firstElementChild as HTMLElement;

    expect(block.tagName).toBe("SPAN");
    expect(block.getAttribute("aria-hidden")).toBe("true");
    expect(block.className.split(/\s+/)).toEqual(
      expect.arrayContaining(["inline-block", "rounded", "bg-muted", "h-4", "w-24"]),
    );
    expect(block.textContent).toBe("");
  });
});
