// Example 47: Iterators Are Lazy Adapters.
//
// Map and filter build a pipeline without running it: nothing executes
// until a terminal (collect, sum, find) pulls values through. Laziness
// means fused loops with no intermediate Vec, and the counter below
// proves it: two pulls run the mapper exactly twice, not eight times.
// => adapters compose; terminals execute: no terminal, no work happens
// => take limits the pull: the pipeline stops after enough answers arrive

use std::cell::Cell;

// mapped_once wraps the mapping so each execution ticks the shared counter.
// => &Cell<u32> shares the counter: the closure borrows, never owns it
// => the tick proves laziness: count the ticks, count the executions
fn mapped_once(seen: &Cell<u32>, value: u32) -> u32 {
    // => each pull ticks once: the transcript below counts the work done
    seen.set(seen.get() + 1);
    value * 2
}

fn main() {
    // => the counter starts at zero: every tick below is pipeline work
    let seen = Cell::new(0u32);
    // => filter keeps evens, map doubles through the counter, take(2) stops
    let first_two: Vec<u32> = [1u32, 2, 3, 4, 5, 6, 7, 8]
        .iter()
        .filter(|value| **value % 2 == 0)
        .map(|value| mapped_once(&seen, *value))
        // => take(2) ends the pull early: later evens never reach the mapper
        .take(2)
        .collect();
    // => 2 and 4 double to 4 and 8: the first two evens, in input order
    println!("first two doubled evens: {first_two:?}");
    // => exactly two ticks: 6 and 8 never entered the pipeline at all
    println!("mapper ran {} times", seen.get());
}
