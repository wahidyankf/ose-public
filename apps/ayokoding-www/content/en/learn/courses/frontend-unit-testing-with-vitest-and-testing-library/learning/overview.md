---
title: "Overview"
date: 2026-10-20T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior courses**: [Just Enough TypeScript](../../just-enough-typescript/learning/overview.md) --
  every example is TypeScript, and the course assumes you can already read and write typed
  functions, imports, and modules the way that course teaches them;
  [Frontend Essentials](../../frontend-essentials/learning/overview.md) -- every component
  example assumes basic React or component-model concepts (props, state, events) from that course.
- **Tools**: **Node.js 24** with **Vitest 4.1.0**, **Testing Library 16**
  (`@testing-library/react` 16.3.2, `@testing-library/user-event` 14.5.2,
  `@testing-library/dom` 10.4.1), **jsdom 29**, and **React 19**. No example performs a
  real network call; every async case uses fake timers or a local fixture.
- **Assumed knowledge**: running a program and a test suite from the CLI. No prior testing
  background is required -- this course is where that background starts.

## Why this exists -- the big idea

The problem before the solution: `software-testing` and `frontend-essentials` use both tools
incidentally but never teach Vitest's own mocking and coverage model or Testing Library's query
priorities as a dedicated subject -- so teams write tests that pass while the interface stays
broken for real users. The one idea worth keeping if you forget everything else: **query the way
a user would find the element, not by its implementation detail**. Vitest runs the tests fast;
Testing Library keeps them honest about what a user actually sees and does.

## Install and run your first example

Each example is a self-contained directory with its own runnable suite. To follow along locally,
install the toolchain once:

<!-- harness: illustration -->

```sh
npm install vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom react react-dom
```

Then run any example's suite from its directory with `vitest run`.

The harness runs the same command (plus coverage flags where the example teaches coverage) and
compares the output to the recorded **Output** transcript byte-for-byte, twice.

## How this course's examples are organized

78 examples in three tiers, each tier in three clusters. Beginner (Examples 1-25): Vitest basics,
Testing Library queries, user-event interaction. Intermediate (Examples 26-53): mocking modules
and functions, fake timers and async code, snapshots. Advanced (Examples 54-78): coverage and
gaps, custom render wrappers, flaky-test diagnosis.

Every example is heavily annotated at 1.0 to 2.25 comment lines per code line -- comments explain
WHY, not WHAT. Every fence is byte-identical to the file it shows, and every **Output** block is
the genuine captured transcript: there is no fabricated output anywhere in this course.

## Concepts

- **co-01 · test-runner** -- how Vitest discovers, runs, and reports tests.
- **co-02 · query-priority** -- Testing Library's preferred order: role, label text, text, test id.
- **co-03 · render** -- mounting a component into a test DOM.
- **co-04 · user-event** -- simulating a real user interaction, not a raw DOM event.
- **co-05 · mock-function** -- a stand-in that records calls and returns a controlled value.
- **co-06 · module-mock** -- replacing an entire imported module for a test.
- **co-07 · timer-mock** -- controlling fake timers for deterministic async code.
- **co-08 · snapshot** -- a recorded serialization compared on later runs.
- **co-09 · coverage-report** -- lines, branches, and functions a suite exercises.
- **co-10 · test-isolation** -- resetting mocks and DOM state between tests.
- **co-11 · async-assertion** -- waiting for an element or state to appear.
- **co-12 · accessibility-query** -- querying by role and accessible name.
- **co-13 · debug-output** -- printing the current DOM to diagnose a failing query.
- **co-14 · custom-render** -- a render wrapper that injects providers a component needs.
- **co-15 · flaky-test-diagnosis** -- telling a real race condition from a bad wait.
- **co-16 · ci-reporting** -- a machine-readable report for a pipeline.

## References

Version-specific claims verified against the vendors' own documentation, accessed 2026-10-20.
Pinned lab versions that produced every recorded transcript: Vitest 4.1.0
(`@vitest/coverage-v8` 4.1.0), `@testing-library/react` 16.3.2,
`@testing-library/user-event` 14.5.2, `@testing-library/dom` 10.4.1,
`@testing-library/jest-dom` 6.9.1, `jsdom` 29.0.0, `react` and `react-dom` 19.2.6,
`typescript` 5.8.3, Node.js 24.16.0.

- [Vitest](https://vitest.dev/) -- runner, mocks, timers, coverage, and reporting.
- [Testing Library](https://testing-library.com/) -- query priority, `render`, `user-event`, and `waitFor` semantics.
- [jsdom](https://github.com/jsdom/jsdom) -- the DOM implementation tests render into.
- [React](https://react.dev/) -- component model under test (`useState`, `useEffect`, `act`).

## Examples by Level

### Beginner (Examples 1–25)

- [Example 1: First Passing Test](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-1-first-passing-test)
- [Example 2: Grouping with describe](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-2-grouping-with-describe)
- [Example 3: Equality Matchers Compared](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-3-equality-matchers-compared)
- [Example 4: Truthiness and Number Matchers](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-4-truthiness-and-number-matchers)
- [Example 5: Errors and Throws](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-5-errors-and-throws)
- [Example 6: Isolation with beforeEach](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-6-isolation-with-beforeeach)
- [Example 7: Skipping Work in Progress](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-7-skipping-work-in-progress)
- [Example 8: One Behavior per Test](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-8-one-behavior-per-test)
- [Example 9: Render and Role Query](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-9-render-and-role-query)
- [Example 10: Roles and Accessible Names](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-10-roles-and-accessible-names)
- [Example 11: Labels for Form Controls](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-11-labels-for-form-controls)
- [Example 12: Text, Placeholder, and Display Value](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-12-text-placeholder-and-display-value)
- [Example 13: Test ID as Last Resort](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-13-test-id-as-last-resort)
- [Example 14: Presence and Absence](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-14-presence-and-absence)
- [Example 15: Lists and within](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-15-lists-and-within)
- [Example 16: Testing Library DOM without React](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-16-testing-library-dom-without-react)
- [Example 17: Reading Debug Output](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-17-reading-debug-output)
- [Example 18: Clicking a Button](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-18-clicking-a-button)
- [Example 19: Typing into Inputs](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-19-typing-into-inputs)
- [Example 20: Selecting Options](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-20-selecting-options)
- [Example 21: Checkboxes and Radios](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-21-checkboxes-and-radios)
- [Example 22: Submitting a Form](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-22-submitting-a-form)
- [Example 23: Hover Reveals Tooltip](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-23-hover-reveals-tooltip)
- [Example 24: Uploading a File](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-24-uploading-a-file)
- [Example 25: user-event versus fireEvent](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/beginner#example-25-user-event-versus-fireevent)

### Intermediate (Examples 26–53)

- [Example 26: Recording Calls with vi.fn](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-26-recording-calls-with-vifn)
- [Example 27: Scripted Return Values](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-27-scripted-return-values)
- [Example 28: Implementations and Rejections](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-28-implementations-and-rejections)
- [Example 29: Spying on Real Methods](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-29-spying-on-real-methods)
- [Example 30: Mocking a Whole Module](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-30-mocking-a-whole-module)
- [Example 31: Mocking Part of a Module](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-31-mocking-part-of-a-module)
- [Example 32: Stubbing fetch Itself](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-32-stubbing-fetch-itself)
- [Example 33: Mocking the Clock for Dates](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-33-mocking-the-clock-for-dates)
- [Example 34: Clear, Reset, Restore Matrix](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-34-clear-reset-restore-matrix)
- [Example 35: Fake Timers Control setTimeout](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-35-fake-timers-control-settimeout)
- [Example 36: System Time and Clock Render](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-36-system-time-and-clock-render)
- [Example 37: Debounced Search](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-37-debounced-search)
- [Example 38: findBy Waits for Elements](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-38-findby-waits-for-elements)
- [Example 39: waitFor Assertions](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-39-waitfor-assertions)
- [Example 40: Waiting for Disappearance](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-40-waiting-for-disappearance)
- [Example 41: Awaited User Events Settle](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-41-awaited-user-events-settle)
- [Example 42: Async Timers Together](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-42-async-timers-together)
- [Example 43: Polling Hook with Timers and Fetch](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-43-polling-hook-with-timers-and-fetch)
- [Example 44: Delayed Toast on a Fake Clock](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-44-delayed-toast-on-a-fake-clock)
- [Example 45: First Snapshot](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-45-first-snapshot)
- [Example 46: Inline Snapshots](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-46-inline-snapshots)
- [Example 47: Snapshots of Objects](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-47-snapshots-of-objects)
- [Example 48: Reviewing Snapshot Changes](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-48-reviewing-snapshot-changes)
- [Example 49: Property Matchers in Snapshots](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-49-property-matchers-in-snapshots)
- [Example 50: File Snapshots for Documents](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-50-file-snapshots-for-documents)
- [Example 51: Snapshots of Thrown Errors](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-51-snapshots-of-thrown-errors)
- [Example 52: Snapshots versus Targeted Assertions](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-52-snapshots-versus-targeted-assertions)
- [Example 53: Custom Snapshot Serializers](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/intermediate#example-53-custom-snapshot-serializers)

### Advanced (Examples 54–78)

- [Example 54: Coverage Gap Table](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-54-coverage-gap-table)
- [Example 55: Filling the Gap to Full](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-55-filling-the-gap-to-full)
- [Example 56: Branches versus Lines](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-56-branches-versus-lines)
- [Example 57: Excluding Helper Files](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-57-excluding-helper-files)
- [Example 58: Thresholds That Hold](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-58-thresholds-that-hold)
- [Example 59: Scoping Coverage to Source](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-59-scoping-coverage-to-source)
- [Example 60: What Not to Cover](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-60-what-not-to-cover)
- [Example 61: Coverage Gate Script](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-61-coverage-gate-script)
- [Example 62: Theme Provider Wrapper](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-62-theme-provider-wrapper)
- [Example 63: Router Context Wrapper](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-63-router-context-wrapper)
- [Example 64: i18n Dictionary Wrapper](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-64-i18n-dictionary-wrapper)
- [Example 65: Store Provider and Dispatch](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-65-store-provider-and-dispatch)
- [Example 66: Testing Hooks with renderHook](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-66-testing-hooks-with-renderhook)
- [Example 67: Hook Props and Rerender](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-67-hook-props-and-rerender)
- [Example 68: Scoping Queries with Base Element](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-68-scoping-queries-with-base-element)
- [Example 69: Cleanup between Renders](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-69-cleanup-between-renders)
- [Example 70: Shared test-utils Module](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-70-shared-test-utils-module)
- [Example 71: Real Race versus Bad Wait](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-71-real-race-versus-bad-wait)
- [Example 72: act Warnings Are Flakes](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-72-act-warnings-are-flakes)
- [Example 73: Leaking Fake Timers](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-73-leaking-fake-timers)
- [Example 74: Order-Dependent Shared State](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-74-order-dependent-shared-state)
- [Example 75: Explicit waitFor Timeouts](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-75-explicit-waitfor-timeouts)
- [Example 76: Seeded Randomness](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-76-seeded-randomness)
- [Example 77: Machine-Readable CI Report](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-77-machine-readable-ci-report)
- [Example 78: CI Command Shape](/en/c/learn/courses/frontend-unit-testing-with-vitest-and-testing-library/learning/advanced#example-78-ci-command-shape)
