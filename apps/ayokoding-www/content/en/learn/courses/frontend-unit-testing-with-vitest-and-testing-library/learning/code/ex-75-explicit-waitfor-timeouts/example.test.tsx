// @vitest-environment jsdom
// => DOM pragma: the slow value renders into a document paragraph.

import { afterEach, expect, test } from "vitest";
// => No fake clock: waitFor advances only on the real scheduler.

import { cleanup, render, screen, waitFor } from "@testing-library/react";
// => waitFor with options: timeout and interval stated, never defaulted.

import "@testing-library/jest-dom/vitest";
// => toHaveTextContent reads the paragraph inside the retried closure.

import React, { useEffect, useState } from "react";
// => Effect plus state: the value arrives after a 100ms real delay.

// => Isolation hook: slow timers and mounts reset between cases.
afterEach(() => {
  cleanup();
  // => Unmount: the slow timer dies with the component, no leakage.
  // => Hook closes: real-clock waits need no restore, only unmount.
});

// => Subject: placeholder first, value after a 100ms real delay.
function SlowValue(): React.JSX.Element {
  // => Local subject: placeholder first, value after a 100ms real delay.
  // => Placeholder text: the wait below must observe a genuine transition.
  const [value, setValue] = useState("warming up");
  // => Placeholder text: the wait below must observe a genuine transition.
  useEffect(() => {
    const id = setTimeout(() => setValue("ready"), 100);
    // => 100ms delay: inside the 500ms budget, past a hasty zero-wait read.
    return () => clearTimeout(id);
  }, []);
  return <p>{value}</p>;
  // => Render output: the paragraph text is what the polls read.
}

// => Patience claim: 500ms covers the 100ms delay with margin.
test("explicit timeout tolerates the slow reveal", async () => {
  // => Patience claim: 500ms timeout covers the 100ms delay with margin.
  // => Real clock: waitFor and setTimeout share wall time, so nothing hangs.
  render(<SlowValue />);
  // => Mount starts the countdown: placeholder renders synchronously first.
  await waitFor(
    () => {
      // => Retried closure: re-queries the live DOM on every poll attempt.
      expect(screen.getByText("ready")).toBeInTheDocument();
    },
    { timeout: 500, interval: 50 },
    // => Explicit budget: 500ms ceiling, 50ms polls, both reviewed numbers.
    // => Defaults (1000/50) would also pass: explicit states the tolerance.
  );
  // => Resolved wait: the text appeared inside budget, margin to spare.
  // => A 600ms delay would fail HERE with a clear timeout message, by design.
});
