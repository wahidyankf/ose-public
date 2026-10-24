// @vitest-environment jsdom
// => DOM pragma: dispatched actions re-render the count paragraph.

import { afterEach, expect, test } from "vitest";
// => Runner pair unchanged: dispatch is interaction, already learned.

import { cleanup, render, screen } from "@testing-library/react";
// => Text plus two buttons: the store view's full interactive surface.

import "@testing-library/jest-dom/vitest";
// => toHaveTextContent reads the count after each dispatched action.

import React from "react";
// => JSX composes the store provider around the view under test.

import userEvent from "@testing-library/user-event";
// => user-event simulates full interaction sequences, not single raw events.
// => Clicks dispatch store actions through the real provider machinery.

import { CounterView, StoreProvider } from "./store";
// => Provider plus view: the custom render wraps one around the other.

afterEach(() => {
  cleanup();
  // => Isolation hook: store state dies with the unmounted provider.
});

function renderWithStore(ui: React.ReactElement): void {
  // => Custom render for stores: provider mounted, actions dispatchable.
  // => No initial-state argument needed here: the store starts at zero by design.
  render(<StoreProvider>{ui}</StoreProvider>);
}

test("increment then reset flows through the store", async () => {
  // => Two actions, three assertions: the store loop proved end to end.
  const user = userEvent.setup({ delay: null });
  // => setup() builds an isolated session: no state leaks between tests.
  // => delay null removes inter-keystroke pauses: fast and deterministic.
  renderWithStore(<CounterView />);
  // => Mount inside the provider: useStore finds its context, no error.
  expect(screen.getByText("Count: 0")).toBeInTheDocument();
  // => Initial zero: the store's starting state, asserted before acting.
  await user.click(screen.getByRole("button", { name: "Add" }));
  // => Dispatch inc through a real click: action travels provider to state.
  await user.click(screen.getByRole("button", { name: "Add" }));
  // => Second dispatch: updater form keeps both increments, no staleness.
  expect(screen.getByText("Count: 2")).toBeInTheDocument();
  // => Count two proves both actions committed through the shared store.
  await user.click(screen.getByRole("button", { name: "Reset" }));
  // => Reset dispatch: the second action type, same provider machinery.
  expect(screen.getByText("Count: 0")).toBeInTheDocument();
  // => Back to zero: reset honored, store loop closed, no leakage possible.
});
