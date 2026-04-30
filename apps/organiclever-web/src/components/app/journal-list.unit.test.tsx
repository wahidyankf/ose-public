import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Schema } from "effect";
import { JournalEntry } from "@/lib/journal/schema";
import { JournalList } from "./journal-list";

afterEach(() => {
  cleanup();
});

function makeEntry(id: string, name: string): JournalEntry {
  return Schema.decodeUnknownSync(JournalEntry)({
    id,
    name,
    payload: {},
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
  });
}

describe("JournalList", () => {
  it("shows empty state message when entries array is empty", () => {
    render(<JournalList entries={[]} onEdit={() => {}} onDelete={() => {}} onBump={() => {}} />);
    expect(screen.getByText("No entries yet — press + to add one")).toBeInTheDocument();
  });

  it("renders a list item for each entry provided", () => {
    const entries = [
      makeEntry("entry-1", "workout"),
      makeEntry("entry-2", "reading"),
      makeEntry("entry-3", "meditation"),
    ];
    render(<JournalList entries={entries} onEdit={() => {}} onDelete={() => {}} onBump={() => {}} />);
    expect(screen.getByText("workout")).toBeInTheDocument();
    expect(screen.getByText("reading")).toBeInTheDocument();
    expect(screen.getByText("meditation")).toBeInTheDocument();
  });

  it("renders one entry when one is provided", () => {
    const entries = [makeEntry("entry-1", "workout")];
    render(<JournalList entries={entries} onEdit={() => {}} onDelete={() => {}} onBump={() => {}} />);
    expect(screen.queryByText("No entries yet — press + to add one")).not.toBeInTheDocument();
    expect(screen.getByText("workout")).toBeInTheDocument();
  });

  it("does not show empty state when entries are present", () => {
    const entries = [makeEntry("entry-1", "workout")];
    render(<JournalList entries={entries} onEdit={() => {}} onDelete={() => {}} onBump={() => {}} />);
    expect(screen.queryByText("No entries yet — press + to add one")).not.toBeInTheDocument();
  });
});
