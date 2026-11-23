import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, fireEvent } from "@testing-library/react";
import ScrollToTop from "../../../../src/components/scroll-to-top/scroll-to-top";

describe("ScrollToTop", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when page is at the top", () => {
    const { queryByRole } = render(<ScrollToTop />);
    expect(queryByRole("button")).toBeNull();
  });

  it("renders button when page is scrolled down", async () => {
    const { queryByRole } = render(<ScrollToTop />);

    vi.spyOn(window, "pageYOffset", "get").mockReturnValue(400);
    fireEvent.scroll(window);

    await act(async () => {});

    expect(queryByRole("button")).not.toBeNull();
  });

  it("scrolls to top when button is clicked", async () => {
    const { getByRole } = render(<ScrollToTop />);

    vi.spyOn(window, "pageYOffset", "get").mockReturnValue(400);
    fireEvent.scroll(window);

    await act(async () => {});

    const button = getByRole("button");
    fireEvent.click(button);

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });

  it("has correct accessibility attributes", async () => {
    const { getByRole } = render(<ScrollToTop />);

    vi.spyOn(window, "pageYOffset", "get").mockReturnValue(400);
    fireEvent.scroll(window);

    await act(async () => {});

    const button = getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("Scroll to top");
  });

  it("respects custom threshold prop", async () => {
    const { queryByRole } = render(<ScrollToTop threshold={500} />);

    vi.spyOn(window, "pageYOffset", "get").mockReturnValue(400);
    fireEvent.scroll(window);

    await act(async () => {});

    expect(queryByRole("button")).toBeNull();

    vi.spyOn(window, "pageYOffset", "get").mockReturnValue(600);
    fireEvent.scroll(window);

    await act(async () => {});

    expect(queryByRole("button")).not.toBeNull();
  });

  it("applies custom buttonClassName when provided", async () => {
    const { getByRole } = render(<ScrollToTop buttonClassName="custom-btn" />);

    vi.spyOn(window, "pageYOffset", "get").mockReturnValue(400);
    fireEvent.scroll(window);

    await act(async () => {});

    const button = getByRole("button");
    expect(Array.from(button.classList)).toContain("custom-btn");
  });

  it("wraps the button in a div carrying className when className is provided", async () => {
    const { container } = render(<ScrollToTop className="wrapper" />);

    vi.spyOn(window, "pageYOffset", "get").mockReturnValue(400);
    fireEvent.scroll(window);

    await act(async () => {});

    const wrapper = container.querySelector("div.wrapper");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.querySelector("button")).not.toBeNull();
  });
});
