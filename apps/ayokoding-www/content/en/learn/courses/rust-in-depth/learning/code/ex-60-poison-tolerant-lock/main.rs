// Example 60: Recover a Poisoned Lock.
// => Panicking while holding a lock poisons it: the data may be half-written.
// => `join` reports worker failure as `Err`: the panic never crosses threads.
// => `into_inner` recovers the guarded value: explicit, never accidental.
// => The panic message goes to stderr, which the harness ignores by design.
// => Only the recovery story prints: failure reported, last good total kept.
use std::sync::{Arc, Mutex}; // => the shared total and its guard
use std::thread; // => one failing worker runs below
fn main() {
    // => the ledger total starts at 125: the last known good value.
    let shared = Arc::new(Mutex::new(125)); // => guarded, shared, poisonable
    let worker = Arc::clone(&shared); // => the worker owns a handle
    let handle = thread::spawn(move || {
        // => `move` carries the handle
        // => the guard below poisons when the panic unwinds through it.
        let mut guard = worker.lock().expect("lock starts healthy"); // => healthy at first
        *guard += 25; // => the half-written update: 150, then panic
        panic!("worker hit bad input"); // => poisons the lock, stderr only
    });
    // => `join` turns the worker's panic into data: match it, do not unwrap.
    match handle.join() {
        // => `Err` carries the panic, `Ok` would carry success
        Ok(_) => println!("worker finished"), // => not taken: the worker panicked
        Err(_) => println!("worker failed"),  // => Output: worker failed
    }
    // => recovery is explicit: `into_inner` says the old total is still good.
    let recovered = shared
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner()); // => 150 survives
    println!("recovered: {}", recovered); // => Output: recovered: 150
}
