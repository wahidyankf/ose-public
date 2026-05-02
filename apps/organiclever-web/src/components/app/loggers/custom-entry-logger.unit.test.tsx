/**
 * Unit tests for CustomEntryLogger component.
 *
 * JournalRuntime is mocked — no PGlite dependency needed.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CustomEntryLogger } from "./custom-entry-logger";
import type { JournalRuntime } from "@/contexts/journal/infrastructure/runtime";

afterEach(() => {
  cleanup();
});

function makeRuntime(): JournalRuntime {
  return {
    runPromise: vi.fn().mockResolvedValue([]),
  } as unknown as JournalRuntime;
}

describe("CustomEntryLogger", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <CustomEntryLogger isOpen={false} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders new custom entry form when open without initialName", () => {
    render(<CustomEntryLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    expect(screen.getByText("New custom entry")).toBeDefined();
    expect(screen.getByPlaceholderText("e.g. Evening walk, Cold shower, Meditation")).toBeDefined();
  });

  it("shows existing type title when initialName is provided", () => {
    render(
      <CustomEntryLogger
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        runtime={makeRuntime()}
        initialName="Evening walk"
      />,
    );
    expect(screen.getByText("Log: Evening walk")).toBeDefined();
  });

  it("Save is disabled when name is empty", () => {
    render(<CustomEntryLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    const saveButtons = screen.getAllByText("Save");
    const saveButton = saveButtons[0]?.closest("button");
    expect(saveButton?.disabled).toBe(true);
  });

  it("Save is enabled when name is filled", () => {
    render(<CustomEntryLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    const nameInput = screen.getByPlaceholderText("e.g. Evening walk, Cold shower, Meditation");
    fireEvent.change(nameInput, { target: { value: "Morning stretch" } });
    const saveButtons = screen.getAllByText("Save");
    const saveButton = saveButtons[0]?.closest("button");
    expect(saveButton?.disabled).toBe(false);
  });

  it("calls onSaved after saving with valid name", () => {
    const onSaved = vi.fn();
    render(<CustomEntryLogger isOpen={true} onClose={vi.fn()} onSaved={onSaved} runtime={makeRuntime()} />);
    const nameInput = screen.getByPlaceholderText("e.g. Evening walk, Cold shower, Meditation");
    fireEvent.change(nameInput, { target: { value: "Evening walk" } });
    const saveButtons = screen.getAllByText("Save");
    fireEvent.click(saveButtons[0] as HTMLElement);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("does not call onSaved when name is empty (fails validation)", () => {
    const onSaved = vi.fn();
    render(<CustomEntryLogger isOpen={true} onClose={vi.fn()} onSaved={onSaved} runtime={makeRuntime()} />);
    // Save button is disabled so no click registers
    const saveButtons = screen.getAllByText("Save");
    const saveButton = saveButtons[0]?.closest("button");
    expect(saveButton?.disabled).toBe(true);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("icon picker buttons are rendered for new type", () => {
    render(<CustomEntryLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    // Icon buttons have aria-labels matching icon names
    const zapButton = screen.getByLabelText("zap");
    fireEvent.click(zapButton);
    expect(zapButton).toBeDefined();
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    render(<CustomEntryLogger isOpen={true} onClose={onClose} onSaved={vi.fn()} runtime={makeRuntime()} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
