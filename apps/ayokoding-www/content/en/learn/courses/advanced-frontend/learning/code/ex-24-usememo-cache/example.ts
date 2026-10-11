// Example 24: useMemo Caches an Expensive Calculation. (co-19)
//
// `useMemo` caches the RESULT of a calculation between re-renders, recomputing only when its deps
// change. This turns an O(n) recomputation-every-render into a cheap cache hit on renders where
// the inputs did not change.
//
// Note: "`useMemo` ... lets you cache the result of a calculation between
// re-renders." Source: react.dev, useMemo (https://react.dev/reference/react/useMemo).

// Counters track how many times the expensive fn actually ran vs. how many renders happened.
let computeCalls = 0; // => increments only on a REAL recomputation
// => renderCount - computeCalls = the number of cache hits (proof the cache worked)

// expensiveSum is the kind of costly fn you would NOT want to re-run every render.
function expensiveSum(a: number, b: number): number {
  // => stand-in for any heavy derive; the point is it should not run unless a/b changed
  computeCalls += 1; // => record that a real computation happened
  return a + b; // => the (cheap here, expensive in reality) result
}

// useMemo caches the result, keyed on the deps array (compared by Object.is per element).
function useMemo<T>(factory: () => T, deps: unknown[], prev: { deps: unknown[]; value: T } | null): T {
  // => co-19: recompute only when a dep changed by Object.is
  const changed = prev === null || deps.some((d, i) => !Object.is(d, prev.deps[i])); // => cache miss?
  if (changed) return { deps, value: factory() }.value; // => recompute and store
  return prev!.value; // => cache hit: return the stored value, factory NOT called
}

// We model useMemo returning the cached value by keeping a small holder outside the call.
let cache: { deps: unknown[]; value: number } | null = null;
function render(a: number, b: number): number {
  // => each call is one render; useMemo decides whether to recompute
  const value = useMemo(() => expensiveSum(a, b), [a, b], cache); // => deps = [a, b]
  cache = { deps: [a, b], value }; // => store for next render's comparison
  return value; // => the rendered derived value
}

render(2, 3); // => mount: computes (computeCalls=1)
render(2, 3); // => deps unchanged -> CACHE HIT (computeCalls still 1)
render(2, 3); // => still unchanged -> another cache hit (computeCalls still 1)
render(4, 3); // => dep a changed -> recompute (computeCalls=2)

console.log("renders: 4, real computations:", computeCalls); // => Output: renders: 4, real computations: 2
