// Example 22: useEffect Cleanup Runs Before Re-run and Unmount. (co-18)
//
// When an effect re-runs (because its deps changed) or the component unmounts, React runs the
// PREVIOUS effect's cleanup FIRST, with the OLD values, before running the new setup with the new
// values. Cleanup is where you tear down what setup built (remove a listener, clear a timer).
//
// Note: "React will first run the cleanup ... with the old values, and then run
// your setup ... with the new values." Source: react.dev, useEffect
// (https://react.dev/reference/react/useEffect).

// The trace of setup/cleanup events, in the order React fires them.
const trace: string[] = []; // => pushes mirror React's actual commit-time ordering
// => the ordering here IS the guarantee: cleanup-before-setup on every re-run

// makeEffect returns a pair React would call: setup and the cleanup it returned.
function makeEffect(id: number): { setup: () => void; cleanup: () => void } {
  // => each effect instance owns one resource (here: a slot in the trace)
  return {
    setup: () => trace.push(`setup #${id}`), // => subscribe / start something
    cleanup: () => trace.push(`cleanup #${id}`), // => unsubscribe / stop that same thing
  };
}

// commitReRun models a dep change: run OLD cleanup, then NEW setup (in that order).
function commitReRun(prev: { cleanup: () => void }, next: { setup: () => void }): void {
  // => co-18: the previous effect's cleanup runs FIRST, with the old values
  prev.cleanup(); // => tear down what the old effect built
  // => ...and only then does the new effect's setup run, with the new values
  next.setup(); // => build the new thing
}

const first = makeEffect(1); // => the initial effect
first.setup(); // => mount: setup runs once
const second = makeEffect(2); // => the effect for the next render (deps changed)
commitReRun(first, second); // => re-run: cleanup #1 THEN setup #2
second.cleanup(); // => unmount: the final cleanup

console.log(trace.join(" -> ")); // => Output: setup #1 -> cleanup #1 -> setup #2 -> cleanup #2
