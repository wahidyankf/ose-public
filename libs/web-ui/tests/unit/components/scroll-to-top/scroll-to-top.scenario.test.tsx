import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import ScrollToTop from "../../../../src/components/scroll-to-top/scroll-to-top";

function setPageScrollY(y: number) {
  Object.defineProperty(window, "pageYOffset", { configurable: true, value: y });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

describe("ScrollToTop scenarios", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setPageScrollY(0);
  });

  // @scenario specs/libs/web-ui/behaviours/scroll-to-top/scroll-to-top.feature: The button appears past the threshold and scrolls the page to the top
  it("appears past the threshold and scrolls the page to the top", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    setPageScrollY(100);
    render(<ScrollToTop threshold={300} />);
    expect(screen.queryByRole("button", { name: "Scroll to top" })).toBeNull();

    setPageScrollY(400);
    const button = screen.getByRole("button", { name: "Scroll to top" });

    fireEvent.click(button);

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
