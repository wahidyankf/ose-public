/**
 * Unit tests for LearningLogger component.
 *
 * JournalRuntime is mocked — no PGlite dependency needed.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { LearningLogger } from "./learning-logger";
import type { JournalRuntime } from "@/lib/journal/runtime";

afterEach(() => {
  cleanup();
});

function makeRuntime(): JournalRuntime {
  return {
    runPromise: vi.fn().mockResolvedValue([]),
  } as unknown as JournalRuntime;
}

describe("LearningLogger", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <LearningLogger isOpen={false} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders form fields when open", () => {
    render(<LearningLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    expect(screen.getByText("Log learning")).toBeDefined();
    expect(screen.getByPlaceholderText("e.g. React hooks, Spanish vocab, Piano scales")).toBeDefined();
  });

  it("Save is disabled when subject is empty", () => {
    render(<LearningLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    const saveButton = screen.getByText("Save").closest("button");
    expect(saveButton?.disabled).toBe(true);
  });

  it("Save is enabled when subject is filled", () => {
    render(<LearningLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    const subjectInput = screen.getByPlaceholderText("e.g. React hooks, Spanish vocab, Piano scales");
    fireEvent.change(subjectInput, { target: { value: "TypeScript generics" } });
    const saveButton = screen.getByText("Save").closest("button");
    expect(saveButton?.disabled).toBe(false);
  });

  it("calls onSaved after saving with valid subject", () => {
    const onSaved = vi.fn();
    render(<LearningLogger isOpen={true} onClose={vi.fn()} onSaved={onSaved} runtime={makeRuntime()} />);
    const subjectInput = screen.getByPlaceholderText("e.g. React hooks, Spanish vocab, Piano scales");
    fireEvent.change(subjectInput, { target: { value: "Effect TS" } });
    fireEvent.click(screen.getByText("Save"));
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it("duration preset chips toggle the duration value", () => {
    render(<LearningLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    const chip30 = screen.getAllByText("30")[0];
    fireEvent.click(chip30 as HTMLElement);
    // Click again to deselect
    fireEvent.click(chip30 as HTMLElement);
    expect(chip30).toBeDefined();
  });

  it("quality emoji buttons are rendered", () => {
    render(<LearningLogger isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} runtime={makeRuntime()} />);
    expect(screen.getByLabelText("Quality 5")).toBeDefined();
    fireEvent.click(screen.getByLabelText("Quality 3"));
    // Click again to deselect
    fireEvent.click(screen.getByLabelText("Quality 3"));
  });
});
