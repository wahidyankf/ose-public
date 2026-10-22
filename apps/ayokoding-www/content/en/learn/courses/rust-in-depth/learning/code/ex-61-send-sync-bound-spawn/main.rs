// Example 61: Send and Sync Bound the Spawn.
// => `Send` allows moving to another thread: the closure must own its inputs.
// => `Sync` allows sharing between threads: the config borrows safely.
// => Bounds on the helper reject non-conforming closures at compile time.
// => `'static` on the closure means no borrowed stack: owned data only.
use std::thread; // => `spawn` enforces the bounds below
                 // => `job` runs any closure on a thread: the bounds are the whole contract.
fn job<F>(work: F) -> i32
// => generic over the closure type
where
    F: FnOnce() -> i32 + Send + 'static, // => own inputs, return a number, live long enough
{
    // => the bounds above are what let this `spawn` compile at all.
    thread::spawn(work).join().expect("jobs never panic") // => run and collect
}
fn main() {
    // => two fixed jobs take the same helper: doubling and summing.
    println!("doubled: {}", job(|| 21 * 2)); // => Output: doubled: 42
    println!("summed: {}", job(|| [50, 75, 25].iter().sum())); // => Output: summed: 150
}
