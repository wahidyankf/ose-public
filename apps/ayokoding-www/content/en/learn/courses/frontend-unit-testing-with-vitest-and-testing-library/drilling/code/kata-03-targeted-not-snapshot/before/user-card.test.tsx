// @vitest-environment jsdom
// => DOM pragma: the card renders into a document.

import { expect, test } from "vitest";
// => One assertion: the whole rendered tree, recorded wholesale.

import { render } from "@testing-library/react";
// => No queries: the snapshot needs no element lookup at all.

import "@testing-library/jest-dom/vitest";
// => Matchers: toMatchSnapshot comes from the runner itself.

import { UserCard } from "./user-card";
// => Subject: the card, recorded rather than asserted.

test("before: card matches the recorded tree", () => {
  // => Starting point: green until any markup shifts, signal or not.
  const { container } = render(<UserCard name="siti" role="Maintainer" />);
  // => Full container: every div, class, and node recorded.
  expect(container.firstChild).toMatchSnapshot();
  // => Whole-tree record: a class rename fails this with zero insight.
});
