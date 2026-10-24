// @vitest-environment jsdom
// => DOM pragma: debug output describes a document, so one must exist.

import { afterEach, expect, test } from "vitest";
// => Runner imports unchanged: debugging is a library skill, not new API.

import { prettyDOM } from "@testing-library/dom";
// => prettyDOM RETURNS the formatted DOM string instead of printing it.
// => screen.debug prints the same string: same content, noisier channel.
// => Returning lets the test assert on the dump deterministically.

import { cleanup, render, screen } from "@testing-library/react";
// => render builds the mystery DOM; screen proves what the query sees.

import "@testing-library/jest-dom/vitest";
// => jest-dom matchers assert on the queried node after the dump is read.

import React from "react";
// => JSX renders a button whose name comes from nesting, not plain text.

afterEach(() => {
  cleanup();
  // => Isolation hook: debug examples especially must not leak markup.
});

test("the dump shows the computed accessible name", async () => {
  // => The mystery: where does this button's name come from? Read the dump.
  const { container } = render(
    <button type="button">
      {/* => No text child: the name must come from the nested span. */}
      <span aria-hidden="true">*</span> Save draft
      {/* => aria-hidden star is decorative: hidden from the access tree. */}
      {/* => Visible text after the span forms the real accessible name. */}
    </button>,
  );
  // => container is the mount root: prettyDOM prints from here downward.
  const dump = prettyDOM(container);
  // => The dump shows roles, names, and hidden flags: the query's raw input.
  // => Reading dumps beats guessing selectors: the tree never lies.
  // => prettyDOM output is deterministic text: safe to assert on in tests.
  expect(dump).toContain("Save draft");
  // => The dump contains the name text: proof the name computation worked.
  // => Asserting on the dump pins the lesson: names come from visible text.
  // => The hidden star is absent from the name: exclusion proved too.
  expect(screen.getByRole("button", { name: "Save draft" })).toBeInTheDocument();
  // => The passing query confirms the dump-reading skill on a real lookup.
  // => aria-hidden content correctly stays OUT of the computed name here.
  // => Dump first, query second: diagnose, then verify, in that order.
});
