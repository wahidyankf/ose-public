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
