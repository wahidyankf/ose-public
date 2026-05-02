import { EntryCard } from "./entry-card";
import type { JournalEntry, EntryId } from "../../domain/types";

interface JournalListProps {
  entries: ReadonlyArray<JournalEntry>;
  onEdit: (id: EntryId) => void;
  onDelete: (id: EntryId) => void;
  onBump: (id: EntryId) => void;
}

export function JournalList({ entries, onEdit, onDelete, onBump }: JournalListProps) {
  if (entries.length === 0) {
    return (
      <p
        style={{
          fontSize: 15,
          color: "oklch(50% 0.01 60)",
          fontWeight: 500,
          textAlign: "center",
          padding: "32px 0",
        }}
      >
        No entries yet — press + to add one
      </p>
    );
  }

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} onBump={onBump} />
      ))}
    </ul>
  );
}
