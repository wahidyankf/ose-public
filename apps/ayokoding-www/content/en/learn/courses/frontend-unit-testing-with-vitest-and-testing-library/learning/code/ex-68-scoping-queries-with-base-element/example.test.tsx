// @vitest-environment jsdom
// => DOM pragma: two dialogs share the word Save; scoping tells them apart.

import { afterEach, expect, test } from "vitest"; // => Runner surface: hooks, assertions, and cases.
// => Runner pair unchanged: scoping is a query operation, not runner API.

import { cleanup, render, screen, within } from "@testing-library/react"; // => Scoped queries: within narrows lookups to one dialog.
// => within scopes to a base element: page-wide duplicates stop mattering.

import "@testing-library/jest-dom/vitest"; // => DOM matchers: document presence assertions.
// => toBeInTheDocument asserts inside the scoped subtree, same as globally.

import React from "react"; // => JSX runtime: the dialogs render side by side.
// => JSX renders two dialogs with identical button text: the scoping fixture.

afterEach(() => {
  cleanup();
  // => Isolation hook: two dialogs unmount, no duplicates leak onward.
});

// => Local dialog: a titled section with its own Save button, twice rendered.
function Dialog({ title }: { title: string }): React.JSX.Element {
  // => Local dialog: a titled section with its own Save button, twice rendered.
  // => Root returns the named section: the scope boundary the test queries first.
  return (
    // => Named section: the scope handle the test queries before scoping inside.
    <section aria-label={title}>
      {/* => Named section: the scope boundary the test queries first. */}
      {/* => Title heading: visible name and scope anchor in one element. */}
      <h2>{title}</h2>
      {/* => Duplicate Save text: page-wide query would fail, scoping fixes it. */}
      <button type="button">Save</button>
      {/* => Identical Save text in both dialogs: page-wide query would fail. */}
    </section>
  );
}

// => Scoping claim: two identical buttons, zero ambiguity, both found.
test("each dialog saves through its own scoped button", async () => {
  // => Scoping claim: two identical buttons, zero ambiguity, both found.
  // => Fragment mounts both dialogs: the duplicate-text trap, set deliberately.
  render(
    <>
      <Dialog title="Billing" />
      <Dialog title="Shipping" />
    </>,
  );
  // => Fragment mounts both dialogs: the duplicate-text trap, set deliberately.
  // => Scope handle one: the Billing region, addressable without touching its button.
  const billing = screen.getByRole("region", { name: "Billing" });
  // => Section plus accessible name exposes the region role: scope handle one.
  // => getByRole for the SCOPE stays global: scopes anchor from the document.
  const shipping = screen.getByRole("region", { name: "Shipping" });
  // => Scope handle two: each dialog addressable without touching its button.
  expect(within(billing).getByRole("button", { name: "Save" })).toBeInTheDocument();
  // => Scoped Save: within() narrows the search to the Billing subtree alone.
  // => Page-wide getByRole would throw on duplicates: scoping is the fix.
  expect(within(shipping).getByRole("button", { name: "Save" })).toBeInTheDocument();
  // => Shipping Save found independently: both dialogs proven interactive.
  // => Composite pages always duplicate words: scope first, query second.
});
