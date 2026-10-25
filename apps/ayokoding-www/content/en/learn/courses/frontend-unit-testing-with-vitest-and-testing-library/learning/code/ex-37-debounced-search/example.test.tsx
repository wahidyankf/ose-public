// @vitest-environment jsdom
// => DOM pragma: keystrokes land in a document input element.

import { afterEach, expect, test, vi } from "vitest"; // => Runner plus fakes: timers and mocks in one import.
// => vi owns timers and the fetch recorder: interaction plus time together.

import { cleanup, fireEvent, render, screen } from "@testing-library/react"; // => Sync dispatch: fireEvent plus queries on a frozen clock.
// => fireEvent joins the imports: sync dispatch composes with frozen time.
// => textbox role for the search field: label query needs no ids.

import React, { useRef, useState } from "react"; // => Refs plus state: the query text and its pending timer.
// => Ref holds the pending timer id; state holds the query text.

// => Isolation hook: pending debounce timers die with the unmount.
afterEach(() => {
  cleanup();
  // => Unmount the search field: pending timers die with the component.
  vi.useRealTimers(); // => Restore timers: the fake clock stays inside this case.
  // => Restore real timers: debounce fakes must not leak into other cases.
  // => Hook closes: pending debounce timers die with the unmount.
});

// => Subject: keystrokes update state, silence fires the search.
function SearchBox({ onSearch }: { onSearch: (q: string) => void }): React.JSX.Element {
  // => The search callback is the seam: the test scripts it, never the network.
  const [query, setQuery] = useState("");
  // => Query state updates per keystroke: the timer reads the latest value.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // => Ref survives re-renders: clearing the previous timer needs the id.
  // => Keystroke handler: updates state, clears the old timer, starts a fresh one.
  const type = (value: string): void => {
    // => Every keystroke restarts the 300ms quiet-period clock.
    setQuery(value);
    if (timer.current !== null) clearTimeout(timer.current);
    // => Clear the pending search: only silence triggers a request.
    timer.current = setTimeout(() => onSearch(value), 300);
    // => Fresh timer captures THIS keystroke's value in its closure.
  };
  return (
    <label>
      Search
      {/* => Controlled input: every keystroke flows through the debounce handler. */}
      <input value={query} onChange={(e) => type(e.target.value)} />
      {/* => Label closes: name plus control, the accessible unit complete. */}
    </label>
  );
}

test("rapid changes fire one search for the final text", async () => {
  // => The debounce contract: three changes, one request, final text.
  vi.useFakeTimers();
  // => Fake timers before typing: debounce timers must be advance-driven.
  const onSearch = vi.fn();
  // => Recorder for the search callback: count plus argument, both asserted.
  render(<SearchBox onSearch={onSearch} />);
  // => Mount the debounced field: empty query, no timers pending.
  const field = screen.getByRole("textbox", { name: "Search" });
  // => Role plus wrapping-label name: the standard accessible query.
  fireEvent.change(field, { target: { value: "a" } });
  // => First change: starts a 300ms timer, synchronously, on the fake clock.
  // => fireEvent dispatches synchronously: frozen time composes with it exactly.
  fireEvent.change(field, { target: { value: "ab" } });
  // => Second change: clears the first timer, starts a fresh 300ms one.
  fireEvent.change(field, { target: { value: "abc" } });
  // => Third change: only this timer survives; the first two were cleared.
  // => Three dispatches, one pending timer: the debounce shape, stated plainly.
  expect(onSearch).not.toHaveBeenCalled();
  // => Nothing fired yet: the quiet period has not elapsed, correctly.
  vi.advanceTimersByTime(300);
  // => The full quiet period elapses at once: exactly one timer survives.
  expect(onSearch).toHaveBeenCalledTimes(1);
  // => One call for three keystrokes: the debounce earned its keep.
  expect(onSearch).toHaveBeenCalledWith("abc");
  // => Final text only: intermediate queries never reached the callback.
  // => Case closes: one call for three changes, the debounce proved.
});
