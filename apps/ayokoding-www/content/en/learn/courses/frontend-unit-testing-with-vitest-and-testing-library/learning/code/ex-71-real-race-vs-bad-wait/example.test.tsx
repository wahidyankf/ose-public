// @vitest-environment jsdom
// => DOM pragma: the username arrives late; the query must wait properly.

import { afterEach, expect, test, vi } from "vitest";
// => vi stubs fetch: the late response resolves from fixture bytes.

import { cleanup, render, screen } from "@testing-library/react";
// => findByRole is the diagnosis: waiting on the DOM, not on the clock.

import "@testing-library/jest-dom/vitest";
// => toBeInTheDocument asserts the awaited name once it truly arrives.

import React, { useEffect, useState } from "react";
// => Effect fetches on mount: the async source the bad wait would outrun.

// => Isolation hook: late responses must not arrive in the next case.
afterEach(() => {
  cleanup();
  // => Isolation hook: late responses must not arrive in the next case.
  vi.unstubAllGlobals();
  // => Restore fetch: stub lifetime matches the case, never longer.
  // => Hook closes: fetch stub lifetime matches the case, never longer.
});

// => Subject: blank first, username after the stubbed fetch lands.
function Profile(): React.JSX.Element {
  // => Local subject: blank first, username after the stubbed fetch lands.
  // => Null start: the fixed version below waits for this to become Sari.
  const [name, setName] = useState<string | null>(null);
  // => Null start: the fixed version below waits for this to become Sari.
  // => Mount effect: fetches on mount, the async source the bad wait would outrun.
  useEffect(() => {
    void fetch("/api/me")
      .then((r) => r.json())
      .then((data) => setName((data as { name: string }).name));
    // => Once per mount: one fetch, one transition, no refires.
  }, []);
  // => Loading text first: the bad wait below reads THIS and fails honestly.
  return <p>{name === null ? "loading" : name}</p>;
  // => Loading text first: the bad wait below reads THIS and fails honestly.
}

// => Fixed version: the query waits on the DOM event the fetch produces.
test("findBy waits for the name instead of racing it", async () => {
  // => Fixed version: the query waits on the DOM event the fetch produces.
  // => Immediate stubbed answer: still async, still needs waiting, just fast.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ name: "Sari" }), {
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  // => Immediate stubbed answer: still async, still needs waiting, just fast.
  // => Mount fires the effect: loading renders, fetch promise pending.
  render(<Profile />);
  // => Mount fires the effect: loading renders, fetch promise pending.
  // BAD WAIT (illustration, do not commit): getByText('Sari') right here
  // reads the loading state and fails whenever the fetch loses the race.
  // A fixed sleep(50) passes locally and fails on loaded CI: luck, not sync.
  const name = await screen.findByText("Sari");
  // => findBy polls the live DOM: resolves exactly when the name renders.
  // => Waiting on the EVENT (render) instead of the CLOCK (sleep): the fix.
  expect(name).toBeInTheDocument();
  // => Awaited element asserted: deterministic on any machine, any load.
});
