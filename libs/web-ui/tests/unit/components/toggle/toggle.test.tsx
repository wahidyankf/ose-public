import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { Toggle } from "../../../../src/components/toggle/toggle";

describe("Toggle", () => {
  it("renders with role switch", () => {
    render(<Toggle value={false} onChange={() => {}} />);
    expect(screen.getByRole("switch")).toBeTruthy();
  });

  it("aria-checked false when value is false", () => {
    render(<Toggle value={false} onChange={() => {}} />);
    expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("false");
  });

  it("aria-checked true when value is true", () => {
    render(<Toggle value={true} onChange={() => {}} />);
    expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("true");
  });

  it("calls onChange with true when clicked in off state", () => {
    const onChange = vi.fn();
    render(<Toggle value={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("calls onChange with false when clicked in on state", () => {
    const onChange = vi.fn();
    render(<Toggle value={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("does not call onChange when disabled", () => {
    const onChange = vi.fn();
    render(<Toggle value={false} onChange={onChange} disabled />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders label when provided", () => {
    render(<Toggle value={false} onChange={() => {}} label="Notifications" />);
    expect(screen.getByText("Notifications")).toBeTruthy();
  });
});

describe("Toggle accessible name", () => {
  it("names the switch after its visible label", () => {
    render(<Toggle value={false} onChange={() => {}} label="Notifications" />);
    expect(screen.getByRole("switch", { name: "Notifications" })).toBeTruthy();
  });
});
