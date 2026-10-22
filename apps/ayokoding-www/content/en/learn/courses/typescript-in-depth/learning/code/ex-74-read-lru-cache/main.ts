// => Example 74: read the invariant first: Map order is recency; the front is coldest.
class Lru {
  // => tiny least-recently-used cache
  private store = new Map<string, number>(); // => WHY Map: insertion order is the policy
  constructor(private capacity: number) {} // => max entries held
  get(key: string): number | undefined {
    // => lookup refreshes recency
    const hit = this.store.get(key); // => probe
    if (hit === undefined) {
      // => miss leaves order alone
      return undefined; // => honest absence
    } // => end of if (hit === undefined)
    this.store.delete(key); // => remove...
    this.store.set(key, hit); // => ...and reinsert: now most recent
    return hit; // => value out
  } // => end of get(key: string): number | undefined
  set(key: string, value: number): void {
    // => insert evicts the front when full
    this.store.delete(key); // => refresh position if present
    this.store.set(key, value); // => insert as most recent
    const oldest = this.store.keys().next().value; // => front is coldest
    if (this.store.size > this.capacity && oldest !== undefined) {
      // => over budget
      this.store.delete(oldest); // => evict the coldest
    } // => end of if (this.store.size > this.capacity && oldest !== un
  } // => end of set(key: string, value: number): void
  keys(): string[] {
    // => coldest first, for inspection
    return [...this.store.keys()]; // => snapshot in order
  } // => end of keys(): string[]
} // => end of class Lru
const cache = new Lru(2); // => holds two
cache.set("a", 1); // => order: a
cache.set("b", 2); // => order: a, b
cache.get("a"); // => refresh a: b, a
cache.set("c", 3); // => evicts b: a, c
console.log(cache.keys().join(",")); // => Output: a,c
console.log(cache.get("b") ?? "evicted"); // => Output: evicted
