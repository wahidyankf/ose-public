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
