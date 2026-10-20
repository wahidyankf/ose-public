// @vitest-environment jsdom
// => DOM pragma: the delayed greeting renders into the document late.

import { afterEach, expect, test, vi } from "vitest";
// => vi drives the fake clock the delayed render waits on.

import { cleanup, render, screen } from "@testing-library/react";
// => findByRole lives on screen: query plus wait in one call.

import "@testing-library/jest-dom/vitest";
// => toBeInTheDocument confirms the awaited element truly arrived.

import React, { useEffect, useState } from "react";
// => Effect plus state: the greeting appears after a 100ms fake delay.

afterEach(() => {
  cleanup();
  // => Unmount: pending delayed renders must not arrive in the next case.
  vi.useRealTimers();
  // => Restore timers: findBy polling must use real time elsewhere.
});

// => Subject: empty first, greeting after a 100ms fake delay.
function DelayedGreeting(): React.JSX.Element {
  // => Local subject: empty first, greeting after a short fake delay.
  const [ready, setReady] = useState(false);
  // => Not ready initially: the query below must genuinely wait.
  useEffect(() => {
    // => Mount effect schedules the reveal: the async behavior under test.
    const id = setTimeout(() => setReady(true), 100);
    // => 100ms delay: short enough to be polite, long enough to need waiting.
    return () => clearTimeout(id);
  }, []);
  return <div>{ready ? <p role="status">Welcome back!</p> : null}</div>;
  // => status role announces politely: the query hook and the a11y win.
}

test("findByRole resolves when the greeting renders", async () => {
  // => The async assertion claim: poll, resolve, no arbitrary sleeps anywhere.
  render(<DelayedGreeting />);
  // => Mount starts the 100ms countdown: nothing rendered yet.
  const greeting = await screen.findByRole("status");
  // => findBy polls until the element appears: waiting on the DOM, not the clock.
  // => No name option: live-region roles take no accessible name from content.
  // => Real 100ms delay against the 1000ms default budget: ten times headroom.
  expect(greeting).toHaveTextContent("Welcome back!");
  // => Text asserted separately: role locates, content confirms, both proved.
  // => Status is the live-region role: the TEXT above names the message.
  // => Case closes: polling resolved the greeting with no fixed sleep.
});
