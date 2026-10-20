// @vitest-environment jsdom
// => DOM pragma: the full-stack file renders, clicks, mocks, and times.

import { afterEach, expect, test, vi } from "vitest"; // => Full-stack surface: timers, mocks, and assertions in one import.
// => Full runner surface: timers, mocks, and assertions in one file.

import { cleanup, fireEvent, render, screen } from "@testing-library/react"; // => Render plus events: role and text queries drive the stack.
// => Render plus role and text queries: the user-facing half of the stack.
// => fireEvent rides along: sync dispatch for the frozen-clock timer below.

import "@testing-library/jest-dom/vitest";
// => DOM matchers: text and document assertions for the rendered half.

import React, { useState } from "react";
// => State plus effect-free timer: the component under the full stack.

// => Isolation hook: the full stack leaves nothing behind, by habit now.
afterEach(() => {
  cleanup();
  // => Isolation hook: the full stack leaves nothing behind, by habit now.
  vi.useRealTimers();
  // => Restore timers: the fake clock below stays inside this final case.
  // => Hook closes: the fake clock stays inside this final case.
});

// => Callback prop: the mock observes what the timer-plus-click produces.
function Reminder({ onRemind }: { onRemind: (msg: string) => void }): React.JSX.Element {
  // => Callback prop: the mock observes what the timer-plus-click produces.
  // => Armed flag: the button arms it, the timer fires the callback through it.
  const [armed, setArmed] = useState(false);
  // => Armed flag: the button arms it, the timer fires the callback through it.
  const arm = (): void => {
    setArmed(true);
    // => Immediate state: the button text flips before any timer runs.
    // => Fake-clock delay: the advance below fires it with zero waiting.
    setTimeout(() => onRemind("Time to review!"), 5000);
    // => Fake-clock delay: the advance below fires it with zero waiting.
  };
  return (
    // => Root div holds the arming button: the full-stack surface in miniature.
    <div>
      <button type="button" onClick={arm} disabled={armed}>
        {/* => Disabled after arming: double-clicks cannot schedule twice. */}
        {/* => Button text flips on arm: the state the disabled assertion reads. */}
        {armed ? "Reminder set" : "Remind me"}
      </button>
    </div>
  );
}

// => Integration claim: all four layers cooperate in one deterministic run.
test("full stack: query, click, mock, and timer agree", async () => {
  // => Integration claim: all four layers cooperate in one deterministic run.
  // => Fake clock first: the five-second delay must be advance-driven.
  vi.useFakeTimers();
  // => Fake clock first: the five-second delay must be advance-driven.
  const onRemind = vi.fn();
  // => Recorder for the callback: the timer's effect lands here observably.
  render(<Reminder onRemind={onRemind} />);
  // => Mount the reminder: button says Remind me, enabled, callback uncalled.
  const button = screen.getByRole("button", { name: "Remind me" });
  // => Role query anchors the stack: the interaction starts from a query.
  fireEvent.click(button);
  // => Sync dispatch on a frozen clock: the handler arms and schedules at once.
  // => Query plus dispatch: layers one and two, settled together, no awaits.
  expect(screen.getByRole("button", { name: "Reminder set" })).toBeDisabled();
  // => Disabled state proves the click committed: layer two settled visibly.
  expect(onRemind).not.toHaveBeenCalled();
  // => Timer pending: the callback must NOT fire before its delay elapses.
  // => Full delay advanced: the scheduled callback fires synchronously now.
  vi.advanceTimersByTime(5000);
  // => Full delay advanced: the scheduled callback fires synchronously now.
  expect(onRemind).toHaveBeenCalledTimes(1);
  // => Exactly once: disabled button plus single timer, no double schedule.
  expect(onRemind).toHaveBeenCalledWith("Time to review!");
  // => Exact message: the timer carried the right payload, not just a call.
});
