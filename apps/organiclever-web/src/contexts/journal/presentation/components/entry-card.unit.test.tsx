import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Schema } from "effect";
import { JournalEntry } from "../../domain/schema";
import { EntryCard } from "./entry-card";

afterEach(() => {
  cleanup();
});

function makeEntry(
  overrides: Partial<{
    id: string;
    name: string;
    payload: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }> = {},
): JournalEntry {
  return Schema.decodeUnknownSync(JournalEntry)({
    id: overrides.id ?? "entry-1",
    name: overrides.name ?? "workout",
    payload: overrides.payload ?? {},
    createdAt: overrides.createdAt ?? "2024-01-15T10:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2024-01-15T10:00:00.000Z",
    startedAt: "2024-01-15T10:00:00.000Z",
    finishedAt: "2024-01-15T10:30:00.000Z",
    labels: [],
  });
}

describe("EntryCard", () => {
  it("renders the entry name", () => {
    const entry = makeEntry({ name: "reading" });
    render(<EntryCard entry={entry} onEdit={() => {}} onDelete={() => {}} onBump={() => {}} />);
    expect(screen.getByText("reading")).toBeInTheDocument();
  });

  it("renders a relative time for createdAt", () => {
    const entry = makeEntry({ createdAt: "2024-01-15T10:00:00.000Z", updatedAt: "2024-01-15T10:00:00.000Z" });
    render(<EntryCard entry={entry} onEdit={() => {}} onDelete={() => {}} onBump={() => {}} />);
    // The exact format depends on the current time, but some time indicator should be present
    expect(screen.getByText(/ago|just now|\d{4}-\d{2}-\d{2}/)).toBeInTheDocument();
  });

  it("does NOT show 'edited' when updatedAt equals createdAt", () => {
    const entry = makeEntry({
      createdAt: "2024-01-15T10:00:00.000Z",
      updatedAt: "2024-01-15T10:00:00.000Z",
    });
    render(<EntryCard entry={entry} onEdit={() => {}} onDelete={() => {}} onBump={() => {}} />);
    expect(screen.queryByText(/edited/)).not.toBeInTheDocument();
  });

  it("shows 'edited' label when updatedAt is later than createdAt", () => {
    const entry = makeEntry({
      createdAt: "2024-01-15T10:00:00.000Z",
      updatedAt: "2024-01-15T11:00:00.000Z",
    });
    render(<EntryCard entry={entry} onEdit={() => {}} onDelete={() => {}} onBump={() => {}} />);
    expect(screen.getByText(/edited/)).toBeInTheDocument();
  });

  it("calls onEdit with entry id when Edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const entry = makeEntry({ id: "entry-42" });
    render(<EntryCard entry={entry} onEdit={onEdit} onDelete={() => {}} onBump={() => {}} />);

    await user.click(screen.getByRole("button", { name: /^Edit$/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(entry.id);
  });

  it("calls onBump with entry id when 'Bring to top' button is clicked", async () => {
    const user = userEvent.setup();
    const onBump = vi.fn();
    const entry = makeEntry({ id: "entry-42" });
    render(<EntryCard entry={entry} onEdit={() => {}} onDelete={() => {}} onBump={onBump} />);

    await user.click(screen.getByRole("button", { name: /bring to top/i }));
    expect(onBump).toHaveBeenCalledTimes(1);
    expect(onBump).toHaveBeenCalledWith(entry.id);
  });

  describe("delete two-step confirmation", () => {
    it("shows confirm prompt after first Delete click", async () => {
      const user = userEvent.setup();
      const entry = makeEntry();
      render(<EntryCard entry={entry} onEdit={() => {}} onDelete={() => {}} onBump={() => {}} />);

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Yes$/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Cancel$/i })).toBeInTheDocument();
    });

    it("Cancel reverts to normal state without calling onDelete", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const entry = makeEntry();
      render(<EntryCard entry={entry} onEdit={() => {}} onDelete={onDelete} onBump={() => {}} />);

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));
      await user.click(screen.getByRole("button", { name: /^Cancel$/i }));

      expect(onDelete).not.toHaveBeenCalled();
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Delete$/i })).toBeInTheDocument();
    });

    it("Yes calls onDelete with entry id", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      const entry = makeEntry({ id: "entry-99" });
      render(<EntryCard entry={entry} onEdit={() => {}} onDelete={onDelete} onBump={() => {}} />);

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));
      await user.click(screen.getByRole("button", { name: /^Yes$/i }));

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith(entry.id);
    });
  });

  it("renders 'View payload' details element", () => {
    const entry = makeEntry({ payload: { reps: 12 } });
    render(<EntryCard entry={entry} onEdit={() => {}} onDelete={() => {}} onBump={() => {}} />);
    expect(screen.getByText(/view payload/i)).toBeInTheDocument();
  });
});
