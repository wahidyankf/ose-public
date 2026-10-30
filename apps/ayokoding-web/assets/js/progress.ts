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

/** COMPLETE_TRIGGER_SELECTOR finds the lesson completion toggles the shell renders. */
export const COMPLETE_TRIGGER_SELECTOR = "[data-progress-control='complete-trigger']";

/** BLOCKED_NOTICE_SELECTOR finds the blocked-storage notices the shell renders hidden. */
export const BLOCKED_NOTICE_SELECTOR = "[data-progress-blocked]";

/** COURSE_COUNT_SELECTOR finds the course completed-count line the shell renders. */
export const COURSE_COUNT_SELECTOR = "[data-course-progress]";

/** LESSON_MARKER_SELECTOR finds the per-lesson completed markers the shell renders. */
export const LESSON_MARKER_SELECTOR = "[data-lesson-marker]";

/** CompletionLabels carries the localized completion toggle action labels. */
export interface CompletionLabels {
  mark: string;
  unmark: string;
}

/** CompletionToggle is the lesson completion button contract. */
export interface CompletionToggle {
  pageID: string;
  setPressed(pressed: boolean, label: string): void;
  onToggle(handler: () => void): void;
}

/** CourseMarker is one course-lesson completed badge contract. */
export interface CourseMarker {
  pageID: string;
  setCompleted(completed: boolean): void;
}

/** togglePageCompletion flips one page's completed state without touching storage. */
export function togglePageCompletion(
  record: ProgressRecord,
  page: string,
): { record: ProgressRecord; completed: boolean } {
  if (record.completed.includes(page)) {
    return { record: markIncomplete(record, page), completed: false };
  }
  return { record: markComplete(record, page), completed: true };
}

/** syncCompletionToggle renders one toggle from the record, returning its pressed state. */
export function syncCompletionToggle(
  toggle: CompletionToggle,
  record: ProgressRecord,
  labels: CompletionLabels,
): boolean {
  const completed = record.completed.includes(toggle.pageID);
  toggle.setPressed(completed, completed ? labels.unmark : labels.mark);
  return completed;
}

/**
 * wireCompletionToggle binds one lesson completion toggle: it renders the
 * saved state on load, flips the page on activation, persists only the
 * progress key, and announces the outcome in the live region. Returns false
 * when the page has no completion toggle. Storage access stays in the
 * injected reader/writer so blocked storage falls back without throwing.
 */
export function wireCompletionToggle(
  toggle: CompletionToggle | null,
  status: ResetStatus | null,
  deps: { read: Reader; write: Writer; labels: CompletionLabels },
): boolean {
  if (toggle === null) return false;
  syncCompletionToggle(toggle, loadRecord(deps.read), deps.labels);
  toggle.onToggle(() => {
    const next = togglePageCompletion(loadRecord(deps.read), toggle.pageID);
    saveRecord(deps.write, next.record);
    toggle.setPressed(next.completed, next.completed ? deps.labels.unmark : deps.labels.mark);
    status?.setText(next.completed ? deps.labels.unmark : deps.labels.mark);
  });
  return true;
}

/**
 * refreshCourseDisplay marks every course-lesson badge from the record and
 * returns the completed count for the course count line.
 */
export function refreshCourseDisplay(markers: CourseMarker[], record: ProgressRecord): number {
  let done = 0;
  for (const marker of markers) {
    const completed = record.completed.includes(marker.pageID);
    marker.setCompleted(completed);
    if (completed) done += 1;
  }
  return done;
}

/** formatProgressCount renders a "{done} of {total} pages done"-style pattern. */
export function formatProgressCount(done: number, total: number, pattern: string): string {
  return pattern.replace("{done}", String(done)).replace("{total}", String(total));
}

/** COPY_SELECTOR finds the code copy buttons the content renders. */
export const COPY_SELECTOR = "[data-copy]";

/** CopyLabels carries the localized CodeBlock-style copy button labels. */
export interface CopyLabels {
  copy: string;
  copied: string;
  failed: string;
}

/** CopyControl is one code copy button contract. */
export interface CopyControl {
  source: string;
  setState(state: "copy" | "copied" | "failed", label: string): void;
  onActivate(handler: () => void): void;
}

/**
 * wireCopyControl binds one copy button: the code source reaches the
 * clipboard (or the injected copy) on activation, and the button announces
 * the outcome by swapping to its copied/failed label. Clipboard access is a
 * browser-only effect; no request is involved. Returns false when the page
 * has no copy control.
 */
export function wireCopyControl(
  control: CopyControl | null,
  deps: { copyText(text: string): Promise<void>; labels: CopyLabels },
): boolean {
  if (control === null) return false;
  control.onActivate(() => {
    deps.copyText(control.source).then(
      () => control.setState("copied", deps.labels.copied),
      () => control.setState("failed", deps.labels.failed),
    );
  });
  return true;
}

/** TABS_SELECTOR finds the tabbed content groups the pipeline renders. */
export const TABS_SELECTOR = "[data-tabs], div.tabs";

/** TabPanel is one tabbed content panel contract. */
export interface TabPanel {
  setSelected(selected: boolean): void;
}

/** TabGroup is one tabbed content region contract. */
export interface TabGroup {
  labels: string[];
  panels: TabPanel[];
  setActive(index: number): void;
  onSelect(handler: (index: number) => void): void;
}

/** tabLabels resolves tab labels from a data-tabs value, falling back to Tab N. */
export function tabLabels(items: string, count: number): string[] {
  const named = items
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, count);
  const labels = [...named];
  for (let index = labels.length; index < count; index++) labels.push(`Tab ${index + 1}`);
  return labels;
}

/** nextTabIndex moves tab selection with wraparound for arrow-key travel. */
export function nextTabIndex(current: number, count: number, direction: 1 | -1): number {
  if (count <= 0) return 0;
  return (current + direction + count) % count;
}

/**
 * wireTabGroup binds one tab group: selection shows exactly its panel and
 * reports the active tab. Usable stacked content keeps working when scripts
 * are off; the tablist semantics layer on top. Returns false when the page
 * has no tab group.
 */
export function wireTabGroup(group: TabGroup | null, initial = 0): boolean {
  if (group === null || group.panels.length === 0) return false;
  let active = Math.min(Math.max(initial, 0), group.panels.length - 1);
  const show = (index: number): void => {
    active = index;
    group.setActive(index);
    group.panels.forEach((panel, position) => panel.setSelected(position === index));
  };
  show(active);
  group.onSelect(show);
  return true;
}

/** THEME_TOGGLE_SELECTOR finds the shell theme toggle. */
export const THEME_TOGGLE_SELECTOR = "[data-theme-toggle]";

/** SIDEBAR_RESIZE_SELECTOR finds the docs sidebar resize handle. */
export const SIDEBAR_RESIZE_SELECTOR = "[data-sidebar-resize]";

/** ThemeName is the persisted shell theme. */
export type ThemeName = "light" | "dark";

/** parseTheme resolves the persisted theme, defaulting to light. */
export function parseTheme(raw: string | null): ThemeName {
  return raw === "dark" ? "dark" : "light";
}

/** nextTheme flips the shell theme. */
export function nextTheme(current: ThemeName): ThemeName {
  return current === "dark" ? "light" : "dark";
}

/** ThemeControl is the shell theme toggle contract. */
export interface ThemeControl {
  getTheme(): ThemeName;
  setTheme(theme: ThemeName): void;
  onToggle(handler: () => void): void;
}

/**
 * wireThemeToggle binds the shell theme toggle: it restores the persisted
 * theme on load, flips it on activation, and persists the choice under the
 * theme key. Blocked storage keeps the visit-only theme without persistence
 * so the page stays usable. Returns false when the page has no toggle.
 */
export function wireThemeToggle(control: ThemeControl | null, deps: { read: Reader; write: Writer }): boolean {
  if (control === null) return false;
  control.setTheme(parseTheme(deps.read(THEME_KEY)));
  control.onToggle(() => {
    const next = nextTheme(control.getTheme());
    control.setTheme(next);
    try {
      deps.write(THEME_KEY, next);
    } catch {
      // Blocked storage keeps the visit-only theme without persistence.
    }
  });
  return true;
}

/** SIDEBAR_MIN_PCT and SIDEBAR_MAX_PCT bound the persisted sidebar width. */
export const SIDEBAR_MIN_PCT = 15;
export const SIDEBAR_MAX_PCT = 35;

/** parseSidebarWidth resolves the persisted pixel width, if usable. */
export function parseSidebarWidth(raw: string | null): number | null {
  if (raw === null || !/^\d+$/.test(raw)) return null;
  const width = Number(raw);
  if (!Number.isSafeInteger(width) || width <= 0) return null;
  return width;
}

/** clampSidebarWidth keeps a resize within the supported viewport band. */
export function clampSidebarWidth(widthPx: number, viewportPx: number): number {
  const min = Math.round((viewportPx * SIDEBAR_MIN_PCT) / 100);
  const max = Math.round((viewportPx * SIDEBAR_MAX_PCT) / 100);
  return Math.min(Math.max(Math.round(widthPx), min), max);
}

/** SidebarControl is the docs sidebar resize handle contract. */
export interface SidebarControl {
  getWidth(): number;
  setWidth(px: number): void;
  onResize(handler: (next: number) => void): void;
}

/**
 * wireSidebarResize restores the persisted sidebar width on load, then
 * clamps and persists every resize. Blocked storage keeps the visit-only
 * width without persistence. Returns false when the page has no handle.
 */
export function wireSidebarResize(
  control: SidebarControl | null,
  viewport: () => number,
  deps: { read: Reader; write: Writer },
): boolean {
  if (control === null) return false;
  const saved = parseSidebarWidth(deps.read(SIDEBAR_KEY));
  if (saved !== null) control.setWidth(saved);
  control.onResize((next) => {
    const clamped = clampSidebarWidth(next, viewport());
    control.setWidth(clamped);
    try {
      deps.write(SIDEBAR_KEY, String(clamped));
    } catch {
      // Blocked storage keeps the visit-only width without persistence.
    }
  });
  return true;
}

/** detectBlockedStorage reports whether a storage probe throws. */
export function detectBlockedStorage(probe: () => void): boolean {
  try {
    probe();
    return false;
  } catch {
    return true;
  }
}

/*
 * Browser bootstrap: bind progress controls once per document. The progress
 * island lives outside htmx-swapped regions, so one DOMContentLoaded binding
 * survives partial swaps. Guarded so unit tests (node, no DOM) only exercise
 * the pure helpers above. Browser-only by construction: localStorage and DOM
 * reads/writes only, no fetch or htmx request ever carries the record.
 */
if (typeof document !== "undefined" && typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const visitOnly = createBlockedStore();
    const blocked = detectBlockedStorage(() => {
      window.localStorage.setItem("__ayokoding_probe__", "1");
      window.localStorage.removeItem("__ayokoding_probe__");
    });
    const reader: Reader = blocked ? visitOnly.read : (key) => window.localStorage.getItem(key);
    const writer: Writer = blocked ? visitOnly.write : (key, value) => window.localStorage.setItem(key, value);
    const remover = blocked ? visitOnly.remove : (key: string) => window.localStorage.removeItem(key);
    if (blocked) {
      // E6: the shell renders the notice hidden; it surfaces only when
      // storage refuses reads and writes, and the page stays usable.
      document.querySelectorAll<HTMLElement>(BLOCKED_NOTICE_SELECTOR).forEach((notice) => {
        notice.removeAttribute("hidden");
      });
    }

    const resetButton = document.querySelector<HTMLElement>(RESET_TRIGGER_SELECTOR);
    if (resetButton !== null) {
      const notice = resetButton.parentElement?.querySelector<HTMLElement>("[role='status']") ?? null;
      const status =
        notice === null
          ? null
          : {
              setText: (message: string) => {
                notice.textContent = message;
              },
            };
      resetButton.addEventListener("click", () => {
        wireResetControl(resetButton, status, {
          confirmDialog: (message) => window.confirm(message),
          remove: remover,
        });
      });
    }

    // E7: persisted theme toggle. Browser-only: a document attribute plus
    // the persisted theme key, no request involved.
    const themeButton = document.querySelector<HTMLElement>(THEME_TOGGLE_SELECTOR);
    if (themeButton !== null) {
      const name = themeButton.querySelector("[data-theme-name]");
      const control: ThemeControl = {
        getTheme: () => (document.documentElement.dataset["theme"] === "dark" ? "dark" : "light"),
        setTheme: (theme) => {
          document.documentElement.dataset["theme"] = theme;
          themeButton.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
          if (name !== null) {
            const labels = {
              light: themeButton.dataset["lightLabel"] ?? "Light",
              dark: themeButton.dataset["darkLabel"] ?? "Dark",
            };
            name.textContent = theme === "dark" ? labels.dark : labels.light;
          }
        },
        onToggle: (handler) => {
          themeButton.addEventListener("click", handler);
        },
      };
      wireThemeToggle(control, { read: reader, write: writer });
    }

    // E7: persisted sidebar resize. Drag and arrow-key travel resize the
    // sidebar custom property; the persisted pixel width restores on load.
    const resizeHandle = document.querySelector<HTMLElement>(SIDEBAR_RESIZE_SELECTOR);
    if (resizeHandle !== null) {
      const readWidth = (): number => {
        const raw = document.documentElement.style.getPropertyValue("--sidebar-width");
        return parseSidebarWidth(raw.replace("px", "").trim()) ?? 240;
      };
      const applyWidth = (px: number): void => {
        document.documentElement.style.setProperty("--sidebar-width", `${px}px`);
        resizeHandle.setAttribute("aria-valuenow", String(px));
      };
      const resizeHandlers: Array<(next: number) => void> = [];
      const fireResize = (next: number): void => {
        for (const handler of resizeHandlers) handler(next);
      };
      const control: SidebarControl = {
        getWidth: readWidth,
        setWidth: applyWidth,
        onResize: (handler) => {
          resizeHandlers.push(handler);
        },
      };
      resizeHandle.addEventListener("keydown", (event) => {
        const step = 20;
        const current = readWidth();
        if (event.key === "ArrowRight" || event.key === "ArrowUp") {
          event.preventDefault();
          fireResize(current + step);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
          event.preventDefault();
          fireResize(current - step);
        } else if (event.key === "Home") {
          event.preventDefault();
          fireResize(0);
        } else if (event.key === "End") {
          event.preventDefault();
          fireResize(Number.MAX_SAFE_INTEGER);
        }
      });
      resizeHandle.addEventListener("pointerdown", (event) => {
        try {
          resizeHandle.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture is best-effort; dragging still works.
        }
        const startX = event.clientX;
        const startWidth = readWidth();
        const move = (moveEvent: PointerEvent): void => {
          fireResize(startWidth + (moveEvent.clientX - startX));
        };
        const up = (): void => {
          resizeHandle.removeEventListener("pointermove", move);
          resizeHandle.removeEventListener("pointerup", up);
        };
        resizeHandle.addEventListener("pointermove", move);
        resizeHandle.addEventListener("pointerup", up);
      });
      wireSidebarResize(control, () => window.innerWidth, { read: reader, write: writer });
    }

    // E1: lesson completion toggles bound to the progress island.
    const completionBindings: Array<{ toggle: CompletionToggle; labels: CompletionLabels }> = [];
    document.querySelectorAll<HTMLElement>(COMPLETE_TRIGGER_SELECTOR).forEach((button) => {
      const pageID = button.dataset["page"] ?? "";
      if (!isValidPageID(pageID)) return;
      const labels: CompletionLabels = {
        mark: button.dataset["markLabel"] ?? "Mark as complete",
        unmark: button.dataset["unmarkLabel"] ?? "Mark as not complete",
      };
      const region = button.closest("[data-progress-region]");
      const live = region?.querySelector<HTMLElement>("[data-progress-status]") ?? null;
      const status =
        live === null
          ? null
          : {
              setText: (message: string) => {
                live.textContent = message;
              },
            };
      const toggle: CompletionToggle = {
        pageID,
        setPressed: (pressed, label) => {
          button.setAttribute("aria-pressed", pressed ? "true" : "false");
          button.textContent = label;
        },
        onToggle: (handler) => {
          button.addEventListener("click", handler);
        },
      };
      if (wireCompletionToggle(toggle, status, { read: reader, write: writer, labels })) {
        completionBindings.push({ toggle, labels });
      }
    });

    // E1: course completed state (badges plus the completed-count line).
    const renderCourseDisplay = (record: ProgressRecord): void => {
      const markers: CourseMarker[] = [];
      document.querySelectorAll<HTMLElement>(LESSON_MARKER_SELECTOR).forEach((badge) => {
        const course = badge.dataset["course"] ?? "";
        const lesson = badge.dataset["lesson"] ?? "";
        markers.push({
          pageID: `${course}/${lesson}`,
          setCompleted: (completed) => {
            if (completed) badge.removeAttribute("hidden");
            else badge.setAttribute("hidden", "");
          },
        });
      });
      const done = refreshCourseDisplay(markers, record);
      document.querySelectorAll<HTMLElement>(COURSE_COUNT_SELECTOR).forEach((section) => {
        const total = Number(section.dataset["total"] ?? "0");
        const line = section.querySelector<HTMLElement>("[data-course-count]");
        if (line !== null) line.textContent = formatProgressCount(done, total, section.dataset["countPattern"] ?? "");
      });
    };
    renderCourseDisplay(loadRecord(reader));

    // E5: tabbed content gains tablist semantics with keyboard travel.
    // Panels stay usable stacked content when scripts are off; the tablist
    // layers on top without changing the authored copy.
    document.querySelectorAll<HTMLElement>(TABS_SELECTOR).forEach((region, regionIndex) => {
      const panelElements = Array.from(region.querySelectorAll<HTMLElement>(":scope [data-tab], :scope .tab-panel"));
      if (panelElements.length === 0) return;
      const labels = tabLabels(region.dataset["tabs"] ?? "", panelElements.length);
      const list = document.createElement("div");
      list.setAttribute("role", "tablist");
      const tabButtons: HTMLButtonElement[] = [];
      panelElements.forEach((panel, index) => {
        const tabId = `content-tab-${regionIndex}-${index}`;
        const panelId = `content-tabpanel-${regionIndex}-${index}`;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("id", panelId);
        panel.setAttribute("aria-labelledby", tabId);
        const tab = document.createElement("button");
        tab.setAttribute("role", "tab");
        tab.setAttribute("id", tabId);
        tab.setAttribute("aria-controls", panelId);
        tab.setAttribute("tabindex", index === 0 ? "0" : "-1");
        tab.textContent = labels[index] ?? `Tab ${index + 1}`;
        tab.type = "button";
        tabButtons.push(tab);
        list.appendChild(tab);
      });
      region.insertBefore(list, region.firstChild);
      const group: TabGroup = {
        labels,
        panels: panelElements.map((panel) => ({
          setSelected: (selected) => {
            if (selected) panel.removeAttribute("hidden");
            else panel.setAttribute("hidden", "");
          },
        })),
        setActive: (index) => {
          tabButtons.forEach((tab, position) => {
            tab.setAttribute("aria-selected", position === index ? "true" : "false");
            tab.setAttribute("tabindex", position === index ? "0" : "-1");
          });
        },
        onSelect: (handler) => {
          tabButtons.forEach((tab, index) => {
            tab.addEventListener("click", () => handler(index));
          });
          list.addEventListener("keydown", (event) => {
            const current = tabButtons.indexOf(document.activeElement as HTMLButtonElement);
            if (current < 0) return;
            let next = -1;
            if (event.key === "ArrowRight") next = nextTabIndex(current, tabButtons.length, 1);
            else if (event.key === "ArrowLeft") next = nextTabIndex(current, tabButtons.length, -1);
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = tabButtons.length - 1;
            else return;
            event.preventDefault();
            tabButtons[next]?.focus();
            handler(next);
          });
        },
      };
      wireTabGroup(group);
    });

    // E4: code copy buttons with confirmation feedback. The copied
    // payload is the sibling code block's own text; clipboard access is a
    // browser-only effect with no request involved.
    document.querySelectorAll<HTMLElement>(COPY_SELECTOR).forEach((button) => {
      const code = button.previousElementSibling;
      const source = code?.textContent ?? "";
      const labels: CopyLabels = {
        copy: button.dataset["copyLabel"] ?? "Copy",
        copied: button.dataset["copiedLabel"] ?? "Copied",
        failed: button.dataset["failedLabel"] ?? "Copy failed",
      };
      const control: CopyControl = {
        source,
        setState: (state, label) => {
          button.textContent = label;
          if (state === "copy") button.removeAttribute("data-copied");
          else button.setAttribute("data-copied", state);
        },
        onActivate: (handler) => {
          button.addEventListener("click", handler);
        },
      };
      wireCopyControl(control, {
        copyText: (text) => navigator.clipboard.writeText(text),
        labels,
      });
    });

    // Cross-tab sync: another tab's write re-renders this tab without reload.
    subscribeCrossTab(
      (listener) => {
        window.addEventListener("storage", (event) => listener(event.key));
      },
      () => loadRecord(reader),
      (record) => {
        for (const { toggle, labels } of completionBindings) syncCompletionToggle(toggle, record, labels);
        renderCourseDisplay(record);
      },
    );
  });
}
