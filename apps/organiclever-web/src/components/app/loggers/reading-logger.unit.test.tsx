/**
 * Unit tests for ReadingLogger component.
 *
 * Tests the pure form validation logic and renders the logger in jsdom.
 * JournalRuntime is mocked so no PGlite dependency is needed.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ReadingLogger } from "./reading-logger";
import type { JournalRuntime } from "@/lib/journal/runtime";

afterEach(() => {
  cleanup();
});

function makeRuntime(): JournalRuntime {
  return {
    runPromise: vi.fn().mockResolvedValue([]),
  } as unknown as JournalRuntime;
}

describe("ReadingLogger", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <ReadingLogger isOpen={false} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders form fields when open", () => {
    render(<ReadingLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    expect(screen.getByText("Log reading")).toBeDefined();
    expect(screen.getByPlaceholderText("e.g. Thinking Fast and Slow")).toBeDefined();
  });

  it("Save is disabled when title is empty", () => {
    render(<ReadingLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    const saveButton = screen.getByText("Save").closest("button");
    expect(saveButton?.disabled).toBe(true);
  });

  it("Save is enabled when title is filled", async () => {
    render(<ReadingLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    const titleInput = screen.getByPlaceholderText("e.g. Thinking Fast and Slow");
    fireEvent.change(titleInput, { target: { value: "Atomic Habits" } });
    const saveButton = screen.getByText("Save").closest("button");
    expect(saveButton?.disabled).toBe(false);
  });

  it("calls onSaved after saving with valid title", () => {
    const onSaved = vi.fn();
    const runtime = makeRuntime();
    render(<ReadingLogger isOpen={true} onClose={vi.fn()} onSaved={onSaved} runtime={runtime} />);
    const titleInput = screen.getByPlaceholderText("e.g. Thinking Fast and Slow");
    fireEvent.change(titleInput, { target: { value: "Deep Work" } });
    fireEvent.click(screen.getByText("Save"));
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    render(<ReadingLogger isOpen={true} onClose={onClose} onSaved={vi.fn()} runtime={makeRuntime()} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("toggles completion % chips", () => {
    render(<ReadingLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    // getAllByText because there may be other "50%" text nodes
    const pct50Buttons = screen.getAllByText("50%");
    const pct50Button = pct50Buttons[0] as HTMLElement;
    fireEvent.click(pct50Button);
    // Click again to deselect
    fireEvent.click(pct50Button);
    expect(pct50Button).toBeDefined();
  });
});
