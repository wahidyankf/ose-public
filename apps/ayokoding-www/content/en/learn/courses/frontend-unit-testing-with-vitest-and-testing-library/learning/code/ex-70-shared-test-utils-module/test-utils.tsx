import React from "react";
// => React for the provider JSX: the utils module composes, never asserts.

import { render } from "@testing-library/react";
// => Base render imported once here: test files below never import it directly.

import { ThemeProvider } from "./theme";
// => Theme provider reused from Example 62's module shape, dark by default.

import type { Theme } from "./theme";
// => Type-only import: the wrapper signature stays typed without runtime cost.

function renderThemed(ui: React.ReactElement, theme: Theme = "dark"): void {
  // => Shared wrapper with a default: dark unless a test says otherwise.
  // => Defaults encode the common case: most tests exercise the dark theme.
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
  // => Provider composition centralized: one place to add the next provider.
}

export * from "@testing-library/react";
// => Re-export everything: screen, fireEvent, within flow through test-utils.
// => Single import source: tests import from './test-utils', never the library.

export { renderThemed as render };
// => Shadow the render export: bare render() calls below are themed automatically.
// => Callers write render(ui) and get providers free: the documented pattern.
