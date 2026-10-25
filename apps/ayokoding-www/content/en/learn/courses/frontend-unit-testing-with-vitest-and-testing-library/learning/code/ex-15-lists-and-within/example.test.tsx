// @vitest-environment jsdom
// => DOM pragma: list queries scan listitem roles in the document.

import { afterEach, expect, test } from "vitest";
// => Runner imports steady: list testing adds no new runner API.

import { cleanup, render, screen, within } from "@testing-library/react";
// => within joins the imports: scoped queries are a first-class operation.
// => within(element) returns a screen-like object bound to that subtree.

import "@testing-library/jest-dom/vitest";
// => toHaveLength and text matchers assert on the returned collections.

import React from "react";
// => JSX renders two lists: the scoping test needs a distractor list.

afterEach(() => {
  cleanup();
  // => Isolation hook: leaked lists would poison later getAllBy counts.
});

const groceries = ["Rice", "Oil", "Sugar"];
// => Module-level fixture data: the same array feeds both rendered lists.
// => Shared data keeps the example small; beforeEach is unnecessary here.

test("finds every item without depending on order", async () => {
  // => getAllBy returns an array: length plus membership beats index access.
  render(
    <ul aria-label="Groceries">
      {/* => aria-label names the list so within() can scope to it precisely. */}
      {groceries.map((item) => (
        <li key={item}>{item}</li>
        // => key uses the item text: stable and unique for this fixture.
        // => Real code keys by id; text keys are fine for literal fixtures.
      ))}
    </ul>,
  );
  // => Render maps data to listitems: the standard dynamic-list shape.
  const list = screen.getByRole("list", { name: "Groceries" });
  // => Scope first: within() binds every later query to this subtree alone.
  const items = within(list).getAllByRole("listitem");
  // => getAllByRole throws when empty, returns all matches otherwise.
  // => Scoped queries ignore identical items rendered elsewhere on the page.
  expect(items).toHaveLength(3);
  // => Length pins the count; content assertions below pin the members.
  // => Count first, members second: two independent facts, two assertions.
  const names = items.map((item) => item.textContent);
  // => textContent reads each item: mapping keeps assertions order-free.
  // => Mapping over Elements keeps the test in the DOM world, not strings.
  expect(names).toEqual(expect.arrayContaining(["Rice", "Sugar"]));
  // => arrayContaining asserts membership without pinning render order.
  // => Sorting is a presentation choice: tests should not lock it in.
  // => Membership plus count equals the whole list contract, order aside.
});
