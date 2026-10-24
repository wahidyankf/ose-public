// @vitest-environment jsdom
// => DOM pragma: the light tag renders its own variant class separately.

import { afterEach, expect, test } from "vitest";
// => Full runner trio: this file's cases exercise the light theme only.

import { cleanup, render, screen } from "./test-utils";
// => Same single-source imports: both files share the wrapper, zero drift.

import "@testing-library/jest-dom/vitest";
// => toHaveClass pins the light variant: explicit argument, explicit class.

import React from "react";
// => JSX renders the tag: the provider composition happens inside the wrapper.

// => Both halves imported together: consumer plus provider for the override.
import { ThemedTag, ThemeProvider } from "./theme";
// => Both halves imported together: consumer plus provider for the override.

afterEach(() => {
  cleanup();
  // => Isolation hook: second file, same discipline, no shared documents.
});

// => Override claim: explicit provider beats the wrapper default, provably.
test("explicit light provider renders the light tag", async () => {
  // => Override claim: explicit provider beats the wrapper default, provably.
  // => Explicit composition for the exception: defaults serve the common case.
  render(
    <ThemeProvider theme="light">
      {/* => Tag under the explicit light provider: the override path under test. */}
      <ThemedTag />
    </ThemeProvider>,
  );
  // => Explicit composition for the exception: defaults serve the common case.
  // => Light class pinned: override path tested, default path covered by twin.
  expect(screen.getByText("v1")).toHaveClass("tag-light");
  // => Light class pinned: override path tested, default path covered by twin.
});
