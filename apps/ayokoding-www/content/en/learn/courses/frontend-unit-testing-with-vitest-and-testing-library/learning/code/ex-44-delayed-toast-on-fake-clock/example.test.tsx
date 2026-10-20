// @vitest-environment jsdom
// => DOM pragma: the click lands on a document button; the toast appears late.

import { afterEach, expect, test, vi } from "vitest"; // => Runner plus fakes: timers and mocks in one import.
// => vi owns the fake clock the toast delay waits on.

// => Act plus fireEvent: sync dispatch with flushed effects.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
// => act joins the imports: the timer advance below must flush React too.
// => fireEvent joins the imports: sync dispatch composes with frozen time.
// => button role for the trigger; role query for the delayed toast.

import "@testing-library/jest-dom/vitest"; // => DOM matchers: status presence assertions.
// => toBeInTheDocument asserts the toast once the clock lets it appear.

import React, { useState } from "react"; // => State hook: the saved flag the toast reads.
// => useState flips the toast on after a 200ms fake delay.

// => Course rule: user-event hangs on frozen clocks, so frozen tests use fireEvent.
// => fireEvent dispatches synchronously with no internal timers to freeze.

afterEach(() => {
  cleanup(); // => Unmount: the toast timer dies with the component.
  // => Unmount: the toast timer dies with the component, no leakage.
  vi.useRealTimers();
  // => Restore real timers: the frozen clock must not escape.
});

function SaveButton(): React.JSX.Element {
  // => Local subject: click saves, toast confirms 200ms later on the fake clock.
  // => Hidden start duplicated in state: the test watches this flip exactly.
  const [saved, setSaved] = useState(false);
  // => Hidden start: the toast must genuinely wait for click plus clock.
  const save = (): void => {
    // => Save handler: arms the toast timer, flips state on fire.
    setTimeout(() => setSaved(true), 200);
    // => Fake-clock delay: advancing time reveals the toast, waiting not needed.
  };
  return (
    <div>
      <button type="button" onClick={save}>
        Save
      </button>
      {saved && <p role="status">Saved!</p>}
      {/* => Conditional toast: absent until the delay elapses, truly unmounted. */}
    </div>
  );
}

test("click on a fake clock reveals the delayed toast", async () => {
  // => Combined claim: sync dispatch, fake delay, deterministic toast.
  vi.useFakeTimers();
  // => Fake clock before interaction: the 200ms delay must be advance-driven.
  // => Mount hidden: absence asserted before the click proves the wait is real.
  render(<SaveButton />);
  // => Mount hidden: assert absence before the click proves the wait is real.
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  // => No toast yet: the delay below has something to reveal.
  // => Dispatch scheduled the timer: the click committed, the toast pends.
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  // => Sync dispatch on a frozen clock: the handler schedules the toast now.
  // => No internal waits: fireEvent and fake timers compose without bridges.
  // => Still hidden after dispatch: the timer, not the click, reveals the toast.
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  // => Still hidden: the timer has not fired, the click alone reveals nothing.
  // => Two hundred fake milliseconds elapse at once: the timer is due now.
  act(() => {
    // => Two hundred fake milliseconds elapse: the timer is due now.
    vi.advanceTimersByTime(200);
    // => Full delay advanced: the scheduled callback fires synchronously now.
  });
  // => act() flushes the toast re-render: the element below exists now.
  // => Toast asserted after the advance: the delay, not luck, revealed it.
  const toast = screen.getByRole("status");
  // => Role locates the live region: names do not apply to status roles.
  expect(toast).toHaveTextContent("Saved!");
  // => Text pins the message: the delay revealed exactly this confirmation.
});
