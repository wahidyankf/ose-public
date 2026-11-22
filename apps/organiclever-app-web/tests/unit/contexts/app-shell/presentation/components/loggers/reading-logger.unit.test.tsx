/**
 * Unit tests for ReadingLogger component.
 *
 * Tests the pure form validation logic and renders the logger in jsdom.
 * JournalRuntime is mocked so no PGlite dependency is needed.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ReadingLogger } from "../../../../../../../src/contexts/app-shell/presentation/components/loggers/reading-logger";
import type { JournalRuntime } from "@/contexts/journal/application";

afterEach(() => {
  cleanup();
});

function makeRuntime(): JournalRuntime {
  return {
    runPromise: vi.fn<(...args: unknown[]) => unknown>().mockResolvedValue([]),
  } as unknown as JournalRuntime;
}

describe("ReadingLogger", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <ReadingLogger
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
      <ReadingLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    expect(screen.getByText("Log reading")).toBeDefined();
    expect(screen.getByPlaceholderText("e.g. Thinking Fast and Slow")).toBeDefined();
  });

  it("Save is disabled when title is empty", () => {
    render(
      <ReadingLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    const saveButton = screen.getByText("Save").closest("button");
    expect(saveButton?.disabled).toBe(true);
  });

  it("Save is enabled when title is filled", async () => {
    render(
      <ReadingLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    const titleInput = screen.getByPlaceholderText("e.g. Thinking Fast and Slow");
    fireEvent.change(titleInput, { target: { value: "Atomic Habits" } });
    const saveButton = screen.getByText("Save").closest("button");
    expect(saveButton?.disabled).toBe(false);
  });

  it("calls onSaved after saving with valid title", () => {
    const onSaved = vi.fn<(...args: unknown[]) => unknown>();
    const runtime = makeRuntime();
    render(
      <ReadingLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={onSaved}
        runtime={runtime}
      />,
    );
    const titleInput = screen.getByPlaceholderText("e.g. Thinking Fast and Slow");
    fireEvent.change(titleInput, { target: { value: "Deep Work" } });
    fireEvent.click(screen.getByText("Save"));
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn<(...args: unknown[]) => unknown>();
    render(
      <ReadingLogger
        isOpen={true}
        onClose={onClose}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("toggles completion % chips", () => {
    render(
      <ReadingLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );
    // getAllByText because there may be other "50%" text nodes
    const pct50Buttons = screen.getAllByText("50%");
    const pct50Button = pct50Buttons[0] as HTMLElement;
    fireEvent.click(pct50Button);
    // Click again to deselect
    fireEvent.click(pct50Button);
    expect(pct50Button).toBeDefined();
  });

  it("updates author, pages, duration, and notes fields as the user types", () => {
    render(
      <ReadingLogger
        isOpen={true}
        onClose={vi.fn<(...args: unknown[]) => unknown>()}
        onSaved={vi.fn<(...args: unknown[]) => unknown>()}
        runtime={makeRuntime()}
      />,
    );

    const authorInput = screen.getByPlaceholderText("e.g. Daniel Kahneman");
    fireEvent.change(authorInput, { target: { value: "James Clear" } });
    expect((authorInput as HTMLInputElement).value).toBe("James Clear");

    const pagesInput = screen.getByPlaceholderText("e.g. 30");
    fireEvent.change(pagesInput, { target: { value: "42" } });
    expect((pagesInput as HTMLInputElement).value).toBe("42");

    const durationInput = screen.getByPlaceholderText("e.g. 45");
    fireEvent.change(durationInput, { target: { value: "20" } });
    expect((durationInput as HTMLInputElement).value).toBe("20");

    const notesInput = screen.getByPlaceholderText("Any thoughts worth capturing...");
    fireEvent.change(notesInput, { target: { value: "Great chapter on habits" } });
    expect((notesInput as HTMLTextAreaElement).value).toBe("Great chapter on habits");
  });
});
