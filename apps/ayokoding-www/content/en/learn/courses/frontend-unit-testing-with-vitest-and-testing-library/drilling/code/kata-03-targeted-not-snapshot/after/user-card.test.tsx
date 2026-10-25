// @vitest-environment jsdom
// => DOM pragma: the card renders into a document.

import { expect, test } from "vitest";
// => Two assertions: exactly the user-visible facts, nothing else.

import { render, screen } from "@testing-library/react";
// => AFTER style: role and text queries replace the whole-tree record.

import "@testing-library/jest-dom/vitest";
// => Matchers: heading level and text assertions.

import { UserCard } from "./user-card";
// => Subject: unchanged component, rewritten promises.

test("after: name heading and role text carry the contract", () => {
  // => Target: a class rename stays green, a lost name goes red.
  render(<UserCard name="siti" role="Maintainer" />);
  // => Mount: same props, queries instead of recording.
  expect(screen.getByRole("heading", { name: "siti" })).toBeInTheDocument();
  // => Name contract: heading level plus text, the accessible promise.
  expect(screen.getByText("Maintainer")).toBeInTheDocument();
  // => Role contract: visible text, independent of markup.
});
