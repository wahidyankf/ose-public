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
