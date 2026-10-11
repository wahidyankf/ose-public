// Example 40: A Signal Re-renders Its Readers on Change. (co-22)
//
// A signal is an object with a `.value` property; the signal itself always stays the same object.
// Code that reads `.value` inside an effect subscribes; setting `.value` re-runs only those
// subscribed effects -- fine-grained reactivity instead of a full component re-render.
//
// Note: "a signal is an object with a `.value` property ... the signal itself always
// stays the same." Source: Preact Signals (https://preactjs.com/guide/v10/signals/).

let activeEffect: (() => void) | null = null; // => the effect currently tracking dependencies

// A Signal tracks who reads it and re-runs them when its value changes.
class Signal<T> {
  // => the subs Set is the dependency graph: who cares when this signal changes
  private val: T; // => the current value
  private readonly subs: Set<() => void> = new Set(); // => subscribed effects
  constructor(val: T) {
    this.val = val; // => the initial value
  }
  get value(): T {
    // => reading .value inside an effect registers that effect as a subscriber
    if (activeEffect) this.subs.add(activeEffect); // => dependency tracking
    return this.val; // => the current value
  }
  set value(next: T) {
    // => setting .value re-runs every subscriber (and only subscribers)
    this.val = next; // => store the new value
    this.subs.forEach((s) => s()); // => co-22: only dependents re-run
  }
}

// effect runs fn once and registers it as a subscriber of any signal it reads.
function effect(fn: () => void): void {
  // => the tracking window: signals read during fn subscribe it
  activeEffect = fn; // => make fn the active tracker
  fn(); // => run once to both read the initial value and subscribe
  activeEffect = null; // => close the tracking window
}

const count = new Signal(0); // => a signal, always the SAME object
const log: number[] = []; // => what the reader printed, each time it re-ran
effect(() => {
  // => this reader subscribed by reading count.value
  log.push(count.value); // => re-runs whenever count.value changes
});

count.value = 1; // => change -> the subscribed effect re-runs (log: [..., 1])
count.value = 2; // => change -> re-runs again (log: [..., 2])

console.log("reader re-ran with values:", log); // => Output: reader re-ran with values: [ 0, 1, 2 ]
