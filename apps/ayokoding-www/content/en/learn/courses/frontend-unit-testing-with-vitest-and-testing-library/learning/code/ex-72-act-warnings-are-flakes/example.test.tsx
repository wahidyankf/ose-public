// @vitest-environment jsdom
// => DOM pragma: sequential clicks mutate one counter across awaits.

import { afterEach, expect, test, vi } from "vitest";
// => vi spies on console.error: warnings become data the test can assert.

import { cleanup, render, screen } from "@testing-library/react";
// => Button role plus count text: the two-await sequence below drives both.

import "@testing-library/jest-dom/vitest";
// => toHaveTextContent reads the count after each settled interaction.

import React, { useState } from "react";
// => useState counter: every click commits through React, observably.

import userEvent from "@testing-library/user-event";
// => user-event simulates full interaction sequences, not single raw events.
// => Each call awaited: the pattern this example defends, enforced by spy.

// => Isolation hook: counts and spies both reset between cases.
afterEach(() => {
  cleanup();
  // => Isolation hook: counts and spies both reset between cases.
  // => Hook closes: the error spy never leaks into the next file.
});

// => Subject: Add climbs, the text proves each settled step.
function Stepper(): React.JSX.Element {
  // => Local subject: Add climbs, the text proves each settled step.
  // => Counter state: every click commits through React, observably.
  const [count, setCount] = useState(0);
  return (
    // => Root div groups readout and button: the stepper's whole surface.
    <div>
      {/* => Steps paragraph: the count each settled click updates. */}
      <p>Steps: {count}</p>
      {/* => Add button: updater form keeps rapid clicks from losing counts. */}
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        {/* => Button label is the accessible name: both clicks target this. */}
        Add
      </button>
    </div>
  );
}

// => Warning-free claim: zero console errors across two interactions.
test("every awaited click settles with no warnings", async () => {
  // => Warning-free claim: zero console errors across two interactions.
  const errors: unknown[] = [];
  // => Error log: the spy below records React warnings instead of printing.
  const spy = vi.spyOn(console, "error").mockImplementation((e) => {
    errors.push(e);
  });
  // => Swallowed console.error: warnings become assertable, not noise.
  const user = userEvent.setup({ delay: null });
  // => setup() builds an isolated session: no state leaks between tests.
  // => Mount the stepper: zero steps before any interaction lands.
  render(<Stepper />);
  // => Mount the stepper: zero steps before any interaction lands.
  await user.click(screen.getByRole("button", { name: "Add" }));
  // => First await settles the first commit: count text reads 1 afterward.
  expect(screen.getByText("Steps: 1")).toBeInTheDocument();
  // => Assert between clicks: each line runs behind the render it checks.
  await user.click(screen.getByRole("button", { name: "Add" }));
  // => Second await settles the second commit: sequential, never overlapping.
  expect(screen.getByText("Steps: 2")).toBeInTheDocument();
  // => Final count proves both updates committed in order, fully settled.
  expect(errors).toEqual([]);
  // => Zero warnings: no act complaint escaped the awaited sequence.
  // => A missing await above would push a warning here and fail this line.
  // => Explicit restore: console.error returns to normal after the case.
  spy.mockRestore();
  // => Explicit restore: console.error returns to normal after the case.
});
