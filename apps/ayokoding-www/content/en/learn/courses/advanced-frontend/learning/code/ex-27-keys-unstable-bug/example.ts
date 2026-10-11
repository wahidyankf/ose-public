// Example 27: Random Keys Recreate DOM and Lose State. (co-20)
//
// The NEGATIVE counterpart of Example 26: when keys come from `Math.random()` (or any per-render
// value), every key is NEW on every render. React treats each as a different item, DESTROYS the
// old node, and creates a new one -- so any per-item state (an input's draft, focus) is lost.
//
// Note: "unstable keys (like those produced by Math.random()) will cause many ...
// DOM nodes to be unnecessarily recreated." Source: Reconciliation (legacy.reactjs.org)
// (https://legacy.reactjs.org/docs/reconciliation.html).

// Each node is keyed by whatever key the render assigned it.
const nodes: Map<string, { draft: string }> = new Map(); // => the DOM table keyed by item key
// => a key present last render but absent this render means that node was DESTROYED
let recreations = 0; // => count of nodes destroyed+recreated because their key changed

// A keyed list item; the key is generated PER RENDER here (the bug).
interface Item {
  // => note: the key is NOT the id -- it is a throwaway random string
  key: string; // => regenerated every render -> unstable
  label: string; // => the item's content
}

// reconcileWithKeys treats a missing key as a brand-new item -> destroy old, create new.
function reconcileWithKeys(items: Item[]): void {
  // => co-20: a key that was not present last render forces a node recreation
  const seen = new Set<string>();
  for (const item of items) {
    // => every random key is "new" relative to the previous render's random keys
    if (!nodes.has(item.key)) {
      recreations += 1; // => the old node (different random key) is gone -> state lost
      nodes.set(item.key, { draft: "" }); // => a fresh node with EMPTY draft
    }
    seen.add(item.key);
  }
}

// Two renders of the SAME two items, but each render mints fresh random keys.
function randomKey(): string {
  return Math.random().toString(36).slice(2); // => a DIFFERENT string every call -> unstable
}

const render1: Item[] = [
  { key: randomKey(), label: "a" },
  { key: randomKey(), label: "b" },
];
nodes.set(render1[0].key, { draft: "typed text" }); // => user typed into item a's input

const render2: Item[] = [
  { key: randomKey(), label: "a" }, // => NEW random key -> not the same node as render1
  { key: randomKey(), label: "b" },
];
reconcileWithKeys(render2); // => both keys are new -> both nodes recreated -> drafts LOST

console.log("nodes recreated (state lost):", recreations); // => Output: nodes recreated (state lost): 2
