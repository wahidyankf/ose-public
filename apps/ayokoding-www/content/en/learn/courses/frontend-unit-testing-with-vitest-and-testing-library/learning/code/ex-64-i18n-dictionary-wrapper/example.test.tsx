// @vitest-environment jsdom
// => DOM pragma: translated headings render into the document per locale.

import { afterEach, expect, test } from "vitest";
// => Runner pair unchanged: locales are data, not new test API.

import { cleanup, render, screen } from "@testing-library/react";
// => Heading role finds the greeting in whichever language the dict speaks.

import "@testing-library/jest-dom/vitest";
// => toBeInTheDocument asserts each locale's heading actually rendered.

import React from "react";
// => JSX composes the dictionary provider around the greeting.

import { Dict, Greeting, I18nProvider } from "./i18n";
// => Dictionary type plus provider plus consumer: the full pattern imported.

afterEach(() => {
  cleanup();
  // => Isolation hook: locale dictionaries reset with every unmount.
});

// => Custom render for i18n: dictionary in, translated UI out.
function renderWithDict(ui: React.ReactElement, dict: Dict): void {
  // => Custom render for i18n: dictionary in, translated UI out.
  // => Dict as data keeps the test free of translation-framework machinery.
  // => Dict as data keeps the test free of translation-framework machinery.
  render(<I18nProvider dict={dict}>{ui}</I18nProvider>);
}

test("renders the Indonesian greeting", async () => {
  // => Locale one: the dictionary supplies Halo, the test expects Halo.
  renderWithDict(<Greeting />, { hello: "Halo" });
  // => Minimal dict: one key is enough to prove the lookup path works.
  expect(screen.getByRole("heading", { name: "Halo" })).toBeInTheDocument();
  // => Role plus translated name: queries work in every language identically.
});

test("missing keys fall back visibly", async () => {
  // => Gap case: empty dict renders the fallback, never a blank heading.
  renderWithDict(<Greeting />, {});
  // => Empty dictionary: the fallback branch, the one translators forget.
  expect(screen.getByRole("heading", { name: "hello?" })).toBeInTheDocument();
  // => Visible fallback pinned: missing copy is a test failure, not silence.
  // => Both cases together prove lookup AND the missing-key contract.
});
