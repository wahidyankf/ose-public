// @vitest-environment jsdom
// => DOM pragma: clicks dispatch into a document, so one must exist.

import { afterEach, expect, test } from "vitest";
// => Runner trio unchanged: interaction adds no new runner API.

import { cleanup, render, screen } from "@testing-library/react";
// => render mounts the counter; screen finds its button and its text.

import "@testing-library/jest-dom/vitest";
// => toHaveTextContent reads the counter paragraph after each click.

import React from "react";
// => JSX renders the stateful counter: interaction needs something to change.

import userEvent from "@testing-library/user-event";
// => user-event simulates full interaction sequences, not single raw events.
// => One import covers clicks, typing, selection, hover, upload, and more.

import { Counter } from "./counter";
// => Subject by relative import: the unit stays self-contained.

afterEach(() => {
  cleanup();
  // => Unmount the counter: state must never survive into the next case.
});

test("two clicks raise the count to two", async () => {
  // => The case name counts clicks out loud: arrange, act, assert below.
  const user = userEvent.setup({ delay: null });
  // => setup() builds an isolated session: no state leaks between tests.
  // => delay null removes inter-keystroke pauses: fast and deterministic.
  // => Real timers stay on here: no waiting happens, only event dispatch.
  render(<Counter />);
  // => Mount once: every later line acts on this rendered instance.
  expect(screen.getByText("Total clicks: 0")).toBeInTheDocument();
  // => Assert the starting state first: a test that cannot see zero is blind.
  const button = screen.getByRole("button", { name: "Add one" });
  // => Role query, as always: interaction never excuses weak queries.
  await user.click(button);
  // => AWAIT the click: user-event is async because real browsers are async.
  // => click fires pointer, mouse, focus, and click events in true order.
  await user.click(button);
  // => Second awaited click: sequential awaits mirror sequential user acts.
  expect(screen.getByText("Total clicks: 2")).toBeInTheDocument();
  // => Final text proves both clicks dispatched, focused, and updated state.
  // => Forgetting await would assert before React re-renders: always await.
});
