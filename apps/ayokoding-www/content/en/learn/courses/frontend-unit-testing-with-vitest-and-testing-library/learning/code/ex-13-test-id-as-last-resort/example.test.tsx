// @vitest-environment jsdom
// => DOM pragma: even last-resort queries need a document to scan.

import { afterEach, expect, test } from "vitest";
// => Runner surface unchanged: only the query strategy is new here.

import { cleanup, render, screen } from "@testing-library/react";
// => getByTestId is on screen too: same import, deliberately weaker query.

import "@testing-library/jest-dom/vitest";
// => toHaveTextContent asserts inside the located canvas node below.

import React from "react";
// => JSX renders a canvas chart with a text fallback for assistive tech.

afterEach(() => {
  cleanup();
  // => Isolation hook, repeated verbatim: the course never skips it.
});

test("canvas content is reachable only by test id", async () => {
  // => Canvas pixels carry no semantics: no role query can ever find data.
  render(
    <figure>
      {/* => figure groups the visual with its accessible fallback text. */}
      {/* => Grouping tells assistive tech the caption describes the canvas. */}
      <canvas data-testid="revenue-chart" aria-label="Revenue chart" />
      {/* => data-testid is invisible to users: it changes nothing announced. */}
      {/* => The aria-label names the canvas; the fallback text carries data. */}
      {/* => Both present: the name for context, the caption for the numbers. */}
      <figcaption>Revenue up 12 percent</figcaption>
      {/* => figcaption IS queryable by text: prefer it whenever it exists. */}
      {/* => Captions serve every user: sighted, blind, and search engines alike. */}
    </figure>,
    // => figure closes: visual plus fallback, the complete honest pattern.
  );
  // => Chart plus fallback: the honest pattern for non-DOM visuals.
  // => Honest means two assertions: presence of canvas, content of fallback.
  const chart = screen.getByTestId("revenue-chart");
  // => getByTestId matches the attribute exactly: powerful and meaningless.
  // => Reach for it only after role, label, text, and display value fail.
  // => The attribute is test-only: users never see it, readers never hear it.
  expect(chart).toBeInTheDocument();
  // => Presence is all a test id proves: pair it with the fallback assertion.
  // => Alone this line passes while the chart shows stale data: always pair.
  expect(screen.getByText("Revenue up 12 percent")).toBeInTheDocument();
  // => The text fallback is what users get: assert it alongside the canvas.
  // => If the fallback ever disappears, this line fails while test id passes.
  // => The pair is the contract: visual exists AND its meaning is announced.
});
