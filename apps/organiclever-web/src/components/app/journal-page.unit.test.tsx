import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { Schema } from "effect";
import { JournalEntry, EntryId, EntryName, IsoTimestamp } from "@/lib/journal/schema";
import type { UseJournalReturn } from "@/lib/journal/use-journal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides?: { name?: string; id?: string }): JournalEntry {
  return Schema.decodeUnknownSync(JournalEntry)({
    id: overrides?.id ?? crypto.randomUUID(),
    name: overrides?.name ?? "workout",
    payload: { reps: 10 },
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
    startedAt: "2024-01-15T10:00:00.000Z",
    finishedAt: "2024-01-15T10:30:00.000Z",
    labels: [],
  });
}

// Satisfy the brand types used as keys in EntryId
const makeEntryId = (s: string) => Schema.decodeUnknownSync(EntryId)(s);
const makeEntryName = (s: string) => Schema.decodeUnknownSync(EntryName)(s);
const makeIsoTimestamp = (s: string) => Schema.decodeUnknownSync(IsoTimestamp)(s);

// Suppress unused-import warnings for the above helpers used inside makeEntry
void makeEntryId;
void makeEntryName;
void makeIsoTimestamp;

// ---------------------------------------------------------------------------
// Mock useJournal
// ---------------------------------------------------------------------------

const mockAddBatch = vi.fn();
const mockUpdateEntry = vi.fn();
const mockDeleteEntry = vi.fn();
const mockBumpEntry = vi.fn();
const mockClearEntries = vi.fn();
const mockRetry = vi.fn();

let mockReturn: UseJournalReturn = {
  entries: [],
  status: "loading",
  error: null,
  isMutating: false,
  addBatch: mockAddBatch,
  updateEntry: mockUpdateEntry,
  deleteEntry: mockDeleteEntry,
  bumpEntry: mockBumpEntry,
  clearEntries: mockClearEntries,
  retry: mockRetry,
};

vi.mock("@/lib/journal/use-journal", () => ({
  useJournal: () => mockReturn,
}));

// makeJournalRuntime is called inside JournalPage via useMemo — mock it to a no-op
vi.mock("@/lib/journal/runtime", () => ({
  makeJournalRuntime: () => ({}),
  PgliteLive: {},
  JOURNAL_STORE_DATA_DIR: "test",
}));

// Import AFTER mocks are registered
// eslint-disable-next-line import/first — mocks must precede the component import
import { JournalPage } from "./journal-page";

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  // Reset to loading state before each test
  mockReturn = {
    entries: [],
    status: "loading",
    error: null,
    isMutating: false,
    addBatch: mockAddBatch,
    updateEntry: mockUpdateEntry,
    deleteEntry: mockDeleteEntry,
    bumpEntry: mockBumpEntry,
    clearEntries: mockClearEntries,
    retry: mockRetry,
  };
});

describe("JournalPage", () => {
  it("shows loading skeleton on first render", () => {
    // mockReturn.status is "loading" from beforeEach
    render(<JournalPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty state after store resolves to empty", () => {
    mockReturn = { ...mockReturn, status: "ready", entries: [] };
    render(<JournalPage />);
    expect(screen.getByText("No entries yet — press + to add one")).toBeInTheDocument();
  });

  it("clicking Add entry button opens the create form sheet", () => {
    mockReturn = { ...mockReturn, status: "ready", entries: [] };
    render(<JournalPage />);

    // Sheet is not present initially
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));

    expect(screen.getByRole("dialog", { name: /add entries/i })).toBeInTheDocument();
  });

  it("submitting batch from create sheet calls addBatch and closes the sheet", async () => {
    mockReturn = { ...mockReturn, status: "ready", entries: [] };
    render(<JournalPage />);

    // Open sheet
    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Fill in name (payload defaults to {})
    const nameInput = screen.getByLabelText("Name");
    fireEvent.change(nameInput, { target: { value: "workout" } });

    // Submit
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save/i }));
    });

    expect(mockAddBatch).toHaveBeenCalledTimes(1);
    const submitted = mockAddBatch.mock.calls[0]?.[0] as Array<{ name: string }>;
    expect(submitted).toHaveLength(1);
    expect(submitted[0]?.name).toBe("workout");

    // Sheet should be closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clicking Edit on a card opens the form sheet in edit mode", () => {
    const entry = makeEntry({ name: "meditation", id: "entry-abc" });
    mockReturn = { ...mockReturn, status: "ready", entries: [entry] };
    render(<JournalPage />);

    // Sheet is not present initially
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));

    expect(screen.getByRole("dialog", { name: /edit entry/i })).toBeInTheDocument();
    // Name field seeded from entry
    expect(screen.getByLabelText("Name")).toHaveValue("meditation");
  });

  it("submitting edit sheet calls updateEntry with patch and closes the sheet", async () => {
    const entry = makeEntry({ name: "workout", id: "entry-xyz" });
    mockReturn = { ...mockReturn, status: "ready", entries: [entry] };
    render(<JournalPage />);

    // Open edit sheet
    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Save without changes (patch = current values)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save/i }));
    });

    expect(mockUpdateEntry).toHaveBeenCalledTimes(1);
    const [calledId, patch] = mockUpdateEntry.mock.calls[0] as [string, { name: string }];
    expect(calledId).toBe("entry-xyz");
    expect(patch.name).toBe("workout");

    // Sheet should be closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("clicking Bring-to-top calls bumpEntry with the correct id", async () => {
    const entry = makeEntry({ name: "reading", id: "entry-bump" });
    mockReturn = { ...mockReturn, status: "ready", entries: [entry] };
    render(<JournalPage />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /bring to top/i }));
    });

    expect(mockBumpEntry).toHaveBeenCalledTimes(1);
    expect(mockBumpEntry).toHaveBeenCalledWith("entry-bump");
  });

  it("clicking Delete then confirming calls deleteEntry with the correct id", async () => {
    const entry = makeEntry({ name: "meal", id: "entry-del" });
    mockReturn = { ...mockReturn, status: "ready", entries: [entry] };
    render(<JournalPage />);

    // First click shows confirmation
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();

    // Confirm deletion
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^yes$/i }));
    });

    expect(mockDeleteEntry).toHaveBeenCalledTimes(1);
    expect(mockDeleteEntry).toHaveBeenCalledWith("entry-del");
  });
});
