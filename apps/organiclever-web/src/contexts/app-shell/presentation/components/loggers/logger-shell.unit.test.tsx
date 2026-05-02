/**
 * Unit tests for LoggerShell component.
 *
 * Renders the shell with jsdom and validates the open/closed behavior and
 * button interactions without requiring a JournalRuntime.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { LoggerShell } from "./logger-shell";

afterEach(() => {
  cleanup();
});

describe("LoggerShell", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <LoggerShell isOpen={false} hue="teal" icon="zap" title="Test" onClose={vi.fn()} onSave={vi.fn()}>
        <div>content</div>
      </LoggerShell>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders title and children when isOpen is true", () => {
    render(
      <LoggerShell isOpen={true} hue="plum" icon="calendar" title="Log reading" onClose={vi.fn()} onSave={vi.fn()}>
        <div>form content</div>
      </LoggerShell>,
    );
    expect(screen.getByText("Log reading")).toBeDefined();
    expect(screen.getByText("form content")).toBeDefined();
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    render(
      <LoggerShell isOpen={true} hue="sky" icon="timer" title="Log focus" onClose={onClose} onSave={vi.fn()}>
        <div>content</div>
      </LoggerShell>,
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onSave when Save is clicked and not disabled", () => {
    const onSave = vi.fn();
    render(
      <LoggerShell
        isOpen={true}
        hue="honey"
        icon="zap"
        title="Log learning"
        onClose={vi.fn()}
        onSave={onSave}
        saveDisabled={false}
      >
        <div>content</div>
      </LoggerShell>,
    );
    fireEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("disables Save button when saveDisabled is true", () => {
    render(
      <LoggerShell
        isOpen={true}
        hue="terracotta"
        icon="clock"
        title="Log meal"
        onClose={vi.fn()}
        onSave={vi.fn()}
        saveDisabled={true}
      >
        <div>content</div>
      </LoggerShell>,
    );
    const saveButton = screen.getByText("Save").closest("button");
    expect(saveButton).not.toBeNull();
    expect(saveButton?.disabled).toBe(true);
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <LoggerShell isOpen={true} hue="sage" icon="zap" title="Custom" onClose={onClose} onSave={vi.fn()}>
        <div>content</div>
      </LoggerShell>,
    );
    // The backdrop is the outermost fixed div
    const backdrop = container.querySelector(".fixed");
    expect(backdrop).not.toBeNull();
    if (backdrop) {
      fireEvent.click(backdrop);
      // Click on the backdrop div itself (target === currentTarget)
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });
});
