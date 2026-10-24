// @vitest-environment jsdom
// => DOM pragma: the counter text mutates after a promise resolves.

import { afterEach, expect, test, vi } from "vitest";
// => vi stubs fetch: the promise below resolves from fixture bytes.

import { cleanup, render, screen, waitFor } from "@testing-library/react";
// => waitFor joins the imports: retry-until-pass for non-query assertions.

import "@testing-library/jest-dom/vitest";
// => toHaveTextContent reads the count paragraph inside the retried closure.

import React, { useEffect, useState } from "react";
// => Effect fetches the count; state renders it when the promise lands.

afterEach(() => {
  cleanup();
  // => Unmount: settling promises must not write into the next case.
  vi.unstubAllGlobals();
  // => Restore fetch: the stub below is global for this file's cases.
});

// => Subject: loading text first, count after the stubbed promise lands.
function OrderCount(): React.JSX.Element {
  // => Local subject: shows a count fetched once on mount.
  const [count, setCount] = useState<number | null>(null);
  // => Null start: the loading text is the first observable state.
  // => Mount effect: the single fetch whose settlement waitFor observes.
  useEffect(() => {
    // => Mount effect fetches: the stub answers immediately, still async.
    void fetch("/api/count") // => Void marks the floating promise: the effect owns it, lint stays quiet.
      .then((r) => r.json())
      .then((data) => setCount((data as { count: number }).count));
    // => Once per mount: the loading-to-count transition happens exactly once.
  }, []);
  // => Conditional text: placeholder while null, count after — the transition under test.
  return <p>Orders: {count === null ? "loading" : count}</p>;
  // => Loading text first, count after: the transition waitFor observes.
}

// => Retry claim: fails on loading, passes after settle.
test("waitFor retries until the count renders", async () => {
  // => The retry claim: assertion fails on loading, passes after settle.
  // => Stub fetch before mounting: the effect must see the double from its first run.
  vi.stubGlobal(
    "fetch", // => Global name replaced: every module in this file shares the stub.
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ count: 7 }), {
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  // => Immediate stubbed response: still a promise, still needs a retry tick.
  // => Mount fires the effect: loading renders synchronously, promise pending.
  render(<OrderCount />);
  // => Mount fires the effect: loading text renders synchronously first.
  expect(screen.getByText("Orders: loading")).toBeInTheDocument();
  // => Starting state pinned: waitFor below must observe a real transition.
  // => Retry loop: reruns the closure until it stops throwing.
  await waitFor(() => {
    // => The closure reruns until it stops throwing: polling, not sleeping.
    // => Each run re-queries the live DOM: no stale element handles involved.
    expect(screen.getByText("Orders: 7")).toBeInTheDocument();
    // => Closure closes: the retried assertion, polled until the count renders.
  });
  // => Resolves when the count renders: exactly as long as needed, no longer.
  // => Default timeout and interval suit microtask-speed stubbed promises.
  // => Case closes: resolved exactly when the count rendered, no longer.
});
