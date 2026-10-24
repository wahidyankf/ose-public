// @vitest-environment jsdom
// => DOM pragma: option selection manipulates document elements.

import { afterEach, expect, test } from "vitest";
// => Runner trio unchanged: selection is one more user-event operation.

import { cleanup, render, screen } from "@testing-library/react";
// => combobox role finds the select; option roles find its choices.

import "@testing-library/jest-dom/vitest";
// => toHaveDisplayValue reads the select's currently shown option text.

import React, { useState } from "react";
// => useState tracks the chosen plan: selection is state like any other.

import userEvent from "@testing-library/user-event";
// => user-event simulates full interaction sequences, not single raw events.
// => selectOptions clicks the option through the browser's own machinery.

afterEach(() => {
  cleanup();
  // => Isolation hook: selected options must reset like all other state.
});

function PlanPicker(): React.JSX.Element {
  // => Local subject: a two-option plan picker with visible selection state.
  const [plan, setPlan] = useState("basic");
  // => Default basic: the test asserts the default before changing it.
  return (
    // => Label root again: association by nesting, no ids anywhere.
    <label>
      {/* => Wrapping label names the combobox without id bookkeeping. */}
      {/* => Naming without ids: markup stays movable, queries stay stable. */}
      Plan
      {/* => Label text is the accessible name: combobox query hook. */}
      <select value={plan} onChange={(e) => setPlan(e.target.value)}>
        {/* => Controlled select: value from state, state from onChange. */}
        {/* => Controlled means the test drives state: no direct DOM poking. */}
        <option value="basic">Basic</option>
        {/* => Option value is the data; option text is what users read. */}
        {/* => Value/text split: the test selects by value, users read text. */}
        <option value="team">Team</option>
        {/* => Two options are enough to prove selection actually switches. */}
        {/* => Two is the minimum plural: one option cannot prove switching. */}
      </select>
      {/* => Select closes: options listed, change handler wired, controlled. */}
    </label>
    // => Label closes: name plus control, the accessible unit complete.
  );
  // => Component ends: state, select, and options in one return.
}

test("choosing Team updates the displayed plan", async () => {
  // => Case name states the user-visible outcome: displayed text changes.
  const user = userEvent.setup({ delay: null });
  // => setup() builds an isolated session: no state leaks between tests.
  // => delay null removes inter-keystroke pauses: fast and deterministic.
  // => Real timers stay on here: no waiting happens, only event dispatch.
  render(<PlanPicker />);
  // => Mount with the default: assert Basic shows before switching away.
  const picker = screen.getByRole("combobox", { name: "Plan" });
  // => select elements expose the combobox role: query the semantics.
  expect(picker).toHaveDisplayValue("Basic");
  // => Starting display pinned: the switch below has something to change.
  await user.selectOptions(picker, "team");
  // => selectOptions takes the OPTION VALUE, not its visible text here.
  // => The browser fires change: React onChange commits team into state.
  expect(picker).toHaveDisplayValue("Team");
  // => Displayed text proves the full loop: option, event, state, render.
});
