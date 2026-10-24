// @vitest-environment jsdom
// => DOM pragma: text queries scan rendered text nodes in the document.

import { afterEach, expect, test } from "vitest";
// => Runner imports unchanged for the tenth time: consistency is the point.

import { cleanup, render, screen } from "@testing-library/react";
// => The lower-priority queries live on the same screen object, same import.

import "@testing-library/jest-dom/vitest";
// => toHaveDisplayValue and friends come from the jest-dom registration.

import React from "react";
// => JSX renders a receipt: a total line plus a prefilled promo field.

afterEach(() => {
  cleanup();
  // => Isolation hook: identical in every UI file, no exceptions made.
});

test("text queries read what the user reads", async () => {
  // => getByText matches rendered strings: the user's view, not the markup.
  render(
    <section>
      {/* => section groups the receipt so within() could scope it later. */}
      {/* => Grouping also names the region if an aria-label gets added. */}
      <p>Total: $30</p>
      {/* => Plain paragraph text: no role, so role queries cannot reach it. */}
      {/* => Static copy like totals is the honest home of text queries. */}
      <input defaultValue="SAVE10" placeholder="Promo code" aria-label="Promo" />
      {/* => aria-label gives the role query a hook; value gives display query. */}
      {/* => placeholder is decorative here: the label carries accessibility. */}
      {/* => Three attributes, three query tiers, one input: priority visible. */}
    </section>,
    // => section closes: static copy plus one field, three tiers to compare.
  );
  // => One receipt fragment exercises three query tiers at once.
  // => Same assertion target reached three ways: the priority lesson live.
  expect(screen.getByText("Total: $30")).toBeInTheDocument();
  // => getByText normalizes whitespace: layout changes rarely break it.
  // => Exact strings still couple to copy; prefer roles for interactive parts.
  // => Static totals change rarely: text queries cost little here.
  expect(screen.getByPlaceholderText("Promo code")).toHaveDisplayValue(
    "SAVE10",
    // => Expected value argument: display value asserted in the same call.
  );
  // => Placeholder query finds the field; display value asserts its content.
  // => Placeholder-as-label would fail Example 11's query: this one is extra.
  // => Extra, not primary: the role query below is the one to keep.
  expect(
    screen.getByRole("textbox", { name: "Promo" }),
    // => Role plus accessible name: the highest-priority hook on this field.
  ).toHaveDisplayValue("SAVE10");
  // => The same field via its role: higher priority, same assertion passes.
  // => Showing both side by side teaches the priority order concretely.
  // => Review rule: new tests should reach for the role form first.
});
