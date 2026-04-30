import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddEntryButton } from "./add-entry-button";

afterEach(() => {
  cleanup();
});

describe("AddEntryButton", () => {
  it("renders with aria-label 'Add entry'", () => {
    render(<AddEntryButton onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "Add entry" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<AddEntryButton onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Add entry" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is keyboard reachable (has tabIndex >= 0 or is a native button)", () => {
    render(<AddEntryButton onClick={() => {}} />);
    const button = screen.getByRole("button", { name: "Add entry" });
    // Native buttons are focusable by default
    expect(button.tagName.toLowerCase()).toBe("button");
  });
});
