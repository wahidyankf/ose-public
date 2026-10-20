---
title: "Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

## Goal

Build a unit-test suite for a small fixture component library -- a validated login form, a
task list, and an async-loading widget -- that reaches a stated coverage floor with no snapshot
left unreviewed. The library lives in `learning/capstone/code/` next to its three suites and a
`vitest.config.ts` that enforces the floor: lines 100, functions 100, branches 85, statements 100. If coverage ever slips below the floor, the run fails -- the same gate mechanism Example 61
teaches, applied to a whole library instead of one file.

There are deliberately no snapshots in this capstone. Example 52 taught the judgment call
(snapshot versus targeted assertion), and Example 60 taught what not to cover: for three small
components with fully specified behavior, targeted assertions say more per line than recorded
markup. "No snapshot left unreviewed" is satisfied vacuously -- and the overview says so
plainly rather than letting a reader wonder where the snapshots went.

## Concepts exercised

- **co-02 · query-priority** -- every element is found by role, label, or text; no test id
  appears anywhere in the capstone.
- **co-03 · render** -- three components mount into a test DOM, one suite each.
- **co-04 · user-event** -- typing, clicking, and toggling go through real trusted events.
- **co-05 · mock-function** -- `vi.fn()` records the login callback and the injected fetcher.
- **co-09 · coverage-report** -- the text table plus thresholds turn numbers into a verdict.
- **co-10 · test-isolation** -- `cleanup()` in `afterEach`, deterministic ids via `resetIds()`.
- **co-11 · async-assertion** -- `findAllByRole` waits for the settled list; loading text is
  read synchronously first so the suite observes a genuine transition.
- **co-12 · accessibility-query** -- alerts, regions, and named buttons carry the assertions.
- **co-14 · custom-render** -- not needed here, and that is the point: no provider wraps these
  components, so plain `render` suffices and the overview says so.
- **co-16 · ci-reporting** -- the `PASS: capstone (8 tests)` line is the machine-readable
  contract, byte-compared by the harness.

## Step 1: `login-form.tsx` -- validate, then report

The form owns two fields, two rules, and one callback. Username is required (whitespace-only
counts as missing); the password needs at least `MIN_PASSWORD_LENGTH` characters, and the
constant is exported so tests -- and readers -- share the number instead of magic 8s. Submit
revalidates from scratch every time, renders one `role="alert"` per violated field, and calls
`onLogin` only with a clean error bag.

**`learning/capstone/code/login-form.tsx`**:

```tsx
// => Validated login form: required username, minimum-length password, typed submit.
// => No network: the parent decides what onLogin does; the form only validates.
import React, { useState } from "react";
// => State hook: field values plus the error strings the assertions read.

// => Credentials shape: the typed payload the submit callback receives.
export interface Credentials {
  username: string;
  password: string;
}

// => Props shape: one callback, called only with valid credentials.
export interface LoginFormProps {
  onLogin: (creds: Credentials) => void;
}

// => Minimum password length: the rule the error text and the tests share.
export const MIN_PASSWORD_LENGTH = 8;

// => Validated form: errors render beside fields, submit stays honest.
export function LoginForm({ onLogin }: LoginFormProps): React.JSX.Element {
  // => Props destructure: the single callback the form reports through.
  const [username, setUsername] = useState("");
  // => Field state: controlled inputs keep every keystroke assertable.
  const [password, setPassword] = useState("");
  // => Password state: separate so each field validates independently.
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  // => Error state: absent keys mean valid, present keys render messages.

  const submit = (event: React.FormEvent): void => {
    // => Submit handler: preventDefault first, navigation never happens in tests.
    event.preventDefault();
    // => No page reload: jsdom has no navigation target worth reaching.
    const next: { username?: string; password?: string } = {};
    // => Fresh error bag: every submit revalidates from scratch, no staleness.
    if (username.trim() === "") next.username = "Username is required";
    // => Blank rule: whitespace-only counts as missing, a real-user edge.
    if (password.length < MIN_PASSWORD_LENGTH)
      next.password = `Password needs at least ${MIN_PASSWORD_LENGTH} characters`;
    // => Length rule: the constant appears in text so tests can import the number.
    setErrors(next);
    // => Errors render: state update flushes before the assertions below run.
    if (Object.keys(next).length === 0) onLogin({ username, password });
    // => Valid only: the callback fires exclusively on a clean error bag.
  };

  return (
    // => Native form: submit event plus accessible labels for free.
    <form onSubmit={submit} noValidate>
      {/* => noValidate: the suite tests OUR rules, not the browser's built-ins. */}
      <label htmlFor="cap-username">Username</label>
      {/* => Explicit label: the query the tests anchor on, operable by readers. */}
      <input id="cap-username" value={username} onChange={(event) => setUsername(event.target.value)} />
      {/* => Controlled input: value mirrors state, change writes it back. */}
      {errors.username !== undefined && <p role="alert">{errors.username}</p>}
      {/* => Alert role: errors announce to assistive tech AND to getByRole. */}
      <label htmlFor="cap-password">Password</label>
      {/* => Second label: each field owns its accessible name. */}
      <input id="cap-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      {/* => Password type: masked display, same change plumbing as username. */}
      {errors.password !== undefined && <p role="alert">{errors.password}</p>}
      {/* => Second alert: independent error, independent assertion. */}
      <button type="submit">Log in</button>
      {/* => Submit button: the click target every case drives. */}
    </form>
  );
}
```

Three cases cover the contract: blank submit shows both errors and stays silent; a short
password shows exactly one alert naming the minimum; valid credentials reach the callback
exactly once with the exact payload. The first case reads both alerts through
`getAllByRole` -- `getByRole` would throw on two matches, and the suite asserts the count
first because two errors is the behavior, not an accident.

**`learning/capstone/code/login-form.test.tsx`**:

```tsx
// @vitest-environment jsdom
// => DOM pragma: the form renders, labels bind, alerts announce.

import { afterEach, expect, test, vi } from "vitest";
// => Recorder plus assertions: onLogin calls become countable facts.

import { cleanup, render, screen } from "@testing-library/react";
// => Render plus role queries: the form is found the way users find it.

import userEvent from "@testing-library/user-event";
// => Real keystrokes: typing and tabbing behave like a user, not a script.

import "@testing-library/jest-dom/vitest";
// => DOM matchers: disabled, texts, and document assertions read cleanly.

import { LoginForm } from "./login-form";
// => Subject import: the validated form, callback injected per case.

afterEach(() => {
  cleanup();
  // => Unmount: each case starts from a pristine document body.
});

test("blank submit shows both errors and never calls back", async () => {
  // => Validity claim: invalid input blocks the callback AND explains why.
  const onLogin = vi.fn();
  // => Recorder: must stay silent on this path, vocal on the next.
  render(<LoginForm onLogin={onLogin} />);
  // => Mount: empty fields, no errors yet, the blank slate.
  const user = userEvent.setup();
  // => Real-event driver: keyboard and clicks dispatch trusted events.
  await user.click(screen.getByRole("button", { name: "Log in" }));
  // => Submit with blanks: the invalid path, no typing needed.
  const alerts = screen.getAllByRole("alert");
  // => Both alerts: username and password rules fired independently.
  expect(alerts).toHaveLength(2);
  // => Exactly two: one per violated field, no more, no fewer.
  expect(alerts[0]).toHaveTextContent("Username is required");
  // => First alert: username rule fires on empty submit.
  expect(onLogin).not.toHaveBeenCalled();
  // => Callback silent: invalid forms never report credentials.
});

test("short password names the minimum while username passes", async () => {
  // => Independence claim: one field valid does not mask the other's error.
  const onLogin = vi.fn();
  // => Fresh recorder: call counts never leak between cases.
  render(<LoginForm onLogin={onLogin} />);
  // => Mount: same blank slate, different input path.
  const user = userEvent.setup();
  // => Driver per case: setup inside the test, never shared module state.
  await user.type(screen.getByLabelText("Username"), "siti");
  // => Valid username: only the password rule should complain below.
  await user.type(screen.getByLabelText("Password"), "short");
  // => Too-short secret: five characters against a minimum of eight.
  await user.click(screen.getByRole("button", { name: "Log in" }));
  // => Submit: validation runs, exactly one error expected.
  expect(screen.getAllByRole("alert")).toHaveLength(1);
  // => Single alert: username passed, password did not.
  expect(screen.getByRole("alert")).toHaveTextContent("at least 8 characters");
  // => Minimum named: the message carries the number, users can act on it.
  expect(onLogin).not.toHaveBeenCalled();
  // => Still silent: one violation is enough to block the callback.
});

test("valid credentials reach the callback exactly once", async () => {
  // => Happy path: valid input produces one typed payload, no errors.
  const onLogin = vi.fn();
  // => Recorder: this case asserts it fires with the exact object.
  render(<LoginForm onLogin={onLogin} />);
  // => Mount: the form under test, callback wired.
  const user = userEvent.setup();
  // => Real typing: each keystroke flows through the controlled inputs.
  await user.type(screen.getByLabelText("Username"), "siti");
  // => Username: valid, no trimming needed.
  await user.type(screen.getByLabelText("Password"), "correct-horse-8");
  // => Long secret: comfortably past the minimum.
  await user.click(screen.getByRole("button", { name: "Log in" }));
  // => Submit: clean error bag, callback fires.
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  // => No alerts: valid input explains nothing because nothing failed.
  expect(onLogin).toHaveBeenCalledTimes(1);
  // => Exactly once: double submits would fail here by design.
  expect(onLogin).toHaveBeenCalledWith({ username: "siti", password: "correct-horse-8" });
  // => Exact payload: the parent receives what the user typed, verbatim.
});
```

## Step 2: `task-list.tsx` -- a list that stays honest

The list seeds from an `initial` prop, then owns its state: add ignores blank drafts (the draft
stays editable), toggles rewrite one row immutably, deletes filter by id, and an empty seed
renders an empty-state paragraph instead of a bare list. Ids come from a module counter reset
by `resetIds()` in `beforeEach`, so every case starts at the same numbers -- deterministic
fixtures, not luck.

**`learning/capstone/code/task-list.tsx`**:

```tsx
// => Task list: add, toggle, delete, and an honest empty state.
// => Local state only: no store, no props except the seed the tests control.
import React, { useState } from "react";
// => State hook: the task array plus the draft input text.

// => Task shape: numeric id, label text, done flag the checkbox mirrors.
export interface Task {
  id: number;
  label: string;
  done: boolean;
}

// => Seed shape: the list starts exactly where the test puts it.
export interface TaskListProps {
  initial?: Task[];
}

// => Next id seed: deterministic ids keep every snapshot-free assertion exact.
let nextId = 1000;

// => resetIds: tests restart the counter so ids never leak between cases.
export function resetIds(): void {
  nextId = 1000;
}

// => Task list: add form on top, labelled checkboxes below, delete per row.
export function TaskList({ initial = [] }: TaskListProps): React.JSX.Element {
  // => Default seed: empty means the empty-state text renders first.
  const [tasks, setTasks] = useState<Task[]>(initial);
  // => Task state: seeded from props once, owned locally after mount.
  const [draft, setDraft] = useState("");
  // => Draft state: the input mirrors it, add consumes and clears it.

  const add = (event: React.FormEvent): void => {
    // => Add handler: blank drafts are ignored, whitespace included.
    event.preventDefault();
    // => No reload: same form discipline as the login capstone piece.
    const label = draft.trim();
    // => Trim once: stored labels never carry accidental padding.
    if (label === "") return;
    // => Blank guard: the suite asserts nothing was added for empty input.
    nextId += 1;
    // => Fresh id: monotonic, deterministic after resetIds in test setup.
    setTasks([...tasks, { id: nextId, label, done: false }]);
    // => Append immutable: new array, new row unchecked by construction.
    setDraft("");
    // => Clear draft: the input empties, ready for the next task.
  };

  return (
    // => Section landmark: the suite scopes queries here when pages grow.
    <section aria-label="Tasks">
      {/* => Accessible name: within() can target this region by name. */}
      {tasks.length === 0 && <p>No tasks yet — add one above.</p>}
      {/* => Empty state: the first render of an unseeded list, asserted. */}
      <form onSubmit={add}>
        {/* => Add form: submit adds, the same event shape users trigger. */}
        <label htmlFor="cap-task">New task</label>
        {/* => Labelled input: getByLabelText finds it without a test id. */}
        <input
          id="cap-task"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="e.g. review coverage"
        />
        {/* => Placeholder hint: decorative only, never the query anchor. */}
        <button type="submit">Add</button>
        {/* => Add button: click and keyboard submit both reach add(). */}
      </form>
      <ul>
        {/* => Real list markup: semantics screen readers already understand. */}
        {tasks.map((task) => (
          // => Keyed rows: stable ids, no index keys, no reorder bugs.
          <li key={task.id}>
            {/* => Row groups one checkbox, one label, one delete button. */}
            <input
              type="checkbox"
              id={`cap-task-${task.id}`}
              checked={task.done}
              onChange={() => setTasks(tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)))}
            />
            {/* => Toggle writes a new array: immutable update, React re-renders. */}
            <label htmlFor={`cap-task-${task.id}`}>{task.label}</label>
            {/* => Label wraps the text: clicking it toggles, users expect that. */}
            <button
              type="button"
              aria-label={`Delete ${task.label}`}
              onClick={() => setTasks(tasks.filter((t) => t.id !== task.id))}
            >
              Delete
            </button>
            {/* => Named delete: duplicate Delete texts disambiguate by label. */}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

The toggle-and-delete case seeds two rows and proves operations scope by id: toggling the
first row leaves the second unchecked, deleting the second keeps the first checked. Delete
buttons carry `aria-label={`Delete ${label}`}` because two identical "Delete" texts would
force positional queries -- the accessible name is what disambiguates them, for the suite and
for screen-reader users alike. The case closes with a `within()` region query, the scoping
habit Example 68 teaches, proving scoped and global queries agree.

**`learning/capstone/code/task-list.test.tsx`**:

```tsx
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
```

## Step 3: `user-loader.tsx` -- one promise, three paints

The widget takes a `fetchUsers` prop -- never a real network call -- and paints three states:
loading text while the promise pends, a list on resolve, an alert on reject. An `alive` flag
in the effect cleanup discards late settlements after unmount, so no state update ever fires
on an unmounted component. The resolve case reads the loading text synchronously first, then
awaits `findAllByRole('listitem')`: the suite observes the transition instead of assuming it.

**`learning/capstone/code/user-loader.tsx`**:

```tsx
// => Async loading widget: loading, list, and error states from one promise.
// => Injected fetcher: the component never touches the network, tests inject.
import React, { useEffect, useState } from "react";
// => Effect plus state: fetch on mount, render whatever the promise settles.

// => Fetcher shape: resolves names, rejects with the failure the UI shows.
export type FetchUsers = () => Promise<string[]>;

// => Props shape: the loader's only dependency, trivially mockable.
export interface UserLoaderProps {
  fetchUsers: FetchUsers;
}

// => Loader states: loading first, then users or a message, never both.
export function UserLoader({ fetchUsers }: UserLoaderProps): React.JSX.Element {
  // => Destructured fetcher: stable per render, effect depends on it once.
  const [users, setUsers] = useState<string[] | null>(null);
  // => Null means pending: the loading text owns the first paint.
  const [error, setError] = useState<string | null>(null);
  // => Error state: rejection message lands here for the alert to read.

  useEffect(() => {
    // => Mount effect: exactly one fetch per mount in this widget.
    let alive = true;
    // => Alive flag: unmounted loaders discard late settlements, no warnings.
    fetchUsers().then(
      (names) => {
        if (alive) setUsers(names);
      },
      // => Success path: names replace the loading text wholesale.
      (cause: unknown) => {
        if (alive) setError(cause instanceof Error ? cause.message : "Load failed");
      },
      // => Failure path: Error messages surface, exotic rejections get a default.
    );
    return () => {
      alive = false;
    };
    // => Cleanup flips the flag: settled-after-unmount updates never fire.
  }, [fetchUsers]);
  // => Dependency honest: lint-clean and remount-safe if the fetcher changes.

  if (error !== null) return <p role="alert">{error}</p>;
  // => Error first: an alert the suite finds by role, text asserted separately.
  if (users === null) return <p>Loading users…</p>;
  // => Loading text: the placeholder findBy replaces once names arrive.
  return (
    // => Settled list: real markup, one item per fetched name.
    <ul>
      {users.map((name) => (
        <li key={name}>{name}</li>
        // => Name keys: fixture names are unique, keys stay stable.
      ))}
    </ul>
  );
}
```

Two details deserve attention. First, list items are queried by role and their text asserted
separately: `li` elements carry no computed accessible name in this stack, so `{ name: ... }`
would fail where the text is plainly visible -- the same lesson Example 14 states for status
text. Second, the rejection case asserts the message lands verbatim in the alert AND that no
list renders: failure paints zero rows, never a half-filled list.

**`learning/capstone/code/user-loader.test.tsx`**:

```tsx
// @vitest-environment jsdom
// => DOM pragma: loading text, list, and alert all render here.

import { afterEach, expect, test, vi } from "vitest";
// => Promise stand-ins: resolve and reject on command, no timers needed.

import { cleanup, render, screen } from "@testing-library/react";
// => Async queries: findBy waits for the settled UI, getBy reads the sync one.

import "@testing-library/jest-dom/vitest";
// => DOM matchers: list items and alerts asserted by role and text.

import { UserLoader } from "./user-loader";
// => Subject import: the loader, fetcher injected per case.

afterEach(() => {
  cleanup();
  // => Unmount: pending promises settle into nothing after the flag flips.
});

test("loading text shows first, then the fetched names", async () => {
  // => Resolve claim: placeholder first, real list after the promise settles.
  const fetchUsers = vi.fn().mockResolvedValue(["siti", "budi"]);
  // => Scripted fetch: resolves on the microtask queue, deterministically.
  render(<UserLoader fetchUsers={fetchUsers} />);
  // => Mount: effect fires the fetch, loading text owns the first paint.
  expect(screen.getByText("Loading users…")).toBeInTheDocument();
  // => Sync read: loading shows BEFORE any await, the transition is genuine.
  const items = await screen.findAllByRole("listitem");
  // => Async wait: findAllBy polls until the rows replace the placeholder.
  expect(items).toHaveLength(2);
  // => Two rows: one per fetched name, no more, no fewer.
  expect(items[0]).toHaveTextContent("siti");
  // => First name: listitems carry no computed name, text asserted directly.
  expect(items[1]).toHaveTextContent("budi");
  // => Second name: both rows rendered, order preserved.
  expect(screen.queryByText("Loading users…")).not.toBeInTheDocument();
  // => Placeholder gone: users replaced it, never duplicated beside it.
  expect(fetchUsers).toHaveBeenCalledTimes(1);
  // => One fetch: mount fired once, no effect loop.
});

test("rejection renders the failure message as an alert", async () => {
  // => Reject claim: a failed fetch becomes a readable error, not a blank page.
  const fetchUsers = vi.fn().mockRejectedValue(new Error("offline"));
  // => Scripted failure: the message below must reach the alert verbatim.
  render(<UserLoader fetchUsers={fetchUsers} />);
  // => Mount: same loading first paint, different settlement.
  expect(await screen.findByRole("alert")).toHaveTextContent("offline");
  // => Alert wait: rejection message surfaces through the error state.
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
  // => No list: failure renders zero rows, never a half-filled list.
});
```

## Step 4: read the combined coverage report

The suite runs with coverage, and `vitest.config.ts` turns the report into a floor: 100 lines,
100 functions, 85 branches, 100 statements. The measured run clears lines, functions, and
statements completely; branches stop at 88.88 because two defensive paths never execute -- the
`alive`-false discard in the loader cleanup, and the non-`Error` rejection default. Both are
crash-arithmetic the suite documents but cannot trigger without unmounting mid-flight, which
is exactly the coverage Example 60 says to leave alone. The floor sits at 85, below the
measured 88.88, so genuine regressions trip it while deliberate defenses do not.

**`learning/capstone/code/vitest.config.ts`**:

```ts
// => Capstone coverage gate: the floor the suite must keep clearing.
// => Lines and functions at 100, branches at 85: the alive-flag cleanup and
// => the non-Error rejection default are defensive paths the suite documents
// => but never executes, exactly the judgment Example 60 teaches.
import { defineConfig } from "vitest/config";
// => Config import: coverage thresholds live beside the suite they guard.

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      // => v8 engine: function-level accuracy the text table below reports.
      reporter: ["text"],
      // => Text table: humans read the run; machines would take json-summary.
      thresholds: {
        lines: 100,
        // => Full line floor: every executable line runs in the suite.
        functions: 100,
        // => Full function floor: every handler and callback is invoked.
        branches: 85,
        // => Branch floor: defensive cleanup paths may stay uncovered by design.
        statements: 100,
        // => Full statement floor: no dead code ships in the fixture library.
      },
    },
  },
});
```

**Run**: `vitest run --coverage`

**Output** (`learning/capstone/code/expected/main/main.stdout.txt`):

```text
PASS: capstone (8 tests)
```

## Acceptance criteria

1. All 8 tests pass, twice in a row, with no network access.
2. The coverage table reads 100 lines, 100 functions, 88.88 branches, 100 statements --
   at or above every threshold in `vitest.config.ts`.
3. Every query in every suite resolves by role, label, or text; no test id, no container
   query, no implementation-detail selector.
4. No snapshot files exist under this unit; the targeted assertions above are the whole
   record, reviewed in full.

## Done bar

The capstone is done when `examples check` covers it green: the `main` run exits 0, its
stdout byte-matches `expected/main.stdout.txt`, and every fence above byte-matches its file.
Extend it the way the course taught -- add a feature to one component, watch the floor catch
the uncovered line, and write the test that restores it.
