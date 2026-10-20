// @vitest-environment jsdom
// => DOM pragma: both assertion styles below query the same rendered card.

import { afterEach, expect, test } from "vitest";
// => Runner pair unchanged: the lesson contrasts matchers, not runners.

import { cleanup, render, screen } from "@testing-library/react";
// => Container for the snapshot style; screen for the targeted style.

import "@testing-library/jest-dom/vitest";
// => toHaveTextContent and class assertions power the targeted style.

import React from "react";
// => JSX renders the profile card once: both styles share the markup.

import { Profile } from "./profile";
// => One subject, two verdicts: the comparison stays perfectly controlled.

afterEach(() => {
  cleanup();
  // => Isolation hook: the card unmounts before the next style runs.
});

test("full-DOM snapshot breaks on any change", async () => {
  // => Snapshot style: maximum coverage, maximum fragility, one matcher.
  const { container } = render(<Profile name="Sari" role="Cashier" />);
  // => Render the card: classes, heading, paragraph, all serialized together.
  expect(container.firstChild).toMatchSnapshot();
  // => Freezes everything: a class rename fails this test with zero meaning.
  // => Review load: every styling tweak demands a snapshot blessing ritual.
});

test("targeted assertions break only on meaning", async () => {
  // => Targeted style: three claims, each failing only for a real regression.
  render(<Profile name="Sari" role="Cashier" />);
  // => Same markup, different contract: content pinned, styling ignored.
  expect(screen.getByRole("heading", { name: "Sari" })).toBeInTheDocument();
  // => Name by role: survives class renames, fails on name regressions.
  expect(screen.getByText("Cashier")).toBeInTheDocument();
  // => Role text pinned: content change fails, wrapper change passes.
  expect(screen.getByRole("article")).toHaveClass("card");
  // => One structural class asserted deliberately: the rest may churn freely.
  // => toHaveClass on the landmark: layout contract stated, not snapshotted.
});
