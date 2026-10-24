// @vitest-environment jsdom
// => DOM pragma: placeholder then greeting render here.

import { expect, test } from "vitest";
// => One assertion: the greeting, found by polling, not by sleeping.

import { render, screen } from "@testing-library/react";
// => AFTER style: findBy polls; no sleep helper, no margin to tune.

import "@testing-library/jest-dom/vitest";
// => Matchers: text presence assertions.

import { GreetLoader } from "./loader";
// => Subject: the same 80ms loader, waited on properly.

test("after: findBy polls until the greeting settles", async () => {
  // => Target: fast on fast machines, patient on loaded ones.
  render(<GreetLoader load={() => new Promise((r) => setTimeout(() => r("halo"), 80))} />);
  // => Mount: same deferred greeting, no sleep anywhere.
  expect(await screen.findByText("halo")).toBeInTheDocument();
  // => Polled read: resolves the moment the state lands, waits only if needed.
});
