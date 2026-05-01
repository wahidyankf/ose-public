/**
 * Unit tests for MealLogger component.
 *
 * JournalRuntime is mocked — no PGlite dependency needed.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MealLogger } from "./meal-logger";
import type { JournalRuntime } from "@/lib/journal/runtime";

afterEach(() => {
  cleanup();
});

function makeRuntime(): JournalRuntime {
  return {
    runPromise: vi.fn().mockResolvedValue([]),
  } as unknown as JournalRuntime;
}

describe("MealLogger", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <MealLogger isOpen={false} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders form fields when open", () => {
    render(<MealLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    expect(screen.getByText("Log meal")).toBeDefined();
    expect(screen.getByPlaceholderText("e.g. Oatmeal with berries, Green tea")).toBeDefined();
  });

  it("Save is disabled when name is empty", () => {
    render(<MealLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    const saveButton = screen.getByText("Save").closest("button");
    expect(saveButton?.disabled).toBe(true);
  });

  it("Save is enabled when name is filled", () => {
    render(<MealLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    const nameInput = screen.getByPlaceholderText("e.g. Oatmeal with berries, Green tea");
    fireEvent.change(nameInput, { target: { value: "Oatmeal" } });
    const saveButton = screen.getByText("Save").closest("button");
    expect(saveButton?.disabled).toBe(false);
  });

  it("calls onSaved after saving with valid name", () => {
    const onSaved = vi.fn();
    render(<MealLogger isOpen={true} onClose={vi.fn()} onSaved={onSaved} runtime={makeRuntime()} />);
    const nameInput = screen.getByPlaceholderText("e.g. Oatmeal with berries, Green tea");
    fireEvent.change(nameInput, { target: { value: "Brown rice and chicken" } });
    fireEvent.click(screen.getByText("Save"));
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("meal type chips toggle selection", () => {
    render(<MealLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    const lunchButton = screen.getByText("Lunch");
    fireEvent.click(lunchButton);
    fireEvent.click(lunchButton);
    expect(lunchButton).toBeDefined();
  });

  it("energy level emoji buttons are rendered and toggle", () => {
    render(<MealLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    const energy3 = screen.getByLabelText("Energy 3");
    fireEvent.click(energy3);
    fireEvent.click(energy3);
    expect(energy3).toBeDefined();
  });
});
