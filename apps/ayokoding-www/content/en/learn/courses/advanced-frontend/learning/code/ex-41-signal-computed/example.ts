// Example 41: A Computed Signal Tracks Its Dependencies. (co-22)
//
// A computed signal derives its value from other signals. It tracks which signals it read and
// recomputes ONLY when one of those dependencies changes -- not on every signal change anywhere.
//
// Note: "computed signals track which signals are accessed and re-run ... when those
// signals change." Source: Preact Signals (https://preactjs.com/guide/v10/signals/).

let activeEffect: (() => void) | null = null; // => the dependency-tracking context

class Signal<T> {
  private val: T;
  private readonly subs: Set<() => void> = new Set();
  constructor(val: T) {
    this.val = val;
  }
  get value(): T {
    // => a read subscribes the active effect (or computed) to this signal
    if (activeEffect) this.subs.add(activeEffect);
    return this.val;
  }
  set value(next: T) {
    // => a write re-runs subscribers (including the computed's updater)
    this.val = next;
    this.subs.forEach((s) => s());
  }
}

let computeCalls = 0; // => counts real recomputations of the derived value

// computed builds a signal whose value is derived, re-running only when a read dependency changes.
function computed<T>(derive: () => T): { get value(): T } {
  // => the derivation runs once up front, then again only when a dependency changes
  let cached: T; // => the memoized result
  const recompute = () => {
    // => set the tracker so signals read inside derive subscribe recompute
    activeEffect = recompute; // => this computed subscribes to whatever derive reads
    cached = derive(); // => re-derive and cache
    computeCalls += 1; // => record a real recomputation
    activeEffect = null;
  };
  recompute(); // => initial computation (subscribes to dependencies)
  return {
    get value(): T {
      return cached; // => readers get the memoized value
    },
  };
}

const a = new Signal(2); // => dependency
const b = new Signal(3); // => dependency
const sum = computed(() => a.value + b.value); // => derives from a and b (#1)

a.value = 10; // => a changed -> sum recomputes (#2)
b.value = 3; // => b set to SAME value -> sum subscribed to b, so it recomputes (#3)
const unrelated = new Signal(99); // => a signal sum does NOT read
unrelated.value = 100; // => changed, but sum does not depend on it -> NO recompute (#3 still)

console.log("sum value:", sum.value); // => Output: sum value: 13
console.log("real computations:", computeCalls); // => Output: real computations: 3
