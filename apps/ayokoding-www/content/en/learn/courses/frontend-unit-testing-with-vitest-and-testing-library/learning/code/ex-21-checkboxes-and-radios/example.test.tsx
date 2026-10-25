// @vitest-environment jsdom
// => DOM pragma: checked states live on document elements.

import { afterEach, expect, test } from "vitest"; // => Runner surface: hooks, assertions, and cases.
// => Runner trio steady: grouping semantics are markup plus interaction.

import { cleanup, render, screen } from "@testing-library/react"; // => Render plus queries: mount the form, read it by role.
// => checkbox and radio roles distinguish the two control families.

import "@testing-library/jest-dom/vitest"; // => DOM matchers: checked-state assertions.
// => toBeChecked reads the live checked property, not the HTML attribute.

import React, { useState } from "react"; // => State hook: extras and size live here.
// => useState tracks toppings and size: two grouping rules, one component.

import userEvent from "@testing-library/user-event"; // => Real-event driver: clicks behave like a user, without delay.
// => user-event simulates full interaction sequences, not single raw events.
// => Clicks on checks and radios travel the browser's grouping logic.

// => Isolation hook: each case gets pristine checkboxes.
afterEach(() => {
  cleanup(); // => Unmount: checkbox states never leak between cases.
  // => Isolation hook: checked states are state and must reset too.
});

function OrderForm(): React.JSX.Element {
  // => Local subject: independent checkboxes plus an exclusive radio group.
  const [extras, setExtras] = useState<string[]>([]);
  // => Array state: each checkbox toggles membership independently.
  const [size, setSize] = useState("small");
  // => Single string state: radios share one value by design.
  const toggle = (item: string): void => {
    // => Toggle adds or removes: the checkbox independence rule in code.
    setExtras((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  };
  return (
    // => One form, two grouping rules: independence versus exclusivity.
    <form>
      {/* => One form holds both groups: queries below tell them apart. */}
      {/* => Shared form is realistic: checkout pages mix both control kinds. */}
      <label>
        {/* => Wrapping label: text plus control associated without ids. */}
        <input type="checkbox" checked={extras.includes("cheese")} onChange={() => toggle("cheese")} />
        {/* => Checked derives from membership: the browser holds no separate truth. */}
        {/* => onChange toggles membership: state is the single source of truth. */}
        {/* => No value attribute needed: membership IS the value here. */}
        Cheese
        {/* => Label text names the checkbox: query hook and user reading. */}
      </label>
      {/* => First checkbox complete: independent toggle, membership-derived. */}
      <label>
        {/* => Second label, same pattern: independence means no shared name. */}
        <input type="checkbox" checked={extras.includes("spicy")} onChange={() => toggle("spicy")} />
        {/* => Second checkbox shares the toggle helper but independent state. */}
        {/* => Shared helper, separate membership: reuse without coupling. */}
        Spicy
        {/* => Second label text: distinct name, distinct query, distinct state. */}
      </label>
      {/* => Checkbox group complete: two independents, both on at once allowed. */}
      <label>
        {/* => Radio label: same wrapping pattern, different grouping rule. */}
        <input type="radio" name="size" checked={size === "small"} onChange={() => setSize("small")} />
        {/* => Shared name groups radios: the browser enforces exclusivity. */}
        {/* => name="size" is THE grouping mechanism: remove it, exclusivity dies. */}
        {/* => Checked derives from single state: one value, one selection. */}
        Small
        {/* => Label names the option: small is the default selected value. */}
      </label>
      <label>
        {/* => Fourth label: the alternative the exclusivity test will click. */}
        <input type="radio" name="size" checked={size === "large"} onChange={() => setSize("large")} />
        {/* => Same name, different value: clicking moves the single selection. */}
        {/* => Same handler shape, different payload: setSize('large') on change. */}
        Large
        {/* => Large label: clicking it must uncheck Small, by browser rule. */}
      </label>
      {/* => Radio group complete: one name, two options, exactly one checked. */}
    </form>
    // => Form closes: two families, two rules, one submit someday.
  );
  // => Component ends: toggle helper plus two state variables drive four controls.
}

test("checkboxes toggle independently, radios exclusively", async () => {
  // => One case, two rules: the component exists to contrast the families.
  const user = userEvent.setup({ delay: null });
  // => setup() builds an isolated session: no state leaks between tests.
  // => delay null removes inter-keystroke pauses: fast and deterministic.
  // => Real timers stay on here: no waiting happens, only event dispatch.
  render(<OrderForm />);
  // => Mount the form: four controls, two grouping rules to verify.
  // => Initial state: both boxes off, Small selected, assertions start here.
  await user.click(screen.getByRole("checkbox", { name: "Cheese" }));
  // => Click checks the first box: independence means the second stays off.
  // => Awaited click settles state before the next interaction begins.
  expect(screen.getByRole("checkbox", { name: "Spicy" })).not.toBeChecked();
  // => Second box untouched: independence proved mid-sequence, not just at end.
  await user.click(screen.getByRole("checkbox", { name: "Spicy" }));
  // => Click checks the second box: both on at once proves independence.
  // => Sequential awaits keep each assertion behind the render it checks.
  expect(screen.getByRole("checkbox", { name: "Cheese" })).toBeChecked();
  // => toBeChecked reads the property: attributes would lie after toggling.
  // => Property over attribute: checked state lives in the DOM property.
  expect(screen.getByRole("checkbox", { name: "Spicy" })).toBeChecked();
  // => Both checked simultaneously: the checkbox contract, pinned.
  // => Independence complete: two on at once, no interference, contract held.
  await user.click(screen.getByRole("radio", { name: "Large" }));
  // => Radio click moves the single selection: exclusivity in one action.
  // => One click, two state changes expected: Large on AND Small off.
  expect(screen.getByRole("radio", { name: "Large" })).toBeChecked();
  // => Large on: the assertion that matters for the radio family.
  // => Direct effect of the click: the newly selected option.
  expect(screen.getByRole("radio", { name: "Small" })).not.toBeChecked();
  // => Small off without being clicked: the browser moved it, state followed.
  // => The negative assertion is the exclusivity proof: never skip it.
});
