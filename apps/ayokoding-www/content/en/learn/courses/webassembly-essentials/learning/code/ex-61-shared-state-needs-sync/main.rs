// Example 61: Shared State Needs a Protocol.
//
// Arc shares ownership across holders; Mutex guards the data with a lock
// each holder must take before touching it. The pair works on one thread
// exactly as on many (clone the Arc, lock the Mutex), which is why this
// survey runs green here: the protocol is identical, only the parallelism
// is hypothetical, and the lesson marks exactly that boundary outright.
// => Arc clones share: the last holder to drop frees the ledger
// => Mutex::lock guards: the guard derefs to the data, then releases

use std::sync::{Arc, Mutex};

// => Arc shares, Mutex guards: clone the handle, lock the data

// SharedLedger holds the course totals behind the share-and-guard pair.
// => Arc<Mutex<Vec<u32>>> reads inside-out: shared, guarded, a score list
// => new starts empty: every balance below is posted through the guard
#[derive(Debug, Clone)]
struct SharedLedger {
    // => one field wraps everything: sharing and guarding compose
    inner: Arc<Mutex<Vec<u32>>>,
    // => Vec<u32> inside: the course scores, guarded and shared
}

impl SharedLedger {
    // => post writes, total reads: both pass through the same guard
    // => the constructor wraps the empty Vec in a Mutex, then in an Arc
    fn new() -> SharedLedger {
        // => three wraps deep: Vec inside Mutex inside Arc, built at once
        SharedLedger {
            inner: Arc::new(Mutex::new(Vec::new())),
        }
    }

    // => &self posts through the guard: lock, push, release, all in one line
    fn post(&self, score: u32) {
        // => lock() returns the guard: a poisoned mutex would Err here
        if let Ok(mut guarded) = self.inner.lock() {
            // => the guard derefs to the Vec: the push lands inside the lock
            guarded.push(score);
        }
        // => the guard drops at the semicolon: the lock releases promptly
    }

    // => &self totals through the guard: sum the locked slice, then release
    fn total(&self) -> u32 {
        // => map the guard to its sum: lock failures total as zero, loudly
        self.inner
            .lock()
            .map(|guarded| guarded.iter().sum())
            .unwrap_or(0)
    }
}

fn main() {
    // => three handles, one Vec: clones share, the guard serializes
    // => one ledger, three handles: the clones below share a single Vec
    let ledger = SharedLedger::new();
    let scorer_a = ledger.clone();
    let scorer_b = ledger.clone();
    // => three posts through three handles: the guard serializes them all
    ledger.post(91);
    scorer_a.post(77);
    scorer_b.post(88);
    // => every post landed once: 91 + 77 + 88 totals 256 through the guard
    println!("total: {}", ledger.total());
}
