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
