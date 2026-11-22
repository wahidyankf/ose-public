/**
 * Unit tests for CustomEntryLogger component.
 *
 * JournalRuntime is mocked — no PGlite dependency needed.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { CustomEntryLogger } from "../../../../../../../src/contexts/app-shell/presentation/components/loggers/custom-entry-logger";
import type { JournalRuntime } from "@/contexts/journal/application";

afterEach(() => {
  cleanup();
});

function makeRuntime(): JournalRuntime {
  return {
    runPromise: vi.fn<(...args: unknown[]) => unknown>().mockResolvedValue([]),
  } as unknown as JournalRuntime;
}

describe("CustomEntryLogger", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <CustomEntryLogger
        isOpen={false}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders new custom entry form when open without initialName", () => {
    render(
      <CustomEntryLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    expect(screen.getByText("New custom entry")).toBeDefined();
    expect(screen.getByPlaceholderText("e.g. Evening walk, Cold shower, Meditation")).toBeDefined();
  });

  it("shows existing type title when initialName is provided", () => {
    render(
      <CustomEntryLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
        initialName="Evening walk"
      />,
    );
    expect(screen.getByText("Log: Evening walk")).toBeDefined();
  });

  it("Save is disabled when name is empty", () => {
    render(
      <CustomEntryLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    const saveButtons = screen.getAllByText("Save");
    const saveButton = saveButtons[0]?.closest("button");
    expect(saveButton?.disabled).toBe(true);
  });

  it("Save is enabled when name is filled", () => {
    render(
      <CustomEntryLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    const nameInput = screen.getByPlaceholderText("e.g. Evening walk, Cold shower, Meditation");
    fireEvent.change(nameInput, { target: { value: "Morning stretch" } });
    const saveButtons = screen.getAllByText("Save");
    const saveButton = saveButtons[0]?.closest("button");
    expect(saveButton?.disabled).toBe(false);
  });

  it("calls onSaved only after persistence succeeds", async () => {
    const onSaved = vi.fn<(...args: unknown[]) => unknown>();
    let resolvePersistence: (value: unknown[]) => void = () => undefined;
    const persistence = new Promise((resolve) => {
      resolvePersistence = resolve;
    });
    const runtime = {
      runPromise: vi.fn<(...args: unknown[]) => unknown>().mockReturnValue(persistence),
    } as unknown as JournalRuntime;
    render(
      <CustomEntryLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={onSaved}
        runtime={runtime}
      />,
    );
    const nameInput = screen.getByPlaceholderText("e.g. Evening walk, Cold shower, Meditation");
    fireEvent.change(nameInput, { target: { value: "Evening walk" } });
    const saveButtons = screen.getAllByText("Save");
    fireEvent.click(saveButtons[0] as HTMLElement);
    expect(onSaved).not.toHaveBeenCalled();
    resolvePersistence([]);
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
  });

  it("does not call onSaved when name is empty (fails validation)", () => {
    const onSaved = vi.fn<(...args: unknown[]) => unknown>();
    render(
      <CustomEntryLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={onSaved}
        runtime={makeRuntime()}
      />,
    );
    // Save button is disabled so no click registers
    const saveButtons = screen.getAllByText("Save");
    const saveButton = saveButtons[0]?.closest("button");
    expect(saveButton?.disabled).toBe(true);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("icon picker buttons are rendered for new type", () => {
    render(
      <CustomEntryLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    // Icon buttons have aria-labels matching icon names
    const zapButton = screen.getByLabelText("zap");
    fireEvent.click(zapButton);
    expect(zapButton).toBeDefined();
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn<(...args: unknown[]) => unknown>();
    render(
      <CustomEntryLogger
        isOpen={true}
        onClose={onClose}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("updates duration and notes fields as the user types", () => {
    render(
      <CustomEntryLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );

    const durationInput = screen.getByPlaceholderText("e.g. 30");
    fireEvent.change(durationInput, { target: { value: "45" } });
    expect((durationInput as HTMLInputElement).value).toBe("45");

    const notesInput = screen.getByPlaceholderText("How did it go? Anything worth noting...");
    fireEvent.change(notesInput, { target: { value: "Felt great" } });
    expect((notesInput as HTMLTextAreaElement).value).toBe("Felt great");
  });

  it("does not call onSaved when the slugified name fails EntryName validation", () => {
    const onSaved = vi.fn<(...args: unknown[]) => unknown>();
    const runtime = makeRuntime();
    render(
      <CustomEntryLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={onSaved}
        runtime={runtime}
      />,
    );

    const nameInput = screen.getByPlaceholderText("e.g. Evening walk, Cold shower, Meditation");
    // "!" survives slugification (only whitespace is replaced), producing
    // "custom-walk!" — invalid against EntryName's `[a-z][a-z0-9-]*` pattern.
    fireEvent.change(nameInput, { target: { value: "Walk!" } });

    const saveButtons = screen.getAllByText("Save");
    fireEvent.click(saveButtons[0] as HTMLElement);

    expect(onSaved).not.toHaveBeenCalled();
    expect(runtime.runPromise).not.toHaveBeenCalled();
  });
});
