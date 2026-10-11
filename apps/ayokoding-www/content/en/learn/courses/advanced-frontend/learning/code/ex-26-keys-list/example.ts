// Example 26: Stable Keys Preserve List Item Identity on Reorder. (co-20)
//
// React identifies list items by their TREE POSITION plus their key. A STABLE key (an id) lets
// React keep the same DOM node -- and its local state -- when the list reorders. Reorder with
// stable keys: the node moves, its input state moves with it.
//
// Note: "unstable keys (like those produced by Math.random()) will cause many ...
// DOM nodes to be unnecessarily recreated." Source: Reconciliation (legacy.reactjs.org)
// (https://legacy.reactjs.org/docs/reconciliation.html).

// A list item is an id plus any per-item state (here: an input's draft text).
interface Item {
  // => the id is the STABLE key; draft is per-item state that must follow the item on reorder
  id: string; // => the stable key
  draft: string; // => local state tied to THIS item, not to this position
}

// The DOM "node" for each item, keyed by the item's key. React reuses a node when its key matches.
const nodes: Map<string, { draft: string }> = new Map(); // => keyed by id, persists across renders
// => a Map keyed by id models React's keyed-children reconciliation table

// reconcile updates the rendered list, REUSING existing nodes when a key is already present.
function reconcile(items: Item[]): string[] {
  // => co-20: a matching key means "reuse this node, keep its state" -- no recreation
  return items.map((item) => {
    // => if the key exists, the node (and its draft) is reused; otherwise a new node is created
    if (!nodes.has(item.id)) nodes.set(item.id, { draft: item.draft }); // => first sight -> create
    return `${item.id}=${nodes.get(item.id)!.draft}`; // => report key + the node's preserved draft
  });
}

// Initial list; the user typed "hello" into item "b"'s input (its draft).
nodes.set("a", { draft: "" });
nodes.set("b", { draft: "hello" }); // => draft lives with key "b", not with position 1
nodes.set("c", { draft: "" });

// Reorder: b moves to the FRONT. With stable keys, b's draft ("hello") moves with it.
const reordered: Item[] = [
  { id: "b", draft: "" }, // => same key "b" -> node reused -> draft "hello" preserved
  { id: "a", draft: "" },
  { id: "c", draft: "" },
];

console.log("after reorder:", reconcile(reordered)); // => Output: b's "hello" moved to position 0
