// journal context — presentation layer published API.
//
// Cross-context callers (Next.js routes under `src/app/**`, the app shell,
// and other contexts that render journal-aware UI) consume the journal
// hook and screens from this barrel. Internal hook state types stay
// private to this layer.

export { useJournal } from "./use-journal";
export type { UseJournalReturn, JournalStatus } from "./use-journal";

export { JournalPage } from "./components/journal-page";
export { JournalList } from "./components/journal-list";
export { EntryCard } from "./components/entry-card";
export { AddEntryButton } from "./components/add-entry-button";
export { AddEntrySheet } from "./components/add-entry-sheet";
export type { AddEntrySheetProps } from "./components/add-entry-sheet";
export { EntryFormSheet } from "./components/entry-form-sheet";
