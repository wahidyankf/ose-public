// @vitest-environment jsdom
// => DOM pragma: the badge renders wrapped, per mode.

import { expect, test } from "vitest";
// => Two assertions: one per theme mode.

import { cleanup, render, screen } from "@testing-library/react";
// => Queries plus cleanup: two mounts need a pristine DOM between them.

import "@testing-library/jest-dom/vitest";
// => Matchers: attribute assertions read cleanly.

import React from "react";
// => JSX runtime: the helper returns an element.

import { Theme, ThemeContext, ThemedBadge } from "./badge";
// => Subject plus context: the helper below wires them together.

// => renderWithTheme: the kata's whole lesson in six lines.
function renderWithTheme(label: string, theme: Theme): void {
  // => Helper signature: label plus mode, nothing else to remember.
  render(
    <ThemeContext.Provider value={theme}>
      {/* => Provider mounted: the piece the before-test forgot. */}
      <ThemedBadge label={label} />
      {/* => Badge inside: context present, no throw. */}
    </ThemeContext.Provider>,
  );
}

test("after: badge renders under both themes", () => {
  // => Target: green in both modes through one helper.
  renderWithTheme("New", "dark");
  // => Dark first: attribute must read dark.
  expect(screen.getByText("New")).toHaveAttribute("data-theme", "dark");
  // => Dark proven: query by text, assert the theme hook.
  cleanup();
  // => Unmount: one badge per DOM, the second render starts clean.
  renderWithTheme("New", "light");
  // => Light second: same label, opposite mode.
  expect(screen.getByText("New")).toHaveAttribute("data-theme", "light");
  // => Light proven: the helper carries the mode, tests stay small.
});
