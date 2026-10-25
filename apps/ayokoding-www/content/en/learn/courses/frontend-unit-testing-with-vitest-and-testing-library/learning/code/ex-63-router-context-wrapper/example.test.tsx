// @vitest-environment jsdom
// => DOM pragma: link attributes render into the document for asserting.

import { afterEach, expect, test } from "vitest";
// => Runner pair unchanged: routing context is composition, not new API.

import { cleanup, render, screen } from "@testing-library/react";
// => Link roles locate both nav items; attributes pin the active one.

import "@testing-library/jest-dom/vitest";
// => toHaveAttribute reads aria-current: the accessibility contract.

import React from "react";
// => JSX composes the route provider around the link under test.

import { NavLink, RouteProvider } from "./routing";
// => Provider plus link: the wrapper test needs both halves of the pattern.

afterEach(() => {
  cleanup();
  // => Isolation hook: route context must not leak between path cases.
});

// => Custom render for routes: path in, provider wrapped, links mounted.
function renderAtPath(ui: React.ReactElement, path: string): void {
  // => Custom render for routes: path in, provider wrapped, links mounted.
  // => Route as a string argument: no router, no history object, no navigation.
  // => Route as a string argument: no router, no history object, no navigation.
  render(<RouteProvider path={path}>{ui}</RouteProvider>);
}

// => Active case: current path equals the link target exactly.
test("marks the link matching the current path", async () => {
  // => Active case: current path equals the link target exactly.
  // => Path and target agree: aria-current must appear on this link.
  renderAtPath(<NavLink to="/orders" label="Orders" />, "/orders");
  // => Path and target agree: aria-current must appear on this link.
  expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute(
    "aria-current", // => Attribute name asserted: the accessible announcement, not just styling.
    "page",
  );
  // => Active announcement pinned: assistive tech learns the location too.
});

// => Inactive case: different path, no aria-current, link still works.
test("leaves other links unmarked", async () => {
  // => Inactive case: different path, no aria-current, link still works.
  renderAtPath(<NavLink to="/orders" label="Orders" />, "/settings");
  // => Path differs: the link renders plainly with its href intact.
  expect(screen.getByRole("link", { name: "Orders" })).not.toHaveAttribute("aria-current");
  // => Absence asserted: active styling must not leak across routes.
  // => Both cases together prove the exact-match rule from both sides.
  // => Case closes: both directions proved, exact-match rule pinned.
});
