// Example 59: Atomics Count Without a Lock.
// => `AtomicI64` updates without a mutex: hardware does the serializing.
// => `Relaxed` ordering fits counters: only the final total is observed.
// => `fetch_add` returns the previous value: useful for ticket numbering.
// => Four workers times 250 fetch-adds always reads back exactly 1000.
// => Only the final read prints: intermediate races stay out of the transcript.
use std::sync::atomic::{AtomicI64, Ordering}; // => the counter and its ordering
use std::sync::Arc; // => shares the counter across the workers
use std::thread; // => four workers run below
fn main() {
    // => one atomic counter shared by four workers, no mutex anywhere.
    let settled = Arc::new(AtomicI64::new(0)); // => starts at zero, ends at 1000
    let mut handles = Vec::new(); // => join every worker before the read
    for _ in 0..4 {
        // => four identical workers, fixed share each
        let worker = Arc::clone(&settled); // => each worker owns a handle
        handles.push(thread::spawn(move || {
            // => `move` carries the handle
            for _ in 0..250 {
                // => 250 fetch-adds per worker
                // => relaxed: no ordering promise, just the atomic update.
                worker.fetch_add(1, Ordering::Relaxed); // => hardware serializes
            }
        }));
    }
    for handle in handles {
        // => all four workers finish before the read
        handle.join().expect("workers never panic"); // => join in spawn order
    }
    // => the single ordered read after all joins: the exact deterministic total.
    println!("settled: {}", settled.load(Ordering::SeqCst)); // => Output: settled: 1000
}
