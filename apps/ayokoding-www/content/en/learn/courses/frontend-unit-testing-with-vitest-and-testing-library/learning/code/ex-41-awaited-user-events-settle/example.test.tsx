// @vitest-environment jsdom
// => DOM pragma: sequential interactions mutate one document in order.

import { afterEach, expect, test, vi } from "vitest";
// => vi spies on console.error: act warnings would surface there if present.

import { cleanup, render, screen } from "@testing-library/react";
// => button and textbox roles: the adder form has two interactive parts.

import "@testing-library/jest-dom/vitest";
// => toHaveTextContent reads the running total after each addition.

import React, { useState } from "react";
// => useState accumulates the total: every click commits through React.

import userEvent from "@testing-library/user-event";
// => user-event simulates full interaction sequences, not single raw events.
// => Each awaited call settles React updates before the next line runs.

// => Isolation hook: counts and spies both reset between cases.
afterEach(() => {
  cleanup();
  // => Isolation hook: accumulated totals reset with the unmount.
  // => Hook closes: accumulated totals die with the unmount.
});

// => Subject: type a number, click add, watch the total climb.
function Adder(): React.JSX.Element {
  // => Local subject: type a number, click add, watch the total climb.
  // => Running total: every awaited interaction settles into this state.
  const [total, setTotal] = useState(0);
  // => Running total: the value each awaited interaction must settle.
  // => Draft holds the field text: submit reads and clears it atomically.
  const [draft, setDraft] = useState("");
  // => Draft holds the field text: submit reads and clears it atomically.
  return (
    <div>
      <label>
        {/* => Label text names the textbox the typing steps query. */}
        Amount
        {/* => Controlled amount field: draft state mirrors every keystroke. */}
        <input value={draft} onChange={(e) => setDraft(e.target.value)} />
        {/* => Label closes: name plus control associated by nesting. */}
      </label>
      {/* => Submit button: reads the draft, bumps the total, clears the field. */}
      <button
        type="button"
        onClick={() => {
          // => Adds the draft to the running total: updater form defeats staleness.
          setTotal((t) => t + Number(draft));
          setDraft("");
        }}
      >
        {/* => Button label is the accessible name the click queries target. */}
        Add
        {/* => Button closes: handler wired, named, ready for clicks. */}
      </button>
      {/* => Total paragraph: the settled value each assertion reads. */}
      <p>Total: {total}</p>
    </div>
  );
}

// => Settling claim: three interactions, three settled assertions, zero warnings.
test("sequential awaits keep assertions behind renders", async () => {
  // => The settling claim: three interactions, three settled assertions.
  // => Error log: the console spy records React warnings instead of printing.
  const errors: unknown[] = [];
  // => Error log: console.error spy below records React warnings, if any.
  // => Swallowed console.error: warnings become assertable data, not noise.
  const spy = vi.spyOn(console, "error").mockImplementation((e) => {
    errors.push(e);
    // => Case closes: sequence settled, warnings absent, spy restored.
  });
  // => Spy swallows console.error: warnings become assertable data, not noise.
  // => Isolated session, no inter-key pauses: interactions dispatch instantly.
  const user = userEvent.setup({ delay: null });
  // => setup() builds an isolated session: no state leaks between tests.
  // => Mount the adder: total zero is the baseline before any interaction lands.
  render(<Adder />);
  // => Mount the adder: total zero is the baseline before any interaction.
  await user.type(screen.getByRole("textbox", { name: "Amount" }), "10");
  // => Type first: the draft must commit before the click reads it.
  await user.click(screen.getByRole("button", { name: "Add" }));
  // => Click second: submit reads the settled draft, total becomes 10.
  // => First total pinned: the draft committed and the submit cleared it.
  expect(screen.getByText("Total: 10")).toBeInTheDocument();
  // => Assert between interactions: each await settled the render it checks.
  await user.type(screen.getByRole("textbox", { name: "Amount" }), "5");
  // => Second round: draft cleared by submit, typing starts from empty.
  await user.click(screen.getByRole("button", { name: "Add" }));
  // => Fourth await: total climbs to 15 only if every prior step settled.
  expect(screen.getByText("Total: 15")).toBeInTheDocument();
  // => Final total proves the sequence: type, click, type, click, all settled.
  expect(errors).toEqual([]);
  // => Zero console errors: no act warnings escaped the awaited sequence.
  // => Explicit restore: console.error returns to normal after the case.
  spy.mockRestore();
  // => Explicit restore: the spy swallowed console.error for this case only.
});
