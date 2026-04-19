import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import ScrollToTop from "./ScrollToTop";

describe("ScrollToTop", () => {
  beforeEach(() => {
    // Mock window.scrollTo
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

    // Simulate scrolling down
    vi.spyOn(window, "pageYOffset", "get").mockReturnValue(400);
    fireEvent.scroll(window);

    // Wait for state update
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(queryByRole("button")).not.toBeNull();
  });

  it("scrolls to top when button is clicked", async () => {
    const { getByRole } = render(<ScrollToTop />);

    // Simulate scrolling down
    vi.spyOn(window, "pageYOffset", "get").mockReturnValue(400);
    fireEvent.scroll(window);

    // Wait for state update
    await new Promise((resolve) => setTimeout(resolve, 0));

    const button = getByRole("button");
    fireEvent.click(button);

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });

  it("has correct accessibility attributes", async () => {
    const { getByRole } = render(<ScrollToTop />);

    // Simulate scrolling down
    vi.spyOn(window, "pageYOffset", "get").mockReturnValue(400);
    fireEvent.scroll(window);

    // Wait for state update
    await new Promise((resolve) => setTimeout(resolve, 0));

    const button = getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("Scroll to top");
  });
});
