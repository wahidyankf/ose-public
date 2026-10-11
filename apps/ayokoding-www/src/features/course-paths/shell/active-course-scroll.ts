/**
 * Active-course auto-scroll helper (plan ayokoding-learn-revamp-01 §4.3, Decision D5).
 *
 * The path rail scrolls its own nearest scrollable ancestor so the current course's row is
 * centred in it — and never the page. `Element.scrollIntoView` was rejected precisely because
 * it also scrolls page-level ancestors (the article could jump on load), so setting the found
 * container's `scrollTop` is the whole mechanism here. The assignment is instant: there is no
 * smooth-scroll animation, so `prefers-reduced-motion` has nothing to respect.
 *
 * "Only when hidden": `scrollActiveCourseIntoView` moves the container only when the row is
 * not already fully inside its visible box. Moving to the next course usually leaves the new
 * row visible already, so the rail must not jump on every Previous/Next click; a hidden row
 * (first load deep in a long path, or opening the mobile drawer) is centred.
 *
 * This module is deliberately free of React imports: it is plain DOM arithmetic, unit-tested
 * in `tests/unit/features/course-paths/shell/active-course-scroll.test.ts`, and the component
 * wiring (`path-rail.tsx`) stays the only React-aware layer.
 */

/** Input for {@link centeredScrollTop} — the `*Top` positions come from `getBoundingClientRect()`. */
export interface CenteredScrollTopInput {
  /** Viewport `top` of the scroll container's visible box. */
  containerTop: number;
  /** The container's current `scrollTop` (the offset the result is relative to). */
  containerScrollTop: number;
  /** The container's visible height (`clientHeight`, padding included). */
  containerClientHeight: number;
  /** The container's full scrollable height (`scrollHeight`). */
  containerScrollHeight: number;
  /** Viewport `top` of the row to centre. */
  rowTop: number;
  /** Height of the row to centre. */
  rowHeight: number;
}

/**
 * The `scrollTop` that centres `row` inside the container's visible box: the raw offset shifts
 * the row's current viewport position to the container top, then backs off half the leftover
 * space. Rounded to the nearest integer and clamped to the scrollable range
 * `[0, containerScrollHeight - containerClientHeight]`.
 */
export function centeredScrollTop(input: CenteredScrollTopInput): number {
  const raw =
    input.containerScrollTop +
    (input.rowTop - input.containerTop) -
    (input.containerClientHeight - input.rowHeight) / 2;
  return Math.min(Math.max(Math.round(raw), 0), input.containerScrollHeight - input.containerClientHeight);
}

/**
 * The nearest ancestor of `element` whose computed `overflow-y` is `auto` or `scroll` **and**
 * whose content actually overflows (`scrollHeight > clientHeight`) — an `auto` container with
 * nothing to scroll must not be selected. The walk stops at `document.body` and returns `null`
 * there, so the page itself is never chosen as the scroll container.
 */
export function findScrollContainer(element: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = element.parentElement;
  while (node && node !== document.body) {
    const overflowY = window.getComputedStyle(node).overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/**
 * Scrolls the row into its scroll container's visible box — only when hidden (see the module
 * doc comment). Does nothing when the row has no qualifying container (per
 * {@link findScrollContainer}, never the page) or when the row is already fully visible;
 * otherwise centres it via {@link centeredScrollTop}.
 */
export function scrollActiveCourseIntoView(row: HTMLElement): void {
  const container = findScrollContainer(row);
  if (!container) {
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const rowRect = row.getBoundingClientRect();

  // "Only when hidden" (Decision D5): a row already fully inside the container's visible box
  // must not trigger a scroll, so Previous/Next clicks never make the rail jump.
  if (rowRect.top >= containerRect.top && rowRect.bottom <= containerRect.bottom) {
    return;
  }

  container.scrollTop = centeredScrollTop({
    containerTop: containerRect.top,
    containerScrollTop: container.scrollTop,
    containerClientHeight: container.clientHeight,
    containerScrollHeight: container.scrollHeight,
    rowTop: rowRect.top,
    rowHeight: rowRect.height,
  });
}
