import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Schema } from "effect";
import { JournalEntry } from "../../domain/schema";
import { EntryFormSheet } from "./entry-form-sheet";

afterEach(() => {
  cleanup();
});

const makeEntry = (overrides: Partial<{ name: string; payload: Record<string, unknown> }> = {}): JournalEntry => {
  return Schema.decodeUnknownSync(JournalEntry)({
    id: "entry-1",
    name: overrides.name ?? "workout",
    payload: overrides.payload ?? { reps: 5 },
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
    startedAt: "2024-01-15T10:00:00.000Z",
    finishedAt: "2024-01-15T10:30:00.000Z",
    labels: [],
  });
};

describe("EntryFormSheet - closed state", () => {
  it("renders nothing when open is false", () => {
    const { container } = render(<EntryFormSheet open={false} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("EntryFormSheet - create mode", () => {
  it("renders dialog with a name input and payload textarea", () => {
    render(<EntryFormSheet open={true} mode="create" onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Payload (JSON object)")).toBeInTheDocument();
  });

  it("blocks submit and shows error when name is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EntryFormSheet open={true} mode="create" onSubmit={onSubmit} onCancel={() => {}} />);

    // Clear the name field (it starts empty already) and submit
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
  });

  it("blocks submit and shows error when payload is invalid JSON", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EntryFormSheet open={true} mode="create" onSubmit={onSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText("Name"), "workout");
    const payloadArea = screen.getByLabelText("Payload (JSON object)");
    fireEvent.change(payloadArea, { target: { value: "not valid json" } });

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Payload must be valid JSON");
  });

  it("blocks submit and shows error when payload is valid JSON but not an object", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EntryFormSheet open={true} mode="create" onSubmit={onSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText("Name"), "workout");
    const payloadArea = screen.getByLabelText("Payload (JSON object)");
    fireEvent.change(payloadArea, { target: { value: "[1, 2, 3]" } });

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Payload must be a JSON object");
  });

  it("adds a draft when '+ Add another' is clicked", async () => {
    const user = userEvent.setup();
    render(<EntryFormSheet open={true} mode="create" onSubmit={() => {}} onCancel={() => {}} />);

    expect(screen.getAllByLabelText("Name")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: /add another/i }));
    expect(screen.getAllByLabelText("Name")).toHaveLength(2);
  });

  it("removes a draft when 'Remove draft' is clicked (and there is more than one)", async () => {
    const user = userEvent.setup();
    render(<EntryFormSheet open={true} mode="create" onSubmit={() => {}} onCancel={() => {}} />);

    await user.click(screen.getByRole("button", { name: /add another/i }));
    expect(screen.getAllByLabelText("Name")).toHaveLength(2);

    const removeButtons = screen.getAllByRole("button", { name: /remove draft/i });
    expect(removeButtons[0]).not.toBeDisabled();
    await user.click(removeButtons[0]!);
    expect(screen.getAllByLabelText("Name")).toHaveLength(1);
  });

  it("'Remove draft' button is disabled when only one draft remains", () => {
    render(<EntryFormSheet open={true} mode="create" onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole("button", { name: /remove draft/i })).toBeDisabled();
  });

  it("calls onSubmit with valid drafts array on valid submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<EntryFormSheet open={true} mode="create" onSubmit={onSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText("Name"), "workout");
    // payload is already {} by default — that is valid

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const args = onSubmit.mock.calls[0]![0] as Array<{ name: string; payload: Record<string, unknown> }>;
    expect(args).toHaveLength(1);
    const firstArg = args[0] as { name: string; payload: Record<string, unknown> };
    expect(firstArg.name).toBe("workout");
    expect(firstArg.payload).toEqual({});
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<EntryFormSheet open={true} mode="create" onSubmit={() => {}} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("preset chip click sets the draft name", async () => {
    const user = userEvent.setup();
    render(<EntryFormSheet open={true} mode="create" onSubmit={() => {}} onCancel={() => {}} />);

    await user.click(screen.getByRole("button", { name: "workout" }));
    expect(screen.getByLabelText("Name")).toHaveValue("workout");
  });

  it("preset chip 'reading' sets the draft name to reading", async () => {
    const user = userEvent.setup();
    render(<EntryFormSheet open={true} mode="create" onSubmit={() => {}} onCancel={() => {}} />);

    await user.click(screen.getByRole("button", { name: "reading" }));
    expect(screen.getByLabelText("Name")).toHaveValue("reading");
  });
});

describe("EntryFormSheet - edit mode", () => {
  it("seeds the form with initial entry data", () => {
    const entry = makeEntry({ name: "workout", payload: { reps: 5 } });
    render(<EntryFormSheet open={true} mode="edit" initial={entry} onSubmit={() => {}} onCancel={() => {}} />);

    expect(screen.getByLabelText("Name")).toHaveValue("workout");
    expect(screen.getByLabelText("Payload (JSON object)")).toHaveValue(JSON.stringify({ reps: 5 }, null, 2));
  });

  it("calls onSubmit with patch on valid submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const entry = makeEntry({ name: "workout", payload: { reps: 5 } });
    render(<EntryFormSheet open={true} mode="edit" initial={entry} onSubmit={onSubmit} onCancel={() => {}} />);

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const patch = onSubmit.mock.calls[0]![0] as { name: string; payload: Record<string, unknown> };
    expect(patch.name).toBe("workout");
    expect(patch.payload).toEqual({ reps: 5 });
  });

  it("calls onCancel when Cancel is clicked in edit mode", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const entry = makeEntry();
    render(<EntryFormSheet open={true} mode="edit" initial={entry} onSubmit={() => {}} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("blocks submit and shows error when name is cleared in edit mode", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const entry = makeEntry({ name: "workout" });
    render(<EntryFormSheet open={true} mode="edit" initial={entry} onSubmit={onSubmit} onCancel={() => {}} />);

    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
  });
});
