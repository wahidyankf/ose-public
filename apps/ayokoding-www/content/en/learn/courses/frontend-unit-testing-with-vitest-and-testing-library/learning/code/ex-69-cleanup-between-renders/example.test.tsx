// @vitest-environment jsdom
// => DOM pragma: sequential mounts share one document without cleanup.

import { afterEach, expect, test } from "vitest"; // => Runner surface: hooks, assertions, and cases.
// => Runner pair unchanged: cleanup is library hygiene, not runner API.

import { cleanup, render, screen } from "@testing-library/react"; // => Render plus queries: mount, scope, and read the headings.
// => cleanup imported explicitly: this example calls it mid-case, on purpose.

import "@testing-library/jest-dom/vitest"; // => DOM matchers: document presence assertions.
// => toBeInTheDocument asserts each mount's content in its clean window.

import React from "react"; // => JSX runtime: the scenarios render real elements.
// => JSX renders the greeting twice with different names: isolation fixture.

afterEach(() => {
  cleanup();
  // => Habitual hook stays: mid-case cleanup handles the WITHIN-case split.
});

// => Local greeting: one heading, one prop, rendered twice below.
function Hello({ name }: { name: string }): React.JSX.Element {
  // => Local greeting: one heading, one prop, rendered twice below.
  return <h1>Hello, {name}!</h1>; // => Greeting line: the heading the suite queries twice.
}

test("sequential renders stay isolated with cleanup", async () => {
  // => Isolation claim: second mount sees only its own heading, provably.
  render(<Hello name="Sari" />);
  // => First mount: Sari's heading is the only h1 in the document.
  expect(screen.getByRole("heading", { name: "Hello, Sari!" })).toBeInTheDocument();
  // => Asserted before cleanup: the first render's contract, checked in order.
  // => Explicit mid-case cleanup: unmounts Sari before Budi ever renders.
  cleanup(); // => Unmount between renders: the isolation this case proves.
  // => Explicit mid-case cleanup: unmounts Sari before Budi ever renders.
  // => Without this line the next query throws on TWO matching headings.
  render(<Hello name="Budi" />);
  // => Second mount into a pristine document: Budi alone, no Sari residue.
  expect(screen.getByRole("heading", { name: "Hello, Budi!" })).toBeInTheDocument();
  // => Budi found uniquely: isolation proved by the absence of ambiguity.
  expect(screen.queryByRole("heading", { name: "Hello, Sari!" })).not.toBeInTheDocument();
  // => Sari gone: the document holds exactly one greeting, the current one.
});
