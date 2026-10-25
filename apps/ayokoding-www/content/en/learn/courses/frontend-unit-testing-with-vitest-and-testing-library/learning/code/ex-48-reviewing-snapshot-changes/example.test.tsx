// @vitest-environment jsdom
// => DOM pragma: the reviewed alert renders before serializing.

import { afterEach, expect, test } from "vitest";
// => Runner pair unchanged: review workflow is process, not new API.

import { cleanup, render } from "@testing-library/react";
// => Container capture again: snapshots serialize the mount root's child.

import React from "react";
// => JSX renders the warning variant: the intentionally changed markup.

import { Alert } from "./alert";
// => Subject import: the reviewed component, post-redesign version.

afterEach(() => {
  cleanup();
  // => Isolation hook: reviewed markup must not leak into other snapshots.
});

test("warning alert matches the reviewed snapshot", async () => {
  // => Case name says REVIEWED: a human blessed these bytes after the diff.
  const { container } = render(<Alert tone="warning" message="Stock low" />);
  // => Warning variant rendered: data-tone plus message, the new contract.
  expect(container.firstChild).toMatchSnapshot();
  // => Compares against the committed file: passes only after review + -u.
  // => Workflow: change markup, watch this fail, READ the diff, then update.
  // => Blind -u approves everything: the diff reading is the actual review.
});
