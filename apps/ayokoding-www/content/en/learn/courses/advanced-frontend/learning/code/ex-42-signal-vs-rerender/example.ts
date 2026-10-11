// Example 42: A Signal Updates the DOM Without a Parent Re-render. (co-22)
//
// The fine-grained payoff: when a signal changes, only the effect that read it re-runs (updating
// just the bound DOM text). The parent COMPONENT does not re-render at all -- unlike React, where a
// state change re-runs the whole component function. This is the core performance claim of
// signal-based frameworks (SolidJS, Preact Signals).
//
// Note: SolidJS "compiles its templates to real DOM nodes ... only the code that
// depends on it will rerun" (SolidJS README). The exact wording of quotes from the SolidJS docs
// site has not been independently confirmed; check the linked source before relying on it.

let activeEffect: (() => void) | null = null;
let parentRenders = 0; // => counts how many times the PARENT component function ran
// => parentRenders staying flat while the bound DOM updates is the fine-grained payoff

class Signal<T> {
  private val: T;
  private readonly subs: Set<() => void> = new Set();
  constructor(val: T) {
    this.val = val;
  }
  get value(): T {
    if (activeEffect) this.subs.add(activeEffect);
    return this.val;
  }
  set value(next: T) {
    this.val = next;
    this.subs.forEach((s) => s()); // => only the bound-DOM effect re-runs
  }
}

// A "bound DOM node" whose text a signal drives directly.
const boundDom = { text: "" }; // => a single DOM text node

// The parent component runs ONCE; it sets up a fine-grained binding, then never re-runs.
function mountParent(count: Signal<number>): void {
  // => co-22: the component body runs once; the binding below is what re-runs on change
  parentRenders += 1; // => this increments only when the parent itself re-renders
  activeEffect = () => {
    // => this effect is the fine-grained binding -- it re-runs, the parent does not
    boundDom.text = `count: ${count.value}`; // => updates ONLY this DOM text
  };
  activeEffect(); // => initial bind (subscribes to count)
  activeEffect = null;
}

const count = new Signal(0); // => the signal the DOM binds to
mountParent(count); // => parent runs once (parentRenders = 1)
count.value = 1; // => DOM updates, parent does NOT re-render
count.value = 2; // => DOM updates again, parent still does NOT re-render

console.log("bound DOM after changes:", boundDom.text); // => Output: bound DOM after changes: count: 2
console.log("parent re-renders:", parentRenders); // => Output: parent re-renders: 1
