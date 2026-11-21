import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import ThemeToggle from "../../../../src/components/theme-toggle/theme-toggle";

describe("ThemeToggle scenarios", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light-theme");
  });

  // @scenario specs/libs/web-ui/behaviours/theme-toggle/theme-toggle.feature: The toggle switches the theme, relabels itself, and remembers the choice
  it("switches the theme, relabels itself, and remembers the choice", () => {
    localStorage.setItem("theme", "light");
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));

    expect(document.documentElement.classList.contains("light-theme")).toBe(false);
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeTruthy();
    expect(localStorage.getItem("theme")).toBe("dark");
  });
});
