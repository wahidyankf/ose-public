// @vitest-environment jsdom
// => DOM pragma: keystrokes target elements in a document.

import { afterEach, expect, test } from "vitest";
// => Runner trio steady: typing is library behavior, not runner behavior.

import { cleanup, render, screen } from "@testing-library/react";
// => render mounts the controlled input; screen tracks its live value.

import "@testing-library/jest-dom/vitest";
// => toHaveValue asserts the input's current value after typing finishes.

import React, { useState } from "react";
// => useState makes the input controlled: every keystroke flows through state.

import userEvent from "@testing-library/user-event";
// => user-event simulates full interaction sequences, not single raw events.
// => type() sends keyDown, keyPress, input, and keyUp per character typed.

afterEach(() => {
  cleanup();
  // => Unmount: controlled state must reset between cases like all state.
});

function NicknameField(): React.JSX.Element {
  // => Local component: small subjects can live in the test file itself.
  // => Colocation is fine when no other test reuses the component.
  // => Local keeps the lesson on one screen: subject above, spec below.
  const [name, setName] = useState("");
  // => Empty start: the test types every character and watches state follow.
  // => Empty is the baseline assertion: type() must change SOMETHING.
  return (
    // => Single label root: association and control in one element.
    <label>
      {/* => Wrapping label associates implicitly: no htmlFor/id needed. */}
      {/* => Implicit association survives markup moves: ids do not. */}
      Nickname
      {/* => Label text is the accessible name: the query hook, stated once. */}
      <input value={name} onChange={(e) => setName(e.target.value)} />
      {/* => Controlled pattern: value from state, state from onChange. */}
      {/* => A missing onChange would make this input read-only: type proves it. */}
      {/* => e.target.value carries the keystroke: the state update input. */}
    </label>
    // => Label closes: text plus control, associated by nesting.
  );
  // => Component ends: state, binding, and association in one return.
}

test("typing fills the controlled input", async () => {
  // => Case name states the contract: keystrokes become state becomes value.
  const user = userEvent.setup({ delay: null });
  // => setup() builds an isolated session: no state leaks between tests.
  // => delay null removes inter-keystroke pauses: fast and deterministic.
  // => Real timers stay on here: no waiting happens, only event dispatch.
  render(<NicknameField />);
  // => Mount the controlled field: empty value is the starting assertion.
  const field = screen.getByRole("textbox", { name: "Nickname" });
  // => Role textbox plus wrapping-label name: no ids, no test ids needed.
  await user.click(field);
  // => Click focuses first: typing into an unfocused field tests nothing.
  // => Focus-then-type mirrors the user: click the field, then type.
  await user.keyboard("sari");
  // => keyboard() sends four real chars: s, a, r, i through four onChanges.
  // => Each char commits through React state before the next arrives.
  expect(field).toHaveValue("sari");
  // => Final value proves all four keystrokes dispatched and state kept up.
  // => Setting .value directly would skip onChange: type() cannot skip it.
});
