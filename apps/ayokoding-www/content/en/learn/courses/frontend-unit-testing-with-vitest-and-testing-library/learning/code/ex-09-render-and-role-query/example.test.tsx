// @vitest-environment jsdom
// => This pragma gives THIS file a browser-like DOM: no real browser runs.
// => Pragma beats config files here: each example declares its own world.
// => Node-only examples skip the pragma and stay in the faster node env.

import { afterEach, expect, test } from "vitest";
// => afterEach joins the imports: isolation hooks are part of every UI file.

import { cleanup, render, screen } from "@testing-library/react";
// => render mounts into document.body; screen queries from the same root.
// => cleanup unmounts after each case so renders never leak across cases.

import "@testing-library/jest-dom/vitest";
// => The vitest entry registers DOM matchers like toBeInTheDocument.
// => Without this import, toBeInTheDocument is an unknown matcher error.

import React from "react";
// => React in scope for the JSX below: the test renders real elements.

import { PressButton } from "./button";
// => The subject arrives by relative import: the unit is self-contained.
// => No path aliases: a reader can resolve this import without a tsconfig.

afterEach(() => {
  cleanup();
  // => Unmount after every case: two renders must never share one document.
  // => RTL would auto-clean only with globals on; explicit beats magical.
});

test("finds the button by its role and name", async () => {
  // => The case name states the query strategy, not the component internals.
  let pressed = 0;
  // => Local mutable flag: the simplest observable effect a click can have.
  render(
    <PressButton
      label="Save"
      onPress={() => {
        pressed += 1;
      }}
    />,
  );
  // => render mounts into a detached DOM node appended to document.body.
  // => The label prop doubles as the accessible name the query will use.
  const button = screen.getByRole("button", { name: "Save" });
  // => getByRole queries the accessibility tree, exactly like assistive tech.
  // => The name option disambiguates when several buttons share one page.
  // => getBy* throws when missing: absence is loud, never a silent null.
  expect(button).toBeInTheDocument();
  // => toBeInTheDocument asserts attachment to the rendered document body.
  // => A detached node would fail here: rendering is part of the claim.
  expect(pressed).toBe(0);
  // => Nothing pressed yet: rendering alone must never trigger behavior.
});
