// => KATA 07 starting point: the loader resolves, the test sleeps.
// => 200ms of margin for an 80ms load: green, slow, and silently racy.
import { useEffect, useState } from "react";
// => Effect plus state: fetch on mount, names after.

// => GreetLoader: loading text, then one greeting line.
export function GreetLoader({ load }: { load: () => Promise<string> }): React.JSX.Element {
  // => Injected loader: no network, an 80ms deferred promise in the test.
  const [greeting, setGreeting] = useState<string | null>(null);
  // => Null means pending: the loading text owns the first paint.
  useEffect(() => {
    load().then(setGreeting);
    // => Settle writes state: the effect below tests the paint after.
  }, [load]);
  if (greeting === null) return <p>Loading…</p>;
  // => Placeholder: the sleep below must outlast the real 80ms delay.
  return <p>{greeting}</p>;
  // => Settled line: the assertion target after the sleep.
}
