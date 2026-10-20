// => Context plus state: the hand-rolled store, ten lines, no dependency.
import React, { createContext, useContext, useState } from "react"; // => State plus context: useState feeds the provider value.
// => Context plus state: the hand-rolled store, ten lines, no dependency.

// => Store shape: state plus two actions, the complete contract under test.
// => Store shape: count plus the two transitions the suite drives.
type Store = { count: number; inc: () => void; reset: () => void };
// => Store shape: state plus two actions, the complete contract under test.

// => Null default: using the hook outside a provider fails loudly, fast.
const StoreContext = createContext<Store | null>(null); // => Null default: missing providers fail loudly in useStore.
// => Null default: using the hook outside a provider fails loudly, fast.

// => Provider owns the state: useState lives here, components dispatch via context.
export function StoreProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  // => Provider owns the state: useState lives here, components dispatch via context.
  // => Single source of truth: every consumer below sees the same count.
  const [count, setCount] = useState(0); // => Count state: zero at mount, actions move it.
  // => Single source of truth: every consumer below sees the same count.
  // => Store object assembled: state plus actions, typed as one contract.
  const value: Store = {
    count, // => State exposed read-only: consumers cannot bypass the actions.
    // => State exposed read-only: consumers cannot bypass the actions.
    inc: () => setCount((c) => c + 1), // => Updater form: rapid clicks never lose an increment to staleness.
    // => Updater form: rapid clicks never lose an increment to staleness.
    reset: () => setCount(0), // => Reset action: second behavior the test will drive.
    // => Reset action: the second behavior the test below will drive.
    // => Store object closes: state plus two actions, the provider value.
  };
  // => Provider publishes the store: every useStore below reads this.
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// => Hook with a guard: outside a provider, the error names the fix.
export function useStore(): Store {
  // => Hook with a guard: outside a provider, the error names the fix.
  // => Context read: the hook's only dependency, injected by the wrapper.
  const store = useContext(StoreContext); // => Context read: null outside a provider, guarded next.
  // => Loud failure beats undefined-count confusion three components down.
  if (store === null) throw new Error("useStore needs a StoreProvider");
  // => Loud failure beats undefined-count confusion three components down.
  return store;
}

// => Consumer: reads count, dispatches actions, owns no state itself.
export function CounterView(): React.JSX.Element {
  // => Consumer: reads count, dispatches actions, owns no state itself.
  // => Destructure state plus actions: the view's whole vocabulary in one line.
  const { count, inc, reset } = useStore(); // => Destructured actions: the view wires all three controls.
  return (
    // => Root div groups readout and buttons: the store view's surface.
    <div>
      {/* => Count paragraph: the shared state made visible. */}
      <p>Count: {count}</p>
      {/* => Add button: dispatches inc through the real provider machinery. */}
      <button type="button" onClick={inc}>
        Add
      </button>
      <button type="button" onClick={reset}>
        {/* => Reset label: the second action's accessible name. */}
        Reset
      </button>
    </div>
  );
}
