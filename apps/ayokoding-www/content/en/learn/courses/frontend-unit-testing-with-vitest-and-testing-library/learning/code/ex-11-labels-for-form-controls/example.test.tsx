// @vitest-environment jsdom
// => DOM pragma: labels live in the document the queries scan.

import { afterEach, expect, test } from "vitest";
// => Unchanged runner imports: the query does the teaching again.

import { cleanup, render, screen } from "@testing-library/react";
// => getByLabelText arrives with the same three RTL imports as before.

import "@testing-library/jest-dom/vitest";
// => jest-dom matchers for the value and disabled-state assertions below.

import React from "react";
// => JSX renders a labelled email field plus one deliberately bare field.

afterEach(() => {
  cleanup();
  // => Same isolation hook: the course repeats it until it is muscle memory.
});

test("a labelled input is found by its label text", async () => {
  // => The query IS the accessibility test: no label, no element found.
  render(
    <form>
      {/* => A form groups controls so submit semantics apply later. */}
      <label htmlFor="email">Email address</label>
      {/* => htmlFor must equal the input id: that pairing is the contract. */}
      {/* => Visible label text doubles as the query hook: no ids in tests. */}
      <input id="email" type="email" defaultValue="sari@example.com" />
      {/* => defaultValue sets an uncontrolled initial value for the test. */}
      {/* => Uncontrolled input: the DOM holds the value, React does not track it. */}
    </form>,
    // => Form closes: label and input associated, ready for the query below.
  );
  // => Label plus input: the smallest testable unit of form accessibility.
  // => Association proved by the query itself: no association, no element found.
  const field = screen.getByLabelText("Email address");
  // => getByLabelText follows htmlFor, aria-labelledby, and wrapping labels.
  // => It fails on placeholder-only inputs: placeholders are not labels.
  expect(field).toHaveValue("sari@example.com");
  // => toHaveValue reads the live control value, not the HTML attribute.
  // => Asserting the value proves the query returned the real control.
});

test("an unlabelled input stays invisible to the query", async () => {
  // => The negative twin proves the query checks association, not presence.
  render(<input type="text" defaultValue="orphan" />);
  // => Deliberately bare: no label, no aria, no name anywhere nearby.
  expect(screen.queryByLabelText("orphan")).not.toBeInTheDocument();
  // => queryBy* returns null instead of throwing: absence needs this variant.
  // => Combined with Example 10, the rule is total: label everything.
});
