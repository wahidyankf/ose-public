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
