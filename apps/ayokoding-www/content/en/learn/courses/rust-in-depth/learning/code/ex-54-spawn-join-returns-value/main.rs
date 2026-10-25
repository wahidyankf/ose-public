// Example 54: Spawn and Join Returns a Value.
// => `spawn` runs the closure elsewhere; the handle owns the result.
// => `join` blocks until done and returns `Ok(value)` on success.
// => Joining in spawn order pins the transcript: order is chosen, not raced.
// => `move` gives each thread its own copy of the due: no sharing yet.
use std::thread; // => `spawn` and the thread handles live here
fn main() {
    // => three fixed dues: the same squares on every run, in this order.
    let dues = [3, 4, 5]; // => squares are 9, 16, and 25
                          // => one handle per due: spawning borrows nothing, owns everything.
    let mut handles = Vec::new(); // => handles join in this same order
    for due in dues {
        // => `due` is `Copy`: the loop owns each value
        handles.push(thread::spawn(move || due * due)); // => `move` carries the copy
    }
    // => joining in order turns three races into one fixed transcript.
    let mut squares = Vec::new(); // => results land here in spawn order
    for handle in handles {
        // => first spawned joins first, always
        squares.push(handle.join().expect("workers never panic")); // => `Ok` unwrapped
    }
    println!("{:?}", squares); // => Output: [9, 16, 25]
}
