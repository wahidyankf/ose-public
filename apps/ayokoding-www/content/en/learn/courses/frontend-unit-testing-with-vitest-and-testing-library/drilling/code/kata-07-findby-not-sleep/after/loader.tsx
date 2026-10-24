// => KATA 07 target: identical loader, polled assertion.
// => Production code unchanged: the wait moves from sleep to query.
import { useEffect, useState } from "react";
// => Effect plus state: fetch on mount, names after.

// => GreetLoader: loading text, then one greeting line.
export function GreetLoader({ load }: { load: () => Promise<string> }): React.JSX.Element {
  // => Injected loader: the after-suite drives the same 80ms promise.
  const [greeting, setGreeting] = useState<string | null>(null);
  // => Null means pending: findBy replaces the placeholder it polls.
  useEffect(() => {
    load().then(setGreeting);
    // => Settle writes state: the retried query observes it.
  }, [load]);
  if (greeting === null) return <p>Loading…</p>;
  // => Placeholder: polled away, never slept through.
  return <p>{greeting}</p>;
  // => Settled line: the findBy target.
}
