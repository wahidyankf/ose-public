"use client";

import { ResizablePanel } from "@open-sharia-enterprise/web-ui/primitives";

import { t } from "@/features/i18n/core/translations";
import type { Locale } from "@/features/i18n/core/config";

/** `localStorage` key under which the docs sidebar's chosen width is persisted. */
const SIDEBAR_STORAGE_KEY = "ayokoding-sidebar-width";

/** Lower/upper band bounds, as a percentage of the viewport width (prd.md's 15%-35% band). */
const MIN_WIDTH_PCT = 15;
const MAX_WIDTH_PCT = 35;

interface ResizableSidebarProps {
  locale: Locale;
  children: React.ReactNode;
}

/**
 * Client wrapper bridging the async server `ContentLayout` to the client-only
 * `ResizablePanel` primitive (which internally wires `useResizableWidth`).
 *
 * Renders the docs sidebar's `<aside>` shell itself — hidden below `md`, a
 * sticky rail from `md` up — with `ResizablePanel` nested inside it
 * (providing width + the drag/keyboard handle), rather than the reverse.
 * `<aside>` itself owns no overflow: its only child (`ResizablePanel`, given
 * `className="h-full"`) is stretched to exactly `<aside>`'s fixed height by
 * flexbox, so it never exceeds `<aside>`'s own box. `ResizablePanel`'s content
 * wrapper (`resizable-panel-content`) stays `overflow-hidden` by design (see
 * `resizable-panel.tsx`) as a width-bleed guard. Vertical scroll instead lives
 * on the div immediately inside it below — stretched to that same fixed
 * height via `h-full`, so it scrolls its own (potentially tall) content
 * without ever needing `resizable-panel-content` itself to overflow.
 * `overflow-x-hidden` is required alongside `overflow-y-auto` there: per the
 * CSS overflow spec, setting only `overflow-y` to non-`visible` makes
 * `overflow-x` compute to `auto` too, which would silently duplicate
 * `sidebar-tree.tsx`'s own horizontal scroll one level deeper. `<aside>`
 * deliberately has no `border-r` of its own — the `ResizablePanel` handle
 * already renders the sidebar/content boundary, and a second static border on
 * the same edge produced an unintentional compound double-border with no
 * visible seam between the two (see DWT-003 in this plan's rule-15 retest).
 */
export function ResizableSidebar({ locale, children }: ResizableSidebarProps) {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 md:block">
      <ResizablePanel
        storageKey={SIDEBAR_STORAGE_KEY}
        minPct={MIN_WIDTH_PCT}
        maxPct={MAX_WIDTH_PCT}
        className="h-full"
        handleAriaLabel={t(locale, "resizableSidebarHandleLabel")}
      >
        {/* `tabIndex={-1}`: Firefox tabs into scroll containers, costing keyboard users a stop
            on an element with no action. The region stays scrollable; its links still take focus
            (and auto-scroll into view) in every browser. */}
        <div tabIndex={-1} className="h-full overflow-x-hidden overflow-y-auto p-4">
          {children}
        </div>
      </ResizablePanel>
    </aside>
  );
}
