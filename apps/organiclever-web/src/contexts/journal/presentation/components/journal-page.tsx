"use client";

import { useMemo, useState } from "react";
import { makeJournalRuntime } from "../../infrastructure/runtime";
import { useJournal } from "../use-journal";
import { AddEntryButton } from "./add-entry-button";
import { EntryFormSheet } from "./entry-form-sheet";
import { JournalList } from "./journal-list";
import type { EntryId, NewEntryInput, UpdateEntryInput } from "../../domain/types";

type SheetState = { open: false } | { open: true; mode: "create" } | { open: true; mode: "edit"; entryId: EntryId };

export function JournalPage() {
  const runtime = useMemo(() => makeJournalRuntime(), []);
  const { entries, status, error, addBatch, updateEntry, deleteEntry, bumpEntry } = useJournal(runtime);

  const [sheetState, setSheetState] = useState<SheetState>({ open: false });

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "error") {
    const tag = error?._tag;
    return (
      <div data-testid="storage-error-banner" role="alert">
        {tag === "StorageUnavailable"
          ? "Storage unavailable — data was not saved."
          : "An error occurred. Please reload."}
      </div>
    );
  }

  const handleSubmitCreate = (drafts: NewEntryInput[]) => {
    addBatch(drafts);
    setSheetState({ open: false });
  };

  const handleSubmitEdit = (patch: UpdateEntryInput) => {
    if (sheetState.open && sheetState.mode === "edit") {
      updateEntry(sheetState.entryId, patch);
      setSheetState({ open: false });
    }
  };

  const handleEdit = (id: EntryId) => {
    const entry = entries.find((e) => e.id === id);
    if (entry) {
      setSheetState({ open: true, mode: "edit", entryId: id });
    }
  };

  let sheetProps: React.ComponentProps<typeof EntryFormSheet>;
  if (!sheetState.open) {
    sheetProps = { open: false };
  } else if (sheetState.mode === "create") {
    sheetProps = {
      open: true,
      mode: "create",
      onSubmit: handleSubmitCreate,
      onCancel: () => setSheetState({ open: false }),
    };
  } else {
    const entry = entries.find((e) => e.id === sheetState.entryId);
    if (!entry) {
      sheetProps = { open: false };
    } else {
      sheetProps = {
        open: true,
        mode: "edit",
        initial: entry,
        onSubmit: handleSubmitEdit,
        onCancel: () => setSheetState({ open: false }),
      };
    }
  }

  return (
    <main>
      <h1>Journal</h1>
      <AddEntryButton onClick={() => setSheetState({ open: true, mode: "create" })} />
      <JournalList entries={entries} onEdit={handleEdit} onDelete={deleteEntry} onBump={bumpEntry} />
      <EntryFormSheet {...sheetProps} />
    </main>
  );
}
