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
