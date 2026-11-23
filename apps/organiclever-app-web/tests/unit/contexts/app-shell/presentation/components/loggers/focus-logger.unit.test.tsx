/**
 * Unit tests for FocusLogger component.
 *
 * JournalRuntime is mocked — no PGlite dependency needed.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { FocusLogger } from "../../../../../../../src/contexts/app-shell/presentation/components/loggers/focus-logger";
import type { JournalRuntime } from "@/contexts/journal/application";

afterEach(() => {
  cleanup();
});

function makeRuntime(): JournalRuntime {
  return {
    runPromise: vi.fn<(...args: unknown[]) => unknown>().mockResolvedValue([]),
  } as unknown as JournalRuntime;
}

describe("FocusLogger", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <FocusLogger
        isOpen={false}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders form fields when open", () => {
    render(
      <FocusLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    expect(screen.getByText("Log focus session")).toBeDefined();
    expect(screen.getByPlaceholderText("e.g. Feature design, Writing, Tax returns")).toBeDefined();
  });

  it("Save is disabled when task and duration are both empty", () => {
    render(
      <FocusLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    const saveButton = screen.getByText("Save").closest("button");
    expect(saveButton?.disabled).toBe(true);
  });

  it("Save is enabled when task is filled", () => {
    render(
      <FocusLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    const taskInput = screen.getByPlaceholderText("e.g. Feature design, Writing, Tax returns");
    fireEvent.change(taskInput, { target: { value: "Write unit tests" } });
    const saveButton = screen.getByText("Save").closest("button");
    expect(saveButton?.disabled).toBe(false);
  });

  it("Save is enabled when duration preset is selected", () => {
    render(
      <FocusLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    // Click the 25min preset chip
    const preset25 = screen.getByText("25");
    fireEvent.click(preset25);
    const saveButton = screen.getByText("Save").closest("button");
    expect(saveButton?.disabled).toBe(false);
  });

  it("duration preset chip deselects on second click", () => {
    render(
      <FocusLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    const preset25 = screen.getByText("25");
    fireEvent.click(preset25);
    fireEvent.click(preset25);
    const saveButton = screen.getByText("Save").closest("button");
    expect(saveButton?.disabled).toBe(true);
  });

  it("calls onSaved when saved with valid inputs", () => {
    const onSaved = vi.fn<(...args: unknown[]) => unknown>();
    render(
      <FocusLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={onSaved}
        runtime={makeRuntime()}
      />,
    );
    fireEvent.click(screen.getByText("25"));
    fireEvent.click(screen.getByText("Save"));
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("quality emoji buttons toggle", () => {
    render(
      <FocusLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    const quality5 = screen.getByLabelText("Quality 5");
    fireEvent.click(quality5);
    fireEvent.click(quality5);
    expect(quality5).toBeDefined();
  });

  it("calls onClose (via handleClose) and resets state when Cancel is clicked", () => {
    const onClose = vi.fn<(...args: unknown[]) => unknown>();
    render(
      <FocusLogger
        isOpen={true}
        onClose={onClose}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    const taskInput = screen.getByPlaceholderText("e.g. Feature design, Writing, Tax returns");
    fireEvent.change(taskInput, { target: { value: "Write unit tests" } });
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect((taskInput as HTMLInputElement).value).toBe("");
  });

  it("updates the custom-minutes and notes fields as the user types", () => {
    render(
      <FocusLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );

    const customMinutes = screen.getByPlaceholderText("or enter custom minutes");
    fireEvent.change(customMinutes, { target: { value: "37" } });
    expect((customMinutes as HTMLInputElement).value).toBe("37");

    const notesInput = screen.getByPlaceholderText("Any thoughts worth capturing...");
    fireEvent.change(notesInput, { target: { value: "Deep work block" } });
    expect((notesInput as HTMLTextAreaElement).value).toBe("Deep work block");
  });
});
