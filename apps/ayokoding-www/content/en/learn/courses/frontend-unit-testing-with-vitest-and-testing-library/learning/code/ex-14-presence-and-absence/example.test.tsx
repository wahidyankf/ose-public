// @vitest-environment jsdom
// => DOM pragma: absence assertions still need a document to search.

import { afterEach, expect, test } from "vitest";
// => Same runner imports: the getBy/queryBy split is a library concern.

import { cleanup, render, screen } from "@testing-library/react";
// => Both variants live on screen: one import covers presence and absence.

import "@testing-library/jest-dom/vitest";
// => toBeInTheDocument makes null-vs-element assertions read naturally.

import React from "react";
// => JSX renders a conditional banner: shown only when an error exists.

afterEach(() => {
  cleanup();
  // => Isolation hook: absence tests especially need a pristine document.
});

function Banner({ error }: { error: string | null }): React.JSX.Element | null {
  // => The subject renders nothing for null: absence is a designed state.
  // => Returning null is legitimate UI: the test must assert it deliberately.
  if (error === null) return null;
  // => Early return keeps the error path visually separate from the markup.
  return <p role="alert">{error}</p>;
  // => role alert announces errors assertively: the role is the test hook.
}

test("shows the banner when an error exists", async () => {
  // => Presence case: getBy* throws if the banner is missing, failing loudly.
  render(<Banner error="Card declined" />);
  // => Non-null error prop takes the rendering branch, not the early return.
  expect(screen.getByRole("alert")).toHaveTextContent("Card declined");
  // => getByRole plus text content: role finds it, text pins the message.
});

test("shows no banner when there is no error", async () => {
  // => Absence case: queryBy* returns null, and the assertion checks null.
  render(<Banner error={null} />);
  // => Null prop takes the early return: document.body stays banner-free.
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  // => queryBy never throws: the assertion, not the query, decides pass.
  // => Using getBy here would throw inside the query, hiding the real claim.
  expect(() => screen.getByRole("alert")).toThrow(/Unable to find/);
  // => The throwing behavior itself is pinnable: getBy documents its demand.
  // => This line teaches what absence looks like when the wrong query runs.
});
