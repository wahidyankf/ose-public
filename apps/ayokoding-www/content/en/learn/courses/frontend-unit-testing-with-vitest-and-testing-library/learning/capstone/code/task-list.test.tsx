// @vitest-environment jsdom
// => DOM pragma: the list, its checkboxes, and its buttons render here.

import { afterEach, beforeEach, expect, test } from "vitest";
// => Hook plus assertions: id resets and list facts, no mocks needed.

import { cleanup, render, screen, within } from "@testing-library/react";
// => Scoped queries: the section landmark narrows every lookup.

import userEvent from "@testing-library/user-event";
// => Real typing and clicking: add, toggle, delete via trusted events.

import "@testing-library/jest-dom/vitest";
// => DOM matchers: checked states and text assertions read cleanly.

import { resetIds, TaskList } from "./task-list";
// => Subject plus id reset: deterministic ids across every case.

beforeEach(() => {
  resetIds();
  // => Counter restart: ids start at 1001 in every case, no leakage.
});

afterEach(() => {
  cleanup();
  // => Unmount: the list and its inputs leave with the case.
});

test("empty seed renders the empty state, blank adds are ignored", async () => {
  // => Boundary claim: nothing in, nothing out, empty input adds nothing.
  render(<TaskList />);
  // => Default seed: empty array, the empty-state text must show.
  expect(screen.getByText("No tasks yet — add one above.")).toBeInTheDocument();
  // => Empty text: the honest first paint for a fresh list.
  const user = userEvent.setup();
  // => Driver: types spaces, clicks Add, asserts the ignore.
  await user.type(screen.getByLabelText("New task"), "   ");
  // => Whitespace draft: trims to empty, the guard must catch it.
  await user.click(screen.getByRole("button", { name: "Add" }));
  // => Submit the blank: add() returns early, no row appears.
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  // => Still empty: the guard held, the list stayed honest.
  expect(screen.getByLabelText("New task")).toHaveValue("   ");
  // => Draft kept: rejected input stays editable, nothing was consumed.
});

test("adding a task clears the input and appends an unchecked row", async () => {
  // => Add claim: input clears, row appears unchecked, label queryable.
  render(<TaskList />);
  // => Fresh list: add is the only operation this case exercises.
  const user = userEvent.setup();
  // => Real keystrokes: the draft flows through the controlled input.
  await user.type(screen.getByLabelText("New task"), "review coverage");
  // => Draft text: stored trimmed, rendered as the row label.
  await user.click(screen.getByRole("button", { name: "Add" }));
  // => Submit: the row appends, the input clears.
  expect(screen.getByLabelText("New task")).toHaveValue("");
  // => Cleared input: ready for the next task, a user-visible affordance.
  const box = screen.getByRole("checkbox", { name: "review coverage" });
  // => Row query: label text is the accessible name, no test id needed.
  expect(box).not.toBeChecked();
  // => Unchecked by construction: new tasks start open.
});

test("toggling and deleting rewrite the list without touching siblings", async () => {
  // => Isolation claim: one row's toggle and delete leave other rows intact.
  render(
    <TaskList
      initial={[
        { id: 1, label: "write tests", done: false },
        { id: 2, label: "run suite", done: false },
      ]}
    />,
  );
  // => Seeded list: two rows, ids fixed, toggles start unchecked.
  const user = userEvent.setup();
  // => Clicks drive state: toggle one, delete the other, assert the rest.
  await user.click(screen.getByRole("checkbox", { name: "write tests" }));
  // => Toggle first: clicking the checkbox flips only its row.
  expect(screen.getByRole("checkbox", { name: "write tests" })).toBeChecked();
  // => Checked now: the immutable update landed on the right row.
  expect(screen.getByRole("checkbox", { name: "run suite" })).not.toBeChecked();
  // => Sibling untouched: the toggle scoped itself by id.
  await user.click(screen.getByRole("button", { name: "Delete run suite" }));
  // => Named delete: accessible name disambiguates the two Delete buttons.
  expect(screen.queryByRole("checkbox", { name: "run suite" })).not.toBeInTheDocument();
  // => Row gone: filter removed exactly the named row.
  expect(screen.getByRole("checkbox", { name: "write tests" })).toBeChecked();
  // => Survivor intact: delete preserved the toggled state beside it.
  const region = within(screen.getByRole("region", { name: "Tasks" }));
  // => Scoped query: the landmark narrows lookups when pages grow.
  expect(region.getByText("write tests")).toBeInTheDocument();
  // => Region read: scoping and global queries agree on the survivor.
});
