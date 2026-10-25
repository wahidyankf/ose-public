// @vitest-environment jsdom
// => DOM pragma: the badge renders into a document before serializing.

import { afterEach, expect, test } from "vitest";
// => Runner pair unchanged: snapshots are matchers, not runner features.

import { cleanup, render } from "@testing-library/react";
// => No screen needed: the snapshot captures the container directly.

import React from "react";
// => JSX renders the badge: the snapshot subject, one element small.

import { Badge } from "./badge";
// => Subject by relative import: markup and spec stay in separate files.

afterEach(() => {
  cleanup();
  // => Isolation hook: mounted badges must not leak into later snapshots.
});

test("badge markup matches the committed snapshot", async () => {
  // => Case name states the contract: committed bytes, not fresh rendering.
  const { container } = render(<Badge count={3} />);
  // => container is the mount root: snapshots capture from here downward.
  // => Fixed prop value: snapshots pin ONE instance, never a moving target.
  expect(container.firstChild).toMatchSnapshot();
  // => firstChild skips the wrapper div: the snapshot holds only the badge.
  // => First run WRITES the .snap file; later runs COMPARE against it.
  // => The committed .snap file ships with the course: compare-only in CI.
});
