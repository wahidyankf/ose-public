// Browser-only learning progress. The server never receives this record:
// completion and visit context stay in this origin's localStorage. Completion
// is keyed by course/lesson page identity, so it belongs to the course across
// its paths. The progress island owns one stable DOM region across htmx swaps
// (re-initialization is a no-op); no fetch or htmx request carries the record.

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
const MAX_ENTRY = 512;
const MAX_CONTEXT = 512;

function isKebabSegment(value: string): boolean {
  if (value.length === 0 || value.startsWith("-") || value.endsWith("-")) return false;
  let previousHyphen = false;
  for (const char of value) {
    const lower = char >= "a" && char <= "z";
    const digit = char >= "0" && char <= "9";
    if (lower || digit) {
      previousHyphen = false;
      continue;
    }
    if (char === "-" && !previousHyphen) {
      previousHyphen = true;
      continue;
    }
    return false;
  }
  return true;
}

function isStringList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_COMPLETED &&
    value.every((entry) => typeof entry === "string" && entry.length > 0 && entry.length <= MAX_ENTRY)
  );
}

function isContextValue(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_CONTEXT;
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
    isContextValue(record["lastPath"]) &&
    isContextValue(record["lastCourse"])
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
  if (!isValidPageID(page)) return record;
  if (record.completed.includes(page)) return record;
  if (record.completed.length >= MAX_COMPLETED) return record;
  return { ...record, completed: [...record.completed, page] };
}

/** markIncomplete removes one page from the completed set. */
export function markIncomplete(record: ProgressRecord, page: string): ProgressRecord {
  return { ...record, completed: record.completed.filter((entry) => entry !== page) };
}

/** saveRecord persists only the progress key, leaving unrelated keys alone. */
export function saveRecord(write: Writer, record: ProgressRecord): void {
  write(PROGRESS_KEY, serializeRecord(record));
}

/** clearRecord removes only the progress key. */
export function clearRecord(remove: (key: string) => void): void {
  remove(PROGRESS_KEY);
}

/** RESET_CONTROL_ID is the focus target preserved across reset cancel. */
export const RESET_CONTROL_ID = "reset-control";

/** PROGRESS_ISLAND_KEY marks the stable browser-owned progress island. */
export const PROGRESS_ISLAND_KEY = "progressIsland";

const BLOCKED_NOTICE = "Progress cannot be saved in this browser; it is kept for the current visit only.";

/** isValidPageID checks one course/lesson completion identity. */
export function isValidPageID(page: string): boolean {
  if (page.length === 0 || page.length > MAX_ENTRY) return false;
  if (page.includes("..") || page.includes("\\") || page.includes(" ")) return false;
  const segments = page.split("/");
  return segments.length === 2 && segments.every(isKebabSegment);
}

/** serializeRecord renders the record deterministically for comparisons. */
export function serializeRecord(record: ProgressRecord): string {
  const completed = [...record.completed].sort();
  return JSON.stringify({
    version: record.version,
    completed,
    lastPath: record.lastPath,
    lastCourse: record.lastCourse,
  });
}

/** BlockedStore keeps visit-only progress when storage refuses reads/writes. */
export interface BlockedStore {
  read: Reader;
  write: Writer;
  remove: (key: string) => void;
  notice: () => string;
}

/** createBlockedStore builds the visit-only fallback with its notice. */
export function createBlockedStore(): BlockedStore {
  const visit = new Map<string, string>();
  let noticed = false;
  return {
    read: (key) => (visit.has(key) ? (visit.get(key) as string) : null),
    write: (key, value) => {
      visit.set(key, value);
      if (key === PROGRESS_KEY) noticed = true;
    },
    remove: (key) => {
      visit.delete(key);
    },
    notice: () => (noticed ? BLOCKED_NOTICE : ""),
  };
}

/** subscribeCrossTab reloads progress when another tab writes storage. */
export function subscribeCrossTab(
  addStorageListener: (listener: (key: string | null) => void) => void,
  reload: () => ProgressRecord,
  onChange: (record: ProgressRecord) => void,
): void {
  addStorageListener((key) => {
    if (key === PROGRESS_KEY || key === null) onChange(reload());
  });
}

/** claimProgressIsland takes island ownership once; re-init is a no-op. */
export function claimProgressIsland(element: { dataset: Record<string, string | undefined> }): boolean {
  if (element.dataset[PROGRESS_ISLAND_KEY] === "claimed") return false;
  element.dataset[PROGRESS_ISLAND_KEY] = "claimed";
  return true;
}

/** requestCarriesProgress reports whether a request leaks the progress record. */
export function requestCarriesProgress(target: string, body?: string): boolean {
  const seen = `${target}\n${body ?? ""}`;
  return seen.includes(PROGRESS_KEY) || seen.includes('"completed"');
}

/** completedInCourse lists completions belonging to one course, in order. */
export function completedInCourse(record: ProgressRecord, courseID: string): string[] {
  return record.completed.filter((page) => page.startsWith(`${courseID}/`)).sort();
}

/** courseCompletedCount counts completions belonging to one course. */
export function courseCompletedCount(record: ProgressRecord, courseID: string): number {
  return completedInCourse(record, courseID).length;
}

/** confirmReset clears progress only when the reader confirms. */
export function confirmReset(confirmed: boolean, remove: (key: string) => void): boolean {
  if (!confirmed) return false;
  clearRecord(remove);
  return true;
}

/** ResetControl is the focusable reset button; ResetStatus is its live-region notice. */
export interface ResetControl {
  focus(): void;
}
export interface ResetStatus {
  setText(message: string): void;
}

/**
 * wireResetControl binds one reset confirmation: the button asks the reader to
 * confirm (a real dialog in the browser, injected in tests), clears only the
 * progress record on confirmation, announces the outcome in the live region,
 * and returns focus to the button either way. Returns false when the page
 * has no reset control.
 */
export function wireResetControl(
  button: ResetControl | null,
  status: ResetStatus | null,
  deps: { confirmDialog(message: string): boolean; remove(key: string): void },
): boolean {
  if (button === null) return false;
  const confirmed = deps.confirmDialog("Reset all learning progress in this browser?");
  if (confirmReset(confirmed, deps.remove)) {
    status?.setText("Progress reset.");
  }
  button.focus();
  return true;
}

/** RESET_TRIGGER_SELECTOR finds the reset control the shell renders. */
export const RESET_TRIGGER_SELECTOR = "[data-progress-control='reset-trigger']";

/*
 * Browser bootstrap: bind the reset control once per document. The progress
 * island lives outside htmx-swapped regions, so one DOMContentLoaded binding
 * survives partial swaps. Guarded so unit tests (node, no DOM) only exercise
 * the pure helpers above.
 */
if (typeof document !== "undefined" && typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.querySelector<HTMLElement>(RESET_TRIGGER_SELECTOR);
    if (button === null) return;
    const notice = button.parentElement?.querySelector<HTMLElement>("[role='status']") ?? null;
    const status =
      notice === null
        ? null
        : {
            setText: (message: string) => {
              notice.textContent = message;
            },
          };
    const blocked = createBlockedStore();
    button.addEventListener("click", () => {
      wireResetControl(button, status, {
        confirmDialog: (message) => window.confirm(message),
        remove: (key) => {
          try {
            window.localStorage.removeItem(key);
          } catch {
            blocked.remove(key);
          }
        },
      });
    });
  });
}
