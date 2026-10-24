---
title: "Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

Twenty-four recall questions, eight applied problems, eight hands-on katas, a self-check
checklist, and six interrogation prompts. The katas live under `drilling/code/kata-NN-*/`
with `before/`, `after/`, and a `run.yaml` each: the `before/` side is the starting point you
improve, the `after/` side is the reviewed target the harness runs. Read a kata's `before/`,
predict what is wrong, then diff against `after/` before reading the lesson text.

## Recall Q&A

Twenty-four short-answer questions, at least one per concept (`co-01` through `co-16`). Answer
from memory, then check.

**Q1 (co-01 -- test-runner).** Your test file imports `test` and `expect` but plain `node` refuses
to run it. What discovers and executes it instead, and what two things does a passing run prove
about your toolchain?

<details>
<summary>Answer</summary>

Vitest discovers files matching its include patterns, transforms the TypeScript, runs each
`test` block, and reports pass or fail. A passing run proves the runner found the file AND the
TypeScript transform plus the assertion library both work (Example 1).

</details>

**Q2 (co-01 -- test-runner).** Two test files each take 2 seconds. The suite still finishes in
about 2 seconds. What did the runner do, and why does that matter for the 78-example course
suite?

<details>
<summary>Answer</summary>

It ran the files in parallel workers. File-level parallelism is why a large suite stays fast
enough to run on every change -- and why shared module state between files is a defect (co-10,
Example 74).

</details>

**Q3 (co-02 -- query-priority).** A button shows the text "Save". List Testing Library's query
ladder top to bottom, and say which rung the button's test should use.

<details>
<summary>Answer</summary>

Role, label text, placeholder text, visible text, test id -- test id only as a last resort.
The button test uses `getByRole('button', { name: 'Save' })`: the role plus the accessible name
a user (and a screen reader) relies on (Examples 9, 10).

</details>

**Q4 (co-02 -- query-priority).** A test uses `getByTestId('submit-btn')` and passes. The
designer renames the CSS class and the test still passes; then the label text breaks and the
test still passes. What exactly is wrong with this test?

<details>
<summary>Answer</summary>

It is coupled to a testing-only attribute and blind to the user-visible contract: it cannot
see the broken label because it never queries anything a user perceives. Rewrite it against
the role and accessible name (Examples 13, 25, Kata 1).

</details>

**Q5 (co-03 -- render).** What does `render(<Button />)` give you back that lets a query find
the button, and what must you call after the test so the next test starts clean?

<details>
<summary>Answer</summary>

It mounts the component into a test DOM (`document.body` under jsdom) and returns query
helpers bound to that mount. Call `cleanup()` (usually in `afterEach`) to unmount, so DOM
state never leaks between tests (Examples 9, 69).

</details>

**Q6 (co-04 -- user-event).** `fireEvent.click(button)` passes but the real feature is broken
for keyboard users. Name one thing `userEvent` does that `fireEvent` skips, and when
`fireEvent` is still the right tool.

<details>
<summary>Answer</summary>

`userEvent` dispatches the full trusted event sequence (pointerdown, focus, keydown, and so
on) per keystroke or click, exercising handlers that only fire mid-interaction; `fireEvent`
dispatches one synthetic event. `fireEvent` stays right on frozen fake clocks, where
`userEvent`'s real-timer waits hang (Examples 25, 37, 44, Kata 8).

</details>

**Q7 (co-05 -- mock-function).** `vi.fn()` records a call with arguments `(200, 'ok')`. Write
the two assertions that pin the count and the exact arguments.

<details>
<summary>Answer</summary>

`expect(fn).toHaveBeenCalledTimes(1)` pins the count -- duplicate charges pass argument
checks and fail only here. `expect(fn).toHaveBeenCalledWith(200, 'ok')` pins the exact
arguments (Example 26).

</details>

**Q8 (co-06 -- module-mock).** Your component imports `fetchTotal` from `./api`. You want the
component test to run offline with a canned total. Name the mechanism and the one rule about
where its declaration must live.

<details>
<summary>Answer</summary>

`vi.mock('./api', factory)` replaces the whole module. The factory must be self-contained:
it cannot reference top-level test variables (they are hoisted above imports), so canned
values are defined inside the factory (Examples 30, 31).

</details>

**Q9 (co-06 -- module-mock).** When do you mock part of a module (`importActual` + spread)
instead of the whole module, and what breaks if you mock the whole thing unnecessarily?

<details>
<summary>Answer</summary>

Mock one export and keep the rest real when only one collaborator is awkward (a network
helper beside pure formatting functions). Mocking the whole module replaces helpers you
wanted real, so the test stops exercising production code silently (Example 31).

</details>

**Q10 (co-07 -- timer-mock).** A component shows a toast 5 seconds after a click. Your test
advances fake time by 5 seconds but the toast never appears. Name two likely causes.

<details>
<summary>Answer</summary>

The timer was scheduled before `vi.useFakeTimers()` installed (order matters: freeze first,
then render), or the assertion ran before the state update flushed -- wrap the advance in
`act()` so effects and re-renders commit before the query (Examples 35-37, 44).

</details>

**Q11 (co-07 -- timer-mock).** Your suite's later tests time out after you added a fake-timer
test that passes alone. What leaked, and what one line in `afterEach` fixes it?

<details>
<summary>Answer</summary>

The fake clock survived its case: subsequent timeouts and intervals never fire on wall time.
Restore real timers in `afterEach` with `vi.useRealTimers()` so the freeze stays inside the
case that asked for it (Example 73).

</details>

**Q12 (co-08 -- snapshot).** A snapshot test fails after you renamed a CSS class and changed
nothing else. Was the failure useful? What should replace this snapshot?

<details>
<summary>Answer</summary>

No signal: the recorded tree changed cosmetically while behavior held. Replace whole-tree
snapshots of styled markup with targeted assertions (role, text) that survive class renames
and fail only when user-visible behavior changes (Examples 48, 52, Kata 3).

</details>

**Q13 (co-08 -- snapshot).** Name one case where a snapshot IS the right assertion, and the
review discipline its first run demands.

<details>
<summary>Answer</summary>

Serializing a genuinely complex, stable output (an email document, a config object) where
writing every assertion by hand costs more than reading the diff. Discipline: read the recorded file on creation -- an auto-created snapshot you never read is an assertion you
never wrote (Examples 45, 50, 53).

</details>

**Q14 (co-09 -- coverage-report).** Lines read 100 percent and a bug still ships in the
covered function. Explain how, using the words "branch" and "input".

<details>
<summary>Answer</summary>

Line coverage records that every line RAN, never which paths or inputs it ran with: default
parameters and short-circuits execute lines without taking every branch, and one input per
line never proves the neighboring inputs behave. Read branch coverage beside lines, and add
the missing test the table points at (Examples 54-56).

</details>

**Q15 (co-09 -- coverage-report).** Your team sets a coverage floor at the current number and
the suite stays green for months. What did the floor actually buy, and what did it not buy?

<details>
<summary>Answer</summary>

It bought regression detection on the COUNT: any change that drops exercised lines fails the
run. It did not buy correctness -- a fully covered function can still mishandle untested
inputs (Examples 58, 60, 61).

</details>

**Q16 (co-10 -- test-isolation).** Two tests share a module-level array. Each passes alone;
together, the second fails. Name the defect class and two fixes.

<details>
<summary>Answer</summary>

Order-dependent shared state: the first test's mutations leak into the second. Fix by
resetting in `beforeEach` (fresh fixture per case) or by making the shared value immutable
so mutation is impossible (Examples 6, 74).

</details>

**Q17 (co-10 -- test-isolation).** `mockFn.mockClear()` and `mockFn.mockReset()` both run
between tests in your suite. One of them is likely wrong -- which, and why?

<details>
<summary>Answer</summary>

Likely `mockReset()`: it drops `mockImplementation`, so a mock that returned canned values
returns `undefined` after reset, while `mockClear()` keeps implementations and only clears
call history. They encode different intents -- clear history versus drop behavior -- and
mixing them signals nobody chose (Example 34).

</details>

**Q18 (co-11 -- async-assertion).** Data loads 100ms after mount. Why is
`screen.getByText('ready')` immediately after `render()` the wrong query, and which two
replacements wait correctly?

<details>
<summary>Answer</summary>

`getBy*` reads the DOM exactly once, synchronously -- the data is not there yet. Use
`findByText` (get + wait) or `waitFor` around the assertion, which poll until the element
appears or the timeout expires (Examples 38-40).

</details>

**Q19 (co-11 -- async-assertion).** `waitFor` polls every 50ms with a 1000ms default timeout
for a value that arrives in 100ms. You set `{ timeout: 500, interval: 50 }` explicitly. What
did the explicit budget buy, and when must this run on a real clock?

<details>
<summary>Answer</summary>

The budget documents the patience the UI needs and fails loudly past it instead of hiding
behind a default tuned for someone else's machine. It must run on a real clock because
`waitFor`'s scheduler never advances on fake timers -- the wait would hang (Example 75).

</details>

**Q20 (co-12 -- accessibility-query).** `getByRole('button', { name: 'Remind me' })` fails
although the button renders. The button's content is the text "Remind me". Name two possible
causes related to accessible names.

<details>
<summary>Answer</summary>

The accessible name comes from `aria-label`/`aria-labelledby`/label association, not from
nearby text: a `div` click-handler has no button role at all, and a wrapped input may be
named by its `<label>` rather than its visible placeholder. Query what the accessibility
tree actually exposes -- inspect the name, assert text separately when elements carry none
(Examples 10, 12, 14).

</details>

**Q21 (co-13 -- debug-output).** A role query fails and the error lists no matching roles at
all -- the body is empty. What does the empty body tell you about WHERE the bug is?

<details>
<summary>Answer</summary>

The component never mounted its output: the bug is upstream of the query -- a conditional
return, an early error, or a render into a different container -- not in the query text.
`screen.debug()` (or `logRoles`) confirms the actual tree before you rewrite the query
(Examples 13, 17).

</details>

**Q22 (co-14 -- custom-render).** Three test files each wrap the component in the same theme
provider. What do you extract, where does it live, and what does each test file import?

<details>
<summary>Answer</summary>

Extract a `renderWithTheme` (or a shared `test-utils` re-exporting Testing Library's
`render` with a default wrapper) into a colocated helper module; each suite imports the
helper instead of repeating the provider (Examples 62, 70).

</details>

**Q23 (co-15 -- flaky-test-diagnosis).** A test fails once in twenty runs on CI, always with
a timeout, never locally. Name the first two distinctions to draw before touching the code.

<details>
<summary>Answer</summary>

Race versus bad wait: does the test assert before the UI settles (missing `findBy`/`waitFor`,
fixed sleep shorter than a loaded machine needs), or do two real async operations genuinely
resolve in either order? Fixed sleeps and missing awaits are bad waits -- fix the test. True
order-dependence is a product race -- fix the code (Examples 71, 74).

</details>

**Q24 (co-16 -- ci-reporting).** CI shows "1 failed" with no names. Which reporter flag
produces machine-readable output, what parses it, and why does the course keep the human
table too?

<details>
<summary>Answer</summary>

`vitest run --reporter=json` emits the full result object; a small parser (like this
course's `parse.mjs`) extracts pass counts for dashboards. Keep the terminal table for
humans: JSON is for machines, the table is for the developer reading the failure
(Example 77).

</details>

## Applied problems

Eight judgment calls with no single right answer -- argue the trade-off, then check the model
reasoning. Each names the examples that teach the tools involved.

**P1 -- Pick the query for an ambiguous element.** A settings page renders two switches, both
`<input type="checkbox">`, labelled "Email notifications" and "SMS notifications". A third
checkbox, "Enable all", toggles both. Write the three queries you would use, and say why a
bare `getAllByRole('checkbox')[0]` is the wrong answer even though it passes today.

<details>
<summary>Model reasoning</summary>

Query each switch by its accessible name -- `getByRole('checkbox', { name: 'Email
notifications' })` and the SMS twin -- because order-based indexing breaks the moment a
designer reorders the page, while names track user intent. "Enable all" gets its own named
query; asserting its behavior means clicking it and reading both siblings' `checked` states
(Examples 10, 68).

</details>

**P2 -- Mock or render for real?** A checkout form validates card numbers with a pure
`luhnCheck()` helper and submits through an injected `onPay` callback, but it also fetches
the order total from `/api/total` on mount. For the suite that pins "valid card + correct
total = one `onPay` call", decide: mock the fetch, mock `luhnCheck`, render everything real
-- and justify each choice in one sentence.

<details>
<summary>Model reasoning</summary>

Mock the fetch (network is never real in this course -- inject the total or mock the module
per Examples 30-32); keep `luhnCheck` real (pure, fast, and the actual logic under test);
keep `onPay` a `vi.fn()` recorder because the callback's invocation IS the assertion
(Examples 26, 43). Mock at the boundary you do not own; render everything you do.

</details>

**P3 -- Read the gap, write the missing test.** The coverage table reads 100 percent lines
for `shipping.ts` but 50 percent branches: the `express` flag's `true` arm never runs. The
existing test calls `shippingFee(total, false)`. Write the missing test and say which report
column would have caught this on the first run.

<details>
<summary>Model reasoning</summary>

The missing test pins the uncovered arm:

<!-- harness: illustration -->

```tsx
test("express orders add the surcharge", () => {
  expect(shippingFee(100, true)).toBe(115);
});
```

The branch column catches it: lines said "ran", branches said "half the paths never taken"
(Examples 54, 56, Kata 5).

</details>

**P4 -- Timer or wait?** A tooltip appears 100ms after hover and your suite must pin it.
Teammate A reaches for `vi.useFakeTimers()` + advance; teammate B for `findByRole` on a real
clock. Argue for each, then state the rule this course settled on.

<details>
<summary>Model reasoning</summary>

Fake timers make the 100ms cost zero wall time and stay deterministic -- but only with
`fireEvent`, because `userEvent`'s real-timer waits hang on frozen clocks, and `findBy` /
`waitFor` schedulers never advance on fakes either. Real-clock `findBy` costs 100ms and
works with every interaction API. Rule: fake clock plus `fireEvent` for timer mechanics you
control (Examples 36, 44); real clock plus `findBy` for appearance you merely await
(Examples 38, 75).

</details>

**P5 -- Snapshot or assertion?** A pull request adds a snapshot file with 400 lines for a
user profile card. You have one review minute. List the three questions that decide whether
you accept it, request targeted assertions, or accept-then-narrow.

<details>
<summary>Model reasoning</summary>

One: did the author READ the recorded file -- can they narrate what it pins? Two: is the
output stable (no timestamps, ids, or randomness) or will it churn every run? Three: would
a targeted assertion (role, text) catch the regressions that matter with less noise?
Accept stable, read, behavior-central snapshots (email documents); narrow styled markup to
targeted assertions (Examples 48, 50, 52, 60).

</details>

**P6 -- Flake triage.** These three CI failures land together: (a) a `findByText` timeout on
a 200ms animation, (b) a snapshot mismatch on a date string, (c) a test that passes alone
and fails in the full suite. Classify each as bad wait, nondeterminism, or shared state,
and give the one-line fix direction for each.

<details>
<summary>Model reasoning</summary>

(a) Bad wait: the fixed expectation assumes a fast machine -- raise the timeout or, better,
assert the settled state with an explicit budget (Example 75). (b) Nondeterminism: the
recorded value embeds wall time -- freeze the clock or use property matchers (Examples 33,
49). (c) Shared state: order dependence -- reset in `beforeEach` (Examples 10, 74).

</details>

**P7 -- Provider sprawl.** Five suites each mount a different slice of the same app, and
each hand-rolls theme + router + store wrappers. Propose the shared-test-utils shape that
kills the duplication without hiding what each test needs, and say what stays per-suite.

<details>
<summary>Model reasoning</summary>

A colocated `test-utils` module re-exporting Testing Library's `render` with the common
providers baked in, plus named wrappers for suite-specific needs (a store seeded a certain
way). Default providers live in the helper; unusual seeds and per-case props stay visible
in each test -- shared machinery, explicit intent (Examples 62-65, 70, Kata 6).

</details>

**P8 -- The CI command.** Your pipeline runs `vitest run` and reports "3 failed" with no
names in the dashboard. Name the two additions that turn this into a debuggable pipeline,
and which audience each serves.

<details>
<summary>Model reasoning</summary>

Add `--coverage` with the text reporter for humans (which lines the failures left uncovered)
and `--reporter=json` plus a parser for machines (counts and names per suite for the
dashboard). Humans read the table; dashboards read the JSON; the gate script reads the
summary and fails the build (Examples 61, 77, 78).

</details>
## Code katas

Eight self-contained exercises. Each kata ships a `before/` starting point and an `after/` reviewed target under `drilling/code/kata-NN-*/`, plus a `run.yaml` that runs the `after/` suite. Work the `before/` first, then diff against `after/`.

### Kata 1 -- Replace a test-id query with a role query

The button is findable by `getByTestId` and the suite is green -- but the query is blind to the accessible name. Convert the query to `getByRole('button', { name: ... })` and delete the test id from the component. The suite must stay green: same behavior, honest query (Examples 9, 13).

**`drilling/code/kata-01-role-not-testid/before/save-button.tsx`**:

```tsx
// => KATA 01 starting point: works, but blind to users.
// => The test id finds the button while a broken label would too.
import React from "react";
// => Subject: a labelled action button, the role is right there.

// => SaveButton: real text content, real button role, test id anyway.
export function SaveButton({ onSave }: { onSave: () => void }): React.JSX.Element {
  // => Props: one callback, fired on click in both versions.
  return (
    <button type="button" data-testid="save-btn" onClick={onSave}>
      {/* => Test id: the crutch this kata removes. */}
      Save
      {/* => Visible text: what the role query will anchor on. */}
    </button>
  );
}
```

**`drilling/code/kata-01-role-not-testid/before/save-button.test.tsx`**:

```tsx
// @vitest-environment jsdom
// => DOM pragma: the button renders into a document.

import { expect, test, vi } from "vitest";
// => Recorder: the click must reach the callback.

import { fireEvent, render, screen } from "@testing-library/react";
// => BEFORE style: test-id query plus fireEvent dispatch.

import "@testing-library/jest-dom/vitest";
// => Matcher: the callback count assertion.

import { SaveButton } from "./save-button";
// => Subject: the button with its test-id crutch still attached.

test("before: test id finds the button", () => {
  // => Starting point: green, but coupled to a testing-only attribute.
  const onSave = vi.fn();
  // => Recorder: fires on click in both versions.
  render(<SaveButton onSave={onSave} />);
  // => Mount: the button renders with text AND test id.
  fireEvent.click(screen.getByTestId("save-btn"));
  // => Test-id query: passes today, blind to accessible names.
  expect(onSave).toHaveBeenCalledTimes(1);
  // => Click landed: the behavior works, the query is the smell.
});
```

**`drilling/code/kata-01-role-not-testid/after/save-button.tsx`**:

```tsx
// => KATA 01 target: the same button, no test id.
// => Nothing changed for users: only the test's coupling changed.
import React from "react";
// => Subject: identical markup minus the testing-only attribute.

// => SaveButton: text content carries the query now.
export function SaveButton({ onSave }: { onSave: () => void }): React.JSX.Element {
  // => Props unchanged: the component API is stable across the kata.
  return (
    <button type="button" onClick={onSave}>
      {/* => No test id: production markup carries zero testing hooks. */}
      Save
      {/* => Visible text: the accessible name the role query reads. */}
    </button>
  );
}
```

**`drilling/code/kata-01-role-not-testid/after/save-button.test.tsx`**:

```tsx
// @vitest-environment jsdom
// => DOM pragma: the button renders into a document.

import { expect, test, vi } from "vitest";
// => Recorder: the click must reach the callback.

import { fireEvent, render, screen } from "@testing-library/react";
// => AFTER style: role query, same fireEvent dispatch.

import "@testing-library/jest-dom/vitest";
// => Matcher: the callback count assertion.

import { SaveButton } from "./save-button";
// => Subject: the button without any test id.

test("after: role query finds the button by its name", () => {
  // => Target: green AND honest about the accessible name.
  const onSave = vi.fn();
  // => Recorder: fires on click exactly as before.
  render(<SaveButton onSave={onSave} />);
  // => Mount: text content is the only hook the test uses.
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  // => Role query: breaks if the label breaks, silent on markup churn.
  expect(onSave).toHaveBeenCalledTimes(1);
  // => Click landed: same behavior, decoupled query.
});
```

**Run**: `vitest run --dir after` (from `drilling/code/kata-01-role-not-testid/`)

**Output** (`drilling/code/kata-01-role-not-testid/expected/main.stdout.txt`):

```text
PASS: kata-01-role-not-testid (1 tests)
```

### Kata 2 -- Mock a flaky external call

The suite asserts the morning greeting against the wall clock: green before noon, red after. Extract the pure `greetingAt(hour)` core, inject the hour, and pin both branches with plain numbers. The flake disappears because the clock leaves the unit (Examples 33, 76).

**`drilling/code/kata-02-mock-flaky-call/before/greeting.ts`**:

```ts
// => KATA 02 starting point: the clock decides, the test hopes.
// => Run before noon: green. Run after noon: red. That IS the bug.
export function greeting(): string {
  // => Impure: reads the wall clock, untestable without controlling time.
  const hour = new Date().getHours();
  // => Wall-clock read: the flake source, buried in production code.
  return hour < 12 ? "good morning" : "good afternoon";
  // => Two branches: the test below only ever wanted the first.
}
```

**`drilling/code/kata-02-mock-flaky-call/before/greeting.test.ts`**:

```ts
// @vitest-environment jsdom
// => Pragma harmless here: pure logic, but katas share the course shape.

import { expect, test } from "vitest";
// => One assertion: the whole suite is a single fragile claim.

import { greeting } from "./greeting";
// => Subject: the clock-reading function.

test("before: morning greeting", () => {
  // => Fragile claim: true before noon, false after -- calendar roulette.
  expect(greeting()).toBe("good morning");
  // => Hope-based: passes when the author runs it, fails on night-shift CI.
});
```

**`drilling/code/kata-02-mock-flaky-call/after/greeting.ts`**:

```ts
// => KATA 02 target: the hour is a parameter, the clock stays outside.
// => Pure core, impure shell: test the core, wire the shell once.
export function greetingAt(hour: number): string {
  // => Pure: same input, same output, no clock, no flake, ever.
  return hour < 12 ? "good morning" : "good afternoon";
  // => Branch on the argument: both paths reachable in microseconds.
}

export function greeting(): string {
  // => Shell: the only impure line, too thin to hide a bug.
  return greetingAt(new Date().getHours());
  // => Clock read isolated: one call site, zero logic around it.
}
```

**`drilling/code/kata-02-mock-flaky-call/after/greeting.test.ts`**:

```ts
// @vitest-environment jsdom
// => Pragma harmless here: pure logic, but katas share the course shape.

import { expect, test } from "vitest";
// => Two assertions: both branches, no clock, no calendar.

import { greetingAt } from "./greeting";
// => Subject: the pure core, hours injected as plain numbers.

test("after: both greetings from injected hours", () => {
  // => Deterministic: 9 and 15 behave the same at every hour of the day.
  expect(greetingAt(9)).toBe("good morning");
  // => Morning branch: the case the old test could only hope for.
  expect(greetingAt(15)).toBe("good afternoon");
  // => Afternoon branch: previously untestable without waiting for noon.
});
```

**Run**: `vitest run --dir after` (from `drilling/code/kata-02-mock-flaky-call/`)

**Output** (`drilling/code/kata-02-mock-flaky-call/expected/main.stdout.txt`):

```text
PASS: kata-02-mock-flaky-call (1 tests)
```

### Kata 3 -- Convert a brittle snapshot into targeted assertions

The card suite records the whole tree: any class rename fails it. Replace `toMatchSnapshot` with a heading-role assertion plus a text assertion that pin exactly the user-visible facts. The component does not change -- only what the suite promises (Examples 48, 52).

**`drilling/code/kata-03-targeted-not-snapshot/before/user-card.tsx`**:

```tsx
// => KATA 03 starting point: the snapshot knows everything, asserts nothing.
// => Rename a class, change nothing: the suite goes red with zero signal.
import React from "react";
// => Subject: a user card with a name, a role, and styling hooks.

// => UserCard: avatar initial, name heading, role paragraph, card class.
export function UserCard({ name, role }: { name: string; role: string }): React.JSX.Element {
  // => Props: the two facts the targeted suite will assert directly.
  return (
    <div className="card card--user">
      {/* => Styling hooks: snapshot-fragile, behavior-irrelevant. */}
      <h2>{name}</h2>
      {/* => Name heading: the role query target in the rewrite. */}
      <p>{role}</p>
      {/* => Role paragraph: the text assertion target. */}
    </div>
  );
}
```

**`drilling/code/kata-03-targeted-not-snapshot/before/user-card.test.tsx`**:

```tsx
// @vitest-environment jsdom
// => DOM pragma: the card renders into a document.

import { expect, test } from "vitest";
// => One assertion: the whole rendered tree, recorded wholesale.

import { render } from "@testing-library/react";
// => No queries: the snapshot needs no element lookup at all.

import "@testing-library/jest-dom/vitest";
// => Matchers: toMatchSnapshot comes from the runner itself.

import { UserCard } from "./user-card";
// => Subject: the card, recorded rather than asserted.

test("before: card matches the recorded tree", () => {
  // => Starting point: green until any markup shifts, signal or not.
  const { container } = render(<UserCard name="siti" role="Maintainer" />);
  // => Full container: every div, class, and node recorded.
  expect(container.firstChild).toMatchSnapshot();
  // => Whole-tree record: a class rename fails this with zero insight.
});
```

**`drilling/code/kata-03-targeted-not-snapshot/after/user-card.tsx`**:

```tsx
// => KATA 03 target: identical component, behavior-asserted.
// => The component did not change: only what the suite promises changed.
import React from "react";
// => Subject: byte-identical to before, the diff is purely in the test.

// => UserCard: same classes, same nodes, now covered by intent.
export function UserCard({ name, role }: { name: string; role: string }): React.JSX.Element {
  // => Props: name and role, the two user-visible facts.
  return (
    <div className="card card--user">
      {/* => Classes stay: styling is free to evolve without failing tests. */}
      <h2>{name}</h2>
      {/* => Heading: level plus text, the contract this suite pins. */}
      <p>{role}</p>
      {/* => Paragraph: role text, asserted verbatim. */}
    </div>
  );
}
```

**`drilling/code/kata-03-targeted-not-snapshot/after/user-card.test.tsx`**:

```tsx
// @vitest-environment jsdom
// => DOM pragma: the card renders into a document.

import { expect, test } from "vitest";
// => Two assertions: exactly the user-visible facts, nothing else.

import { render, screen } from "@testing-library/react";
// => AFTER style: role and text queries replace the whole-tree record.

import "@testing-library/jest-dom/vitest";
// => Matchers: heading level and text assertions.

import { UserCard } from "./user-card";
// => Subject: unchanged component, rewritten promises.

test("after: name heading and role text carry the contract", () => {
  // => Target: a class rename stays green, a lost name goes red.
  render(<UserCard name="siti" role="Maintainer" />);
  // => Mount: same props, queries instead of recording.
  expect(screen.getByRole("heading", { name: "siti" })).toBeInTheDocument();
  // => Name contract: heading level plus text, the accessible promise.
  expect(screen.getByText("Maintainer")).toBeInTheDocument();
  // => Role contract: visible text, independent of markup.
});
```

**Run**: `vitest run --dir after` (from `drilling/code/kata-03-targeted-not-snapshot/`)

**Output** (`drilling/code/kata-03-targeted-not-snapshot/expected/main.stdout.txt`):

```text
PASS: kata-03-targeted-not-snapshot (1 tests)
```

### Kata 4 -- Trade wall-clock waiting for a fake clock

The suite sleeps 350 real milliseconds for a 300ms timer. Freeze the clock with `vi.useFakeTimers()`, attach the assertion first, advance past the delay, and flush. Same settlement, zero wall time, deterministic on any machine (Examples 35, 36).

**`drilling/code/kata-04-fake-timer-instead-of-wait/before/delay.ts`**:

```ts
// => KATA 04 starting point: wall-clock waiting, 300 honest milliseconds.
// => The delay is real, the wait is real, the suite pays full price.
export function delayedEcho(value: string, ms: number): Promise<string> {
  // => Promise wrapper: resolves with the value after the delay.
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
    // => Real timer: the suite below waits it out, millisecond for millisecond.
  });
}
```

**`drilling/code/kata-04-fake-timer-instead-of-wait/before/delay.test.ts`**:

```ts
// @vitest-environment jsdom
// => Pragma shared: katas keep the course shape even for pure logic.

import { expect, test } from "vitest";
// => One assertion: the echoed value after the real delay.

import { delayedEcho } from "./delay";
// => Subject: the setTimeout promise.

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
// => Sleep helper: the wall-clock wait this kata eliminates.

test("before: real 300ms wait for a real 300ms timer", async () => {
  // => Starting point: green in 300ms, slower with every timer added.
  const pending = delayedEcho("ready", 300);
  // => Start the timer: the value arrives after the real delay.
  await delay(350);
  // => Wall-clock wait: 50ms of margin against a loaded machine.
  expect(await pending).toBe("ready");
  // => Value arrives: correct, and paid for in full.
});
```

**`drilling/code/kata-04-fake-timer-instead-of-wait/after/delay.ts`**:

```ts
// => KATA 04 target: identical helper, clock-controlled suite.
// => Production code unchanged: the kata moves the clock, not the code.
export function delayedEcho(value: string, ms: number): Promise<string> {
  // => Promise wrapper: resolves with the value after the delay.
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
    // => Same timer: under fake clocks it fires on advance, costing nothing.
  });
}
```

**`drilling/code/kata-04-fake-timer-instead-of-wait/after/delay.test.ts`**:

```ts
// @vitest-environment jsdom
// => Pragma shared: katas keep the course shape even for pure logic.

import { afterEach, expect, test, vi } from "vitest";
// => Fake-clock surface: install before, restore after, every case.

import { delayedEcho } from "./delay";
// => Subject: the same setTimeout promise, now clock-driven.

afterEach(() => {
  vi.useRealTimers();
  // => Restore: the fake clock stays inside this kata's cases.
});

test("after: fake clock settles the timer in zero wall time", async () => {
  // => Target: green in milliseconds, deterministic on any machine.
  vi.useFakeTimers();
  // => Frozen clock: setTimeout schedules but never fires on its own.
  const pending = delayedEcho("ready", 300);
  // => Start the timer: pending until the suite advances the clock.
  const assertion = expect(pending).resolves.toBe("ready");
  // => Attach first: the assertion observes the settlement below.
  await vi.advanceTimersByTimeAsync(300);
  // => Advance past the delay: the timer fires, the promise settles.
  await assertion;
  // => Flush the observation: the recorded value matches.
});
```

**Run**: `vitest run --dir after` (from `drilling/code/kata-04-fake-timer-instead-of-wait/`)

**Output** (`drilling/code/kata-04-fake-timer-instead-of-wait/expected/main.stdout.txt`):

```text
PASS: kata-04-fake-timer-instead-of-wait (1 tests)
```

### Kata 5 -- Close the branch the table names

Line coverage is full and branch coverage is half: the member arm never runs. Add the missing test that pins the member total, and read the table again -- lines, branches, and functions all full (Examples 54, 55).

**`drilling/code/kata-05-cover-the-member-branch/before/fees.ts`**:

```ts
// => KATA 05 starting point: the member branch exists, no test takes it.
// => Coverage would name line 8 today: one test, one path, half the function.
export function totalWithFee(subtotal: number, member: boolean): number {
  // => Fee rule: members skip the fee, guests pay two units on top.
  if (member) return subtotal;
  // => Member path: no fee, currently untested -- the gap to close.
  return subtotal + 2;
  // => Guest path: the only path the suite below exercises.
}
```

**`drilling/code/kata-05-cover-the-member-branch/before/fees.test.ts`**:

```ts
// @vitest-environment jsdom
// => Pragma shared: katas keep the course shape even for pure logic.

import { expect, test } from "vitest";
// => One assertion: the guest path, the only covered one.

import { totalWithFee } from "./fees";
// => Subject: the two-branch fee rule.

test("before: guest total adds the fee", () => {
  // => Starting point: green, and quietly half-blind.
  expect(totalWithFee(10, false)).toBe(12);
  // => Guest path: covered. The member path runs in production, untested.
});
```

**`drilling/code/kata-05-cover-the-member-branch/after/fees.ts`**:

```ts
// => KATA 05 target: identical function, both branches pinned.
// => No production change: the kata adds the missing test, not new logic.
export function totalWithFee(subtotal: number, member: boolean): number {
  // => Fee rule: members skip the fee, guests pay two units on top.
  if (member) return subtotal;
  // => Member path: NOW covered, the gap this kata closes.
  return subtotal + 2;
  // => Guest path: covered before and still covered now.
}
```

**`drilling/code/kata-05-cover-the-member-branch/after/fees.test.ts`**:

```ts
// @vitest-environment jsdom
// => Pragma shared: katas keep the course shape even for pure logic.

import { expect, test } from "vitest";
// => Two assertions: one per branch, the gap closed.

import { totalWithFee } from "./fees";
// => Subject: unchanged function, fully exercised suite.

test("after: member skips the fee, guest pays it", () => {
  // => Target: both branches pinned, the table reads full.
  expect(totalWithFee(10, true)).toBe(10);
  // => Member path: the line coverage flagged, now asserted.
  expect(totalWithFee(10, false)).toBe(12);
  // => Guest path: kept, the old test survives inside the new one.
});
```

**Run**: `vitest run --dir after` (from `drilling/code/kata-05-cover-the-member-branch/`)

**Output** (`drilling/code/kata-05-cover-the-member-branch/expected/main.stdout.txt`):

```text
PASS: kata-05-cover-the-member-branch (1 tests)
```

### Kata 6 -- Wrap the component the providers it needs

The badge reads theme context that no test provides, so mounting throws the loud provider error. Extract a `renderWithTheme` helper that mounts the provider, and pin both modes through it. The guard stays for production; tests stop tripping it (Examples 62, 70).

**`drilling/code/kata-06-provide-the-theme/before/badge.tsx`**:

```tsx
// => KATA 06 starting point: the badge needs a theme that is not there.
// => Rendering without the provider throws: context defaults to null.
import React, { createContext, useContext } from "react";
// => Context pair: the provider the before-test forgets to mount.

// => Theme value: the two modes the badge switches between.
export type Theme = "light" | "dark";

// => ThemeContext: null default, so missing providers fail LOUDLY.
export const ThemeContext = createContext<Theme | null>(null);

// => ThemedBadge: reads the theme, crashes honestly without it.
export function ThemedBadge({ label }: { label: string }): React.JSX.Element {
  // => Label prop: the accessible name the after-test queries.
  const theme = useContext(ThemeContext);
  // => Context read: null when no provider wraps the badge.
  if (theme === null) throw new Error("ThemedBadge needs a ThemeContext provider");
  // => Loud failure: the exact error the before-test below records.
  return <span data-theme={theme}>{label}</span>;
  // => Theme attribute: the styling hook the suite asserts.
}
```

**`drilling/code/kata-06-provide-the-theme/before/badge.test.tsx`**:

```tsx
// @vitest-environment jsdom
// => DOM pragma: the badge renders -- or throws -- into a document.

import { expect, test } from "vitest";
// => One assertion: the provider error, honestly recorded.

import { render } from "@testing-library/react";
// => Bare render: no provider, the starting point of the kata.

import { ThemedBadge } from "./badge";
// => Subject: the badge, mounted without what it needs.

test("before: missing provider throws the loud error", () => {
  // => Starting point: the error names the missing piece, recorded as fact.
  expect(() => render(<ThemedBadge label="New" />)).toThrow("ThemedBadge needs a ThemeContext provider");
  // => Documented failure: the kata starts where the confusion starts.
});
```

**`drilling/code/kata-06-provide-the-theme/after/badge.tsx`**:

```tsx
// => KATA 06 target: a render helper that always provides the theme.
// => Components keep reading context: tests stop forgetting the provider.
import React, { createContext, useContext } from "react";
// => Context pair: unchanged, the fix is in how tests mount.

// => Theme value: the two modes the badge switches between.
export type Theme = "light" | "dark";

// => ThemeContext: null default, still loud when truly missing.
export const ThemeContext = createContext<Theme | null>(null);

// => ThemedBadge: reads the theme, renders the attribute.
export function ThemedBadge({ label }: { label: string }): React.JSX.Element {
  // => Label prop: the accessible name the suite queries.
  const theme = useContext(ThemeContext);
  // => Context read: the helper below guarantees it is never null.
  if (theme === null) throw new Error("ThemedBadge needs a ThemeContext provider");
  // => Guard kept: production misuse still fails loudly.
  return <span data-theme={theme}>{label}</span>;
  // => Theme attribute: asserted per mode in the suite.
}
```

**`drilling/code/kata-06-provide-the-theme/after/badge.test.tsx`**:

```tsx
// @vitest-environment jsdom
// => DOM pragma: the badge renders wrapped, per mode.

import { expect, test } from "vitest";
// => Two assertions: one per theme mode.

import { cleanup, render, screen } from "@testing-library/react";
// => Queries plus cleanup: two mounts need a pristine DOM between them.

import "@testing-library/jest-dom/vitest";
// => Matchers: attribute assertions read cleanly.

import React from "react";
// => JSX runtime: the helper returns an element.

import { Theme, ThemeContext, ThemedBadge } from "./badge";
// => Subject plus context: the helper below wires them together.

// => renderWithTheme: the kata's whole lesson in six lines.
function renderWithTheme(label: string, theme: Theme): void {
  // => Helper signature: label plus mode, nothing else to remember.
  render(
    <ThemeContext.Provider value={theme}>
      {/* => Provider mounted: the piece the before-test forgot. */}
      <ThemedBadge label={label} />
      {/* => Badge inside: context present, no throw. */}
    </ThemeContext.Provider>,
  );
}

test("after: badge renders under both themes", () => {
  // => Target: green in both modes through one helper.
  renderWithTheme("New", "dark");
  // => Dark first: attribute must read dark.
  expect(screen.getByText("New")).toHaveAttribute("data-theme", "dark");
  // => Dark proven: query by text, assert the theme hook.
  cleanup();
  // => Unmount: one badge per DOM, the second render starts clean.
  renderWithTheme("New", "light");
  // => Light second: same label, opposite mode.
  expect(screen.getByText("New")).toHaveAttribute("data-theme", "light");
  // => Light proven: the helper carries the mode, tests stay small.
});
```

**Run**: `vitest run --dir after` (from `drilling/code/kata-06-provide-the-theme/`)

**Output** (`drilling/code/kata-06-provide-the-theme/expected/main.stdout.txt`):

```text
PASS: kata-06-provide-the-theme (1 tests)
```

### Kata 7 -- Poll for appearance instead of sleeping through it

The loader suite sleeps a fixed 200ms for an 80ms load: green on fast machines, flaky on loaded ones. Replace the sleep with `findByText`, which resolves the moment the state lands and waits only when it must (Examples 38, 39).

**`drilling/code/kata-07-findby-not-sleep/before/loader.tsx`**:

```tsx
// => KATA 07 starting point: the loader resolves, the test sleeps.
// => 200ms of margin for an 80ms load: green, slow, and silently racy.
import { useEffect, useState } from "react";
// => Effect plus state: fetch on mount, names after.

// => GreetLoader: loading text, then one greeting line.
export function GreetLoader({ load }: { load: () => Promise<string> }): React.JSX.Element {
  // => Injected loader: no network, an 80ms deferred promise in the test.
  const [greeting, setGreeting] = useState<string | null>(null);
  // => Null means pending: the loading text owns the first paint.
  useEffect(() => {
    load().then(setGreeting);
    // => Settle writes state: the effect below tests the paint after.
  }, [load]);
  if (greeting === null) return <p>Loading…</p>;
  // => Placeholder: the sleep below must outlast the real 80ms delay.
  return <p>{greeting}</p>;
  // => Settled line: the assertion target after the sleep.
}
```

**`drilling/code/kata-07-findby-not-sleep/before/loader.test.tsx`**:

```tsx
// @vitest-environment jsdom
// => DOM pragma: placeholder then greeting render here.

import { expect, test } from "vitest";
// => One assertion: the greeting, after a fixed sleep.

import { render, screen } from "@testing-library/react";
// => Sync queries only: the sleep below replaces every async query.

import "@testing-library/jest-dom/vitest";
// => Matchers: text presence assertions.

import { GreetLoader } from "./loader";
// => Subject: the 80ms loader.

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
// => Sleep helper: wall-clock waiting with a hardcoded margin.

test("before: fixed 200ms sleep outlasts the 80ms load", async () => {
  // => Starting point: green on a fast machine, red on a loaded one.
  render(<GreetLoader load={() => new Promise((r) => setTimeout(() => r("halo"), 80))} />);
  // => Mount: 80ms deferred greeting, the number the sleep must beat.
  await sleep(200);
  // => Fixed wait: 120ms of margin that a busy CI agent can still eat.
  expect(screen.getByText("halo")).toBeInTheDocument();
  // => Greeting present: correct when the margin holds, flaky when not.
});
```

**`drilling/code/kata-07-findby-not-sleep/after/loader.tsx`**:

```tsx
// => KATA 07 target: identical loader, polled assertion.
// => Production code unchanged: the wait moves from sleep to query.
import { useEffect, useState } from "react";
// => Effect plus state: fetch on mount, names after.

// => GreetLoader: loading text, then one greeting line.
export function GreetLoader({ load }: { load: () => Promise<string> }): React.JSX.Element {
  // => Injected loader: the after-suite drives the same 80ms promise.
  const [greeting, setGreeting] = useState<string | null>(null);
  // => Null means pending: findBy replaces the placeholder it polls.
  useEffect(() => {
    load().then(setGreeting);
    // => Settle writes state: the retried query observes it.
  }, [load]);
  if (greeting === null) return <p>Loading…</p>;
  // => Placeholder: polled away, never slept through.
  return <p>{greeting}</p>;
  // => Settled line: the findBy target.
}
```

**`drilling/code/kata-07-findby-not-sleep/after/loader.test.tsx`**:

```tsx
// @vitest-environment jsdom
// => DOM pragma: placeholder then greeting render here.

import { expect, test } from "vitest";
// => One assertion: the greeting, found by polling, not by sleeping.

import { render, screen } from "@testing-library/react";
// => AFTER style: findBy polls; no sleep helper, no margin to tune.

import "@testing-library/jest-dom/vitest";
// => Matchers: text presence assertions.

import { GreetLoader } from "./loader";
// => Subject: the same 80ms loader, waited on properly.

test("after: findBy polls until the greeting settles", async () => {
  // => Target: fast on fast machines, patient on loaded ones.
  render(<GreetLoader load={() => new Promise((r) => setTimeout(() => r("halo"), 80))} />);
  // => Mount: same deferred greeting, no sleep anywhere.
  expect(await screen.findByText("halo")).toBeInTheDocument();
  // => Polled read: resolves the moment the state lands, waits only if needed.
});
```

**Run**: `vitest run --dir after` (from `drilling/code/kata-07-findby-not-sleep/`)

**Output** (`drilling/code/kata-07-findby-not-sleep/expected/main.stdout.txt`):

```text
PASS: kata-07-findby-not-sleep (1 tests)
```

### Kata 8 -- Type the input instead of pasting the value

One `fireEvent.change` with the full value skips every intermediate keystroke, so the mid-typing hint never renders. Drive the input with `userEvent.type` and assert the hint appears mid-word and clears at completion -- the states pasting skips (Examples 25, 41).

**`drilling/code/kata-08-type-dont-paste/before/code-input.tsx`**:

```tsx
// => KATA 08 starting point: paste the value, skip the keystrokes.
// => Per-keystroke hints never fire: one change event, zero intermediate states.
import React, { useState } from "react";
// => State: the code value plus the transient typing hint.

// => CodeInput: hint while typing (1-2 chars), valid at 3+, error when blurred empty.
export function CodeInput(): React.JSX.Element {
  // => No props: the kata isolates the event mechanics, nothing else.
  const [value, setValue] = useState("");
  // => Value state: every keystroke flows through here in the after-version.
  const [hint, setHint] = useState("");
  // => Hint state: typing guidance, the behavior fireEvent skips.
  const changed = (next: string): void => {
    // => Change handler: runs per keystroke under user-event, once under paste.
    setValue(next);
    // => Value first: the input mirrors what was typed or pasted.
    setHint(next.length > 0 && next.length < 3 ? "keep typing…" : "");
    // => Hint rule: partial input guides, empty and complete show nothing.
  };
  return (
    <div>
      {/* => Wrapper: hint and input render as siblings. */}
      <label htmlFor="kata-code">Code</label>
      {/* => Label: the query anchor, unchanged across the kata. */}
      <input id="kata-code" value={value} onChange={(e) => changed(e.target.value)} />
      {/* => Controlled input: one change event per keystroke -- or one total. */}
      {hint !== "" && <p>{hint}</p>}
      {/* => Hint paragraph: present only mid-typing, the assertion target. */}
    </div>
  );
}
```

**`drilling/code/kata-08-type-dont-paste/before/code-input.test.tsx`**:

```tsx
// @vitest-environment jsdom
// => DOM pragma: input and hint render here.

import { expect, test } from "vitest";
// => One assertion: the mid-typing hint -- which never appears.

import { fireEvent, render, screen } from "@testing-library/react";
// => BEFORE style: a single change event with the whole value.

import "@testing-library/jest-dom/vitest";
// => Matchers: text presence assertions.

import { CodeInput } from "./code-input";
// => Subject: the per-keystroke hint input.

test("before: pasting the full value skips the typing hint", () => {
  // => Starting point: red-by-design, the hint never renders on paste.
  render(<CodeInput />);
  // => Mount: empty input, no hint yet.
  fireEvent.change(screen.getByLabelText("Code"), { target: { value: "abcd" } });
  // => Paste in one event: length jumps 0 to 4, hint rule never sees 1-2.
  expect(screen.getByText("keep typing…")).toBeInTheDocument();
  // => Documented failure: the intermediate state the paste skipped.
});
```

**`drilling/code/kata-08-type-dont-paste/after/code-input.tsx`**:

```tsx
// => KATA 08 target: identical input, keystroke-driven suite.
// => Production code unchanged: typing exercises what pasting skips.
import React, { useState } from "react";
// => State: the code value plus the transient typing hint.

// => CodeInput: hint while typing (1-2 chars), valid at 3+.
export function CodeInput(): React.JSX.Element {
  // => No props: the event mechanics carry the whole lesson.
  const [value, setValue] = useState("");
  // => Value state: four keystrokes build it one char at a time.
  const [hint, setHint] = useState("");
  // => Hint state: visible mid-typing, gone at completion.
  const changed = (next: string): void => {
    // => Change handler: fires per keystroke under user-event.
    setValue(next);
    // => Value mirrors: the input shows each char as typed.
    setHint(next.length > 0 && next.length < 3 ? "keep typing…" : "");
    // => Hint rule: lengths 1-2 guide, 0 and 3+ stay silent.
  };
  return (
    <div>
      {/* => Wrapper: hint and input render as siblings. */}
      <label htmlFor="kata-code">Code</label>
      {/* => Label: the same query anchor as before. */}
      <input id="kata-code" value={value} onChange={(e) => changed(e.target.value)} />
      {/* => Controlled input: user-event dispatches one event per char. */}
      {hint !== "" && <p>{hint}</p>}
      {/* => Hint paragraph: asserted present mid-typing, absent at the end. */}
    </div>
  );
}
```

**`drilling/code/kata-08-type-dont-paste/after/code-input.test.tsx`**:

```tsx
// @vitest-environment jsdom
// => DOM pragma: input and hint render here.

import { expect, test } from "vitest";
// => Three assertions: hint appears mid-typing, clears at completion.

import { render, screen } from "@testing-library/react";
// => AFTER style: no fireEvent import, real keystrokes only.

import userEvent from "@testing-library/user-event";
// => Real typing: one change event per character, hints and all.

import "@testing-library/jest-dom/vitest";
// => Matchers: text presence and absence assertions.

import { CodeInput } from "./code-input";
// => Subject: the same input, driven the way users drive it.

test("after: typing shows the hint mid-word and clears it at three chars", async () => {
  // => Target: the intermediate states fireEvent skipped, observed live.
  render(<CodeInput />);
  // => Mount: empty input, no hint yet.
  const user = userEvent.setup();
  // => Real driver: keystrokes dispatch trusted change events.
  await user.type(screen.getByLabelText("Code"), "ab");
  // => Two chars: the hint rule fires, guidance renders.
  expect(screen.getByText("keep typing…")).toBeInTheDocument();
  // => Hint present: intermediate state observed, the before-test's wish.
  await user.type(screen.getByLabelText("Code"), "cd");
  // => Two more: length reaches 4, the hint window closes.
  expect(screen.queryByText("keep typing…")).not.toBeInTheDocument();
  // => Hint cleared: complete input explains nothing, correctly.
});
```

**Run**: `vitest run --dir after` (from `drilling/code/kata-08-type-dont-paste/`)

**Output** (`drilling/code/kata-08-type-dont-paste/expected/main.stdout.txt`):

```text
PASS: kata-08-type-dont-paste (1 tests)
```

## Self-check checklist

Twenty-four "I can ..." statements, at least one per concept. Check each box honestly -- an
unchecked box names the example to revisit.

- [ ] I can run a Vitest suite and read which file, test, and assertion failed (co-01).
- [ ] I can explain why file-level parallelism makes shared module state a defect (co-01).
- [ ] I can pick the highest-priority query for any element: role first, test id last (co-02).
- [ ] I can rewrite a test-id query as a role-plus-name query without changing behavior (co-02).
- [ ] I can mount a component with `render` and unmount it with `cleanup` between tests (co-03).
- [ ] I can drive clicks and typing with `userEvent` and say when `fireEvent` fits better (co-04).
- [ ] I can record calls with `vi.fn()` and pin counts plus exact arguments (co-05).
- [ ] I can replace a whole module with `vi.mock` and keep the factory self-contained (co-06).
- [ ] I can mock one export while keeping the rest of the module real (co-06).
- [ ] I can freeze time with `vi.useFakeTimers()`, advance it, and restore it in `afterEach` (co-07).
- [ ] I can flush effects and microtasks so assertions read settled state (co-07).
- [ ] I can record a snapshot, read the recorded file, and update it deliberately (co-08).
- [ ] I can replace a brittle whole-tree snapshot with targeted assertions (co-08).
- [ ] I can read a coverage table and name which column flags the gap (co-09).
- [ ] I can set a coverage floor that fails the build when lines slip (co-09).
- [ ] I can isolate tests with `beforeEach` resets and `mockClear` versus `mockReset` (co-10).
- [ ] I can wait for appearance with `findBy` and `waitFor` instead of fixed sleeps (co-11).
- [ ] I can state an explicit `waitFor` budget and defend its numbers (co-11).
- [ ] I can query by role and accessible name, and assert text separately when names are absent (co-12).
- [ ] I can use `screen.debug()` to read the actual DOM behind a failing query (co-13).
- [ ] I can extract a custom render with providers into a shared test module (co-14).
- [ ] I can tell a real race from a bad wait and fix each in the right place (co-15).
- [ ] I can produce a machine-readable CI report and parse pass counts from it (co-16).
- [ ] I can assemble the CI command -- run, coverage, report, gate -- and read its output (co-16).

## Elaborative interrogation & self-explanation

Six why and why-not prompts. Each names a design choice and the rejected alternative -- answer
before reading the model answer.

**E1 -- Why query by role instead of by CSS class? Why not select what styling selects?**

<details>
<summary>Model answer</summary>

Classes are a styling contract: designers rename them freely, and a class-coupled test fails
on restyles while passing on broken labels. Roles plus accessible names are the contract
blind users rely on, so a green suite means the interface is operable, not just present
(Examples 9, 10, Kata 1).

</details>

**E2 -- Why freeze time instead of waiting real milliseconds? Why not just sleep?**

<details>
<summary>Model answer</summary>

Real waits couple suite speed and reliability to machine load: a 50ms margin passes locally
and flakes on busy CI. Fake clocks make delays cost zero wall time and settle deterministically
-- at the price of the frozen-clock rules (fireEvent, no waitFor, restore after). Sleep is
honest only when the delay itself is the subject (Examples 35, 75, Kata 4).

</details>

**E3 -- Why replace a module instead of the network? Why not mock `fetch` globally?**

<details>
<summary>Model answer</summary>

Module mocks keep the seam where the code already has one: the import. A global `fetch` mock
reaches past every module boundary and couples unrelated suites to one shared double, while
an injected fetcher or a module factory scopes the double to the test that needs it.
`fetch` itself is still mocked at the seam when the unit genuinely owns HTTP (Examples 30,
32, Kata 2).

</details>

**E4 -- Why keep a snapshot instead of asserting every field? Why not pin everything by hand?**

<details>
<summary>Model answer</summary>

Hand-written assertions on a 400-line stable document cost more to write than to read, and
rot faster than the document evolves: the snapshot diff IS the review. But snapshots of
styled markup invert the trade -- the tree churns while behavior holds, so every cosmetic
change demands review attention for zero signal. Snapshot stable documents; assert volatile
markup (Examples 45, 50, 52).

</details>

**E5 -- Why enforce a coverage floor in the build? Why not just read the table sometimes?**

<details>
<summary>Model answer</summary>

A table nobody gates on drifts: coverage erodes one uncovered line at a time and nobody
notices until the number is embarrassing. A floor turns erosion into a red build the day it
happens, when the missing test is still obvious. The floor does not prove correctness -- it
protects the count the team already earned (Examples 58, 61).

</details>

**E6 -- Why reproduce a flake before fixing it? Why not just add a longer sleep?**

<details>
<summary>Model answer</summary>

A longer sleep treats every flake as a bad wait, and it works -- until the machine gets
slower than the new margin, or the flake was a real race that longer sleeps merely hide.
Reproducing first distinguishes the two: bad waits get proper async queries, races get fixed
code. Sleep is a sedative, not a diagnosis (Examples 71, 74, Kata 7).

</details>
