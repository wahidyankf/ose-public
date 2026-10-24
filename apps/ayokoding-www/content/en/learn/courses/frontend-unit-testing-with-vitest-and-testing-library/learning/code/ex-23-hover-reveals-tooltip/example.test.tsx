// @vitest-environment jsdom
// => DOM pragma: hover states are document state like any other.

import { afterEach, expect, test } from "vitest"; // => Runner surface: hooks, assertions, and cases.
// => Runner trio unchanged: hover adds no runner API, only pointer events.

import { cleanup, render, screen } from "@testing-library/react"; // => Render plus queries: mount the hint, read it by text.
// => button role for the trigger; queryBy for asserting the tooltip's exit.

import "@testing-library/jest-dom/vitest"; // => DOM matchers: presence and absence assertions.
// => toBeInTheDocument asserts both the appearance and the disappearance.

import React, { useState } from "react"; // => State hook: the hover flag lives here.
// => useState tracks hover: tooltip visibility is state, not CSS alone.

import userEvent from "@testing-library/user-event";
// => user-event simulates full interaction sequences, not single raw events.
// => hover dispatches pointerover, mouseover, and pointerenter in order.

// => Isolation hook opens the file: unmount plus restores, every case.
afterEach(() => {
  cleanup();
  // => Isolation hook: a lingering tooltip would pollute the next document.
  // => Hook closes: cleanup, timers, and globals reset between cases.
});

// => Subject: an info button with a hover-only help tooltip.
function HelpHint(): React.JSX.Element {
  // => Local subject: an info button with a hover-only help tooltip.
  // => Closed by default: the test proves absence before proving presence.
  const [open, setOpen] = useState(false);
  // => Closed by default: the test proves absence before proving presence.
  return (
    <div>
      <button
        type="button"
        aria-describedby="hint"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {/* => Mouse enter/leave drive the state: the hover contract in code. */}
        {/* => aria-describedby links the hint so readers get it on demand. */}
        Help
      </button>
      {open && <p id="hint">Passwords need 8 characters.</p>}
      {/* => Conditional render: absent from the DOM until hovered, truly. */}
      {/* => CSS-only tooltips stay in the DOM: this one tests real toggling. */}
    </div>
  );
}

test("hover shows the hint, leaving hides it", async () => {
  // => Two-phase case: appear on hover, disappear on leave, both asserted.
  const user = userEvent.setup({ delay: null });
  // => setup() builds an isolated session: no state leaks between tests.
  // => delay null removes inter-keystroke pauses: fast and deterministic.
  // => Real timers stay on here: no waiting happens, only event dispatch.
  // => Mount closed: the first assertion proves the absence.
  render(<HelpHint />);
  // => Mount closed: the first assertion proves the starting absence.
  expect(screen.queryByText("Passwords need 8 characters.")).not.toBeInTheDocument();
  // => queryBy returns null: absence asserted before any pointer moves.
  // => Role query for the trigger: hover never excuses weak queries.
  const trigger = screen.getByRole("button", { name: "Help" });
  // => Role query for the trigger: hover never excuses weak queries.
  await user.hover(trigger);
  // => hover() moves the virtual pointer over the button: enter events fire.
  // => Awaited like every interaction: state updates commit after dispatch.
  expect(screen.getByText("Passwords need 8 characters.")).toBeInTheDocument();
  // => getByText now finds the hint: appearance proved after hover.
  await user.unhover(trigger);
  // => unhover() moves the pointer away: leave events fire, state closes.
  expect(screen.queryByText("Passwords need 8 characters.")).not.toBeInTheDocument();
  // => Absence again: the tooltip truly unmounts instead of hiding via CSS.
  // => Case closes: appear on hover, vanish on leave, both asserted.
});
