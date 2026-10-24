// @vitest-environment jsdom
// => DOM pragma: themed badges render variant classes into the document.

import { afterEach, expect, test } from "vitest";
// => Runner pair unchanged: providers are composition, not runner features.

import { cleanup, render, screen } from "@testing-library/react";
// => Base render plus screen: the custom wrapper below builds on both.

import "@testing-library/jest-dom/vitest";
// => toHaveClass pins the variant class each theme must produce.

import React from "react";
// => JSX composes providers and subjects: wrapper pattern needs both layers.

import { Theme, ThemedBadge, ThemeProvider } from "./theme";
// => Provider, hook types, and consumer arrive by relative import.

afterEach(() => {
  cleanup();
  // => Isolation hook: themed mounts unmount like any other render.
});

// => Custom render: mounts any UI inside the chosen theme provider.
function renderThemed(ui: React.ReactElement, theme: Theme): void {
  // => Custom render: mounts any UI inside the chosen theme provider.
  // => Two lines that remove provider boilerplate from every themed test.
  // => Children pass through untouched: the wrapper adds context only.
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
  // => Children pass through untouched: the wrapper adds context only.
}

test("dark theme renders the dark badge", async () => {
  // => Variant one: dark provider, dark class, no prop drilling in the test.
  renderThemed(<ThemedBadge />, "dark");
  // => Theme as an argument: each variant gets its own explicit case.
  expect(screen.getByText("New")).toHaveClass("badge-dark");
  // => Class pinned: the theme flowed from wrapper through hook to markup.
});

test("light theme renders the light badge", async () => {
  // => Variant two: the default path, tested explicitly rather than assumed.
  renderThemed(<ThemedBadge />, "light");
  // => Same component, different wrapper argument: matrix testing, minimally.
  expect(screen.getByText("New")).toHaveClass("badge-light");
  // => Light class pinned: both variants now have a regression guard.
});
