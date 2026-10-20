// @vitest-environment jsdom
// => DOM pragma: the dark tag renders its variant class into the document.

import { afterEach, expect, test } from "vitest";
// => Runner pair unchanged: the wrapper pattern needs no new runner API.

// => Single-source imports: both files share the wrapper, zero drift.
import { cleanup, render, screen } from "./test-utils";
// => Imports FROM test-utils: render here is the themed shadow, by design.
// => screen flows through the re-export: one import source for the whole file.

import "@testing-library/jest-dom/vitest";
// => toHaveClass pins the dark variant class the default wrapper provides.

import React from "react";
// => JSX renders the tag: the wrapper supplies the dark theme silently.

import { ThemedTag } from "./theme";
// => Consumer import: the tag reads whatever theme the wrapper provides.

afterEach(() => {
  cleanup();
  // => Isolation hook: shared wrappers do not excuse shared documents.
});

test("default wrapper renders the dark tag", async () => {
  // => Default claim: bare render() means dark, asserted, not assumed.
  render(<ThemedTag />);
  // => No theme argument: the wrapper default ('dark') applies invisibly.
  expect(screen.getByText("v1")).toHaveClass("tag-dark");
  // => Dark class pinned: the shadowed render provided the theme correctly.
});
