// Example 57: Mutex Guards the Shared Counter.
// => `Arc` shares ownership across threads: every worker holds the mutex.
// => `lock` blocks until the turn arrives: exactly one writer at a time.
// => Short critical sections keep the lock moving: add, then release.
// => Four workers times 250 dues each always totals exactly 1000.
// => The transcript prints only the final total: lock order never leaks.
use std::sync::{Arc, Mutex}; // => shared ownership plus mutual exclusion
use std::thread; // => four workers run below
fn main() {
    // => one counter shared by four workers through the atomic handle.
    let settled = Arc::new(Mutex::new(0)); // => the guarded total starts at zero
    let mut handles = Vec::new(); // => join every worker before reading
    for _ in 0..4 {
        // => four identical workers, fixed share each
        let worker = Arc::clone(&settled); // => each worker owns a handle
        handles.push(thread::spawn(move || {
            // => `move` carries the handle
            for _ in 0..250 {
                // => 250 dues per worker, no more
                // => the guard lives for one statement: add, then release.
                *worker.lock().expect("no worker panics") += 1; // => turn taken, total grows
            }
        }));
    }
    for handle in handles {
        // => all four workers finish before the read
        handle.join().expect("workers never panic"); // => join in spawn order
    }
    // => the lock below reads the final total: 4 times 250 is 1000.
    println!("settled: {}", settled.lock().expect("no worker panics")); // => Output: settled: 1000
}
