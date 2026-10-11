// Example 23: The Dependency Array Gates Effect Re-runs. (co-18)
//
// The dependency array decides when an effect re-runs. Deps are compared with `Object.is` (so a
// fresh object/array each render is treated as DIFFERENT even if equal-by-value). No array => runs
// every commit; `[]` => mount only; `[a, b]` => runs when a or b changes.
//
// Note: dependencies are compared with `Object.is`; no array => every commit,
// `[]` => mount only. Source: react.dev, useEffect (https://react.dev/reference/react/useEffect).

// depsChanged returns true if any dependency differs from the previous render, by Object.is.
function depsChanged(prev: unknown[], next: unknown[]): boolean {
  // => co-18: Object.is is the comparison -- distinct references are different even if equal-by-value
  return next.some((value, i) => !Object.is(value, prev[i])); // => NaN vs NaN is Object.is-equal
}

// A render log: how many times the effect actually ran.
const effectRuns: number[] = []; // => each entry is one effect execution
// => the count here is the observable proof of what the deps array allowed through

// runEffect models an effect with an explicit deps array across a sequence of renders.
function runEffect(prevDeps: unknown[] | null, deps: unknown[] | null): boolean {
  // => null deps = "every commit"; [] = "mount only"; [a,b] = "when a or b changes"
  if (prevDeps === null || deps === null) return true; // => no array -> run every time
  if (deps.length === 0 && prevDeps.length === 0) return prevDeps === null; // => [] runs only on mount
  return depsChanged(prevDeps, deps); // => [a,b] -> run only when Object.is sees a change
}

// A sequence of renders with their dep values: [filter] across renders 1..4.
const renders: unknown[][] = [["ab"], ["ab"], ["abc"], ["abc"]]; // => value changes on render 3 only
let prev: unknown[] | null = null; // => null before the first render
for (const deps of renders) {
  // => mount: prev is null -> run; then prev = deps for the next comparison
  if (runEffect(prev, deps)) effectRuns.push(renders.indexOf(deps) + 1);
  prev = deps; // => carry the deps forward to compare against next render
}

console.log("effect ran on renders:", effectRuns); // => Output: mounts on 1, re-runs on 3 (value changed)
