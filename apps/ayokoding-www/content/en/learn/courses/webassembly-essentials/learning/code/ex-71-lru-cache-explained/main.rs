// Example 71: LRU Cache, Explained.
//
// Read this like a maintainer: the struct lists the state (capacity,
// order, table), and each method is one invariant (insert evicts the
// least-recently-used, get refreshes recency). The order Vec holds keys
// oldest-first; the table maps keys to values; every access moves the key
// to the back, so index 0 is always the eviction candidate.
// => state first: capacity, order, table tell the whole design in 3 lines
// => methods preserve one invariant each: evict-oldest, refresh-on-read

use std::collections::HashMap;

// => HashMap is the table: keys map to values, order lives separately

// LruCache holds at most capacity entries, evicting the stalest first.
// => order lists keys oldest-first: position 0 is the next eviction
// => table maps keys to values: the order Vec never stores values itself
struct LruCache {
    // => three fields, three jobs: limit, recency, storage
    capacity: usize,
    // => usize counts entries: capacity is a length, never negative
    order: Vec<String>,
    // => order holds keys oldest-first: index 0 evicts next
    table: HashMap<String, u32>,
    // => table holds values: keyed by owned Strings, graded u32
}

impl LruCache {
    // => new guards, touch refreshes, insert evicts, get reads
    // => new with capacity 0 would evict everything: the guard refuses it
    fn new(capacity: usize) -> Option<LruCache> {
        // => Option, not assert: zero capacity is misuse, not a trap
        if capacity == 0 {
            // => zero holds nothing: every insert would evict instantly
            return None;
            // => bare None: the shape already explains the refusal
        }
        Some(LruCache {
            capacity,
            order: Vec::new(),
            table: HashMap::new(),
        })
        // => both collections start empty: the first insert fills them
    }

    // => touch moves a key to the back: the most recent read lives longest
    fn touch(&mut self, key: &str) {
        // => &mut self reorders: refreshing recency mutates the order
        // => retain drops the old position: the push below re-adds it last
        self.order.retain(|existing| existing != key);
        // => &str compares by value: Strings match the borrowed key
        self.order.push(key.to_string());
        // => to_string copies: the order owns its keys, independent of callers
    }

    // => insert stores the value, evicting index 0 when over capacity
    fn insert(&mut self, key: &str, value: u32) {
        // => value is u32: Copy means no borrow survives the call
        self.table.insert(key.to_string(), value);
        self.touch(key);
        // => touch after store: the new key becomes most recent at once
        // => over capacity evicts the front: the stalest key leaves first
        while self.order.len() > self.capacity {
            // => while guards the invariant: length returns to capacity
            let stale = self.order.remove(0);
            // => remove(0) is O(n): honest about the Vec tradeoff, fine at this size
            self.table.remove(&stale);
            // => both structures forget: order and table stay in agreement
        }
    }

    // => get refreshes recency on hits and reports misses as None, honestly
    fn get(&mut self, key: &str) -> Option<u32> {
        // => &mut self refreshes: even reads reorder, so get borrows mutably
        if let Some(value) = self.table.get(key).copied() {
            // => copied() lifts u32 out: the borrow ends before touch reborrows
            self.touch(key);
            Some(value)
            // => the hit returns the digits: touch already refreshed the order
        } else {
            None
            // => misses answer None: the order stays untouched, honestly
        }
    }
}

fn main() {
    // => capacity 2, three inserts: the smallest survey that evicts
    // => capacity 2: the third insert must evict the stalest key below
    let mut cache = match LruCache::new(2) {
        // => match at construction: misuse exits early, use proceeds below
        // => valid capacity builds the cache: the survey proceeds below
        Some(cache) => cache,
        // => zero capacity refuses at construction: exit stays 0, lesson told
        None => {
            println!("refused: capacity must be positive");
            return;
        }
    };
    // => insert sari, then budi: order is [sari, budi], table holds both
    cache.insert("sari", 91);
    // => sari arrives first: order [sari], graded 91
    cache.insert("budi", 77);
    // => budi second: order [sari, budi], full but legal
    // => read sari: recency refreshes, so order becomes [budi, sari]
    println!("sari -> {:?}", cache.get("sari"));
    // => Some(91) prints: the read refreshed sari before citra arrived
    // => insert citra: over capacity evicts index 0, which is budi now
    cache.insert("citra", 88);
    // => citra third: over capacity, the front (budi) leaves
    // => budi is gone, sari and citra remain: the transcript proves the policy
    println!("budi -> {:?}", cache.get("budi"));
    // => None prints: eviction is silent, the transcript is not
    println!("citra -> {:?}", cache.get("citra"));
}
