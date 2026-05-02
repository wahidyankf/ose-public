/**
 * Unit tests for AddEntrySheet component.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AddEntrySheet } from "./add-entry-sheet";

afterEach(() => {
  cleanup();
});

describe("AddEntrySheet", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(<AddEntrySheet isOpen={false} onClose={vi.fn()} onSelectEntry={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders all entry kinds when open", () => {
    render(<AddEntrySheet isOpen={true} onClose={vi.fn()} onSelectEntry={vi.fn()} />);
    expect(screen.getByText("Workout")).toBeDefined();
    expect(screen.getByText("Reading")).toBeDefined();
    expect(screen.getByText("Learning")).toBeDefined();
    expect(screen.getByText("Meal")).toBeDefined();
    expect(screen.getByText("Focus")).toBeDefined();
    expect(screen.getByText("New custom type")).toBeDefined();
  });

  it("calls onSelectEntry with kind when row is clicked", () => {
    const onSelectEntry = vi.fn();
    render(<AddEntrySheet isOpen={true} onClose={vi.fn()} onSelectEntry={onSelectEntry} />);
    // getAllByText because label may appear in multiple places; click the first button containing the text
    const readingButtons = screen.getAllByText("Reading");
    const readingButton = readingButtons[0]?.closest("button");
    expect(readingButton).not.toBeNull();
    if (readingButton) fireEvent.click(readingButton);
    expect(onSelectEntry).toHaveBeenCalledWith("reading");
  });

  it("calls onSelectEntry with 'workout' when Workout is clicked", () => {
    const onSelectEntry = vi.fn();
    render(<AddEntrySheet isOpen={true} onClose={vi.fn()} onSelectEntry={onSelectEntry} />);
    const workoutButtons = screen.getAllByText("Workout");
    const workoutButton = workoutButtons[0]?.closest("button");
    expect(workoutButton).not.toBeNull();
    if (workoutButton) fireEvent.click(workoutButton);
    expect(onSelectEntry).toHaveBeenCalledWith("workout");
  });

  it("calls onSelectEntry with 'custom' when New custom type is clicked", () => {
    const onSelectEntry = vi.fn();
    render(<AddEntrySheet isOpen={true} onClose={vi.fn()} onSelectEntry={onSelectEntry} />);
    const customButtons = screen.getAllByText("New custom type");
    const customButton = customButtons[0]?.closest("button");
    expect(customButton).not.toBeNull();
    if (customButton) fireEvent.click(customButton);
    expect(onSelectEntry).toHaveBeenCalledWith("custom");
  });

  it("calls onClose when the header close button is clicked", () => {
    const onClose = vi.fn();
    render(<AddEntrySheet isOpen={true} onClose={onClose} onSelectEntry={vi.fn()} />);
    // The close button is a sibling to the title — find the flex header row
    const titleEl = screen.getByText("Log an entry");
    // Walk up to the flex row container
    const headerRow = titleEl.parentElement;
    expect(headerRow).not.toBeNull();
    if (headerRow) {
      const closeBtn = headerRow.querySelector("button");
      expect(closeBtn).not.toBeNull();
      if (closeBtn) {
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    }
  });
});
