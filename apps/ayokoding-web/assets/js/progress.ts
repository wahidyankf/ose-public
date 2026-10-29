// Browser-only learning progress (P1H stub). The server never receives this
// record: completion and history stay in this origin's localStorage. P2 binds
// these helpers to the bilingual-shell and browser-progress Gherkin scenarios
// through Vitest; the real assertions live in progress.test.ts.

export const PROGRESS_KEY = "ayokoding-learn-progress-v1";

export const THEME_KEY = "theme";
export const SIDEBAR_KEY = "ayokoding-sidebar-width";
export const MOBILE_NAV_KEY = "ayokoding-mobilenav-width";

export interface ProgressRecord {
  version: 1;
  completed: string[];
  lastPath: string;
  lastCourse: string;
}

export type Reader = (key: string) => string | null;
export type Writer = (key: string, value: string) => void;

const MAX_COMPLETED = 2000;

function isStringList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_COMPLETED &&
    value.every((entry) => typeof entry === "string" && entry.length > 0 && entry.length <= 512)
  );
}

/** emptyRecord returns the blank version-1 state. */
export function emptyRecord(): ProgressRecord {
  return { version: 1, completed: [], lastPath: "", lastCourse: "" };
}

/** isValidRecord checks the strict v1 schema without throwing. */
export function isValidRecord(value: unknown): value is ProgressRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record["version"] === 1 &&
    isStringList(record["completed"]) &&
    typeof record["lastPath"] === "string" &&
    typeof record["lastCourse"] === "string"
  );
}

/** loadRecord reads the stored record; invalid or blocked storage yields empty. */
export function loadRecord(read: Reader): ProgressRecord {
  let raw: string | null = null;
  try {
    raw = read(PROGRESS_KEY);
  } catch {
    return emptyRecord();
  }
  if (raw === null) return emptyRecord();
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidRecord(parsed) ? parsed : emptyRecord();
  } catch {
    return emptyRecord();
  }
}

/** markComplete idempotently records one page; it never touches the network. */
export function markComplete(record: ProgressRecord, page: string): ProgressRecord {
  if (record.completed.includes(page)) return record;
  return { ...record, completed: [...record.completed, page] };
}

/** markIncomplete removes one page from the completed set. */
export function markIncomplete(record: ProgressRecord, page: string): ProgressRecord {
  return { ...record, completed: record.completed.filter((entry) => entry !== page) };
}

/** saveRecord persists only the progress key, leaving unrelated keys alone. */
export function saveRecord(write: Writer, record: ProgressRecord): void {
  write(PROGRESS_KEY, JSON.stringify(record));
}

/** clearRecord removes only the progress key. */
export function clearRecord(remove: (key: string) => void): void {
  remove(PROGRESS_KEY);
}
