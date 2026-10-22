// Example 56: Scoped Threads Borrow Locals.
// => `thread::scope` runs threads that borrow the current stack frame.
// => The scope joins everything before returning: borrows stay valid.
// => No `Arc`, no clone, no channel: borrowing is the whole point.
// => Split the work, sum the halves, add the parts: the classic fork-join.
use std::thread; // => `scope` lives beside `spawn` here
fn main() {
    // => six fixed dues: two halves of three, same total every run.
    let dues = vec![50, 75, 25, 100, 10, 40]; // => total is 300
                                              // => the scope owns the threads: all joins happen before it exits.
    let total = thread::scope(|scope| {
        // => threads may borrow `dues`
        // => each half borrows its slice: no copies, no moves, no clones.
        let left = scope.spawn(|| dues[..3].iter().sum::<i32>()); // => 50 + 75 + 25
        let right = scope.spawn(|| dues[3..].iter().sum::<i32>()); // => 100 + 10 + 40
                                                                   // => joining inside the scope: both halves done before the sum.
        left.join().expect("halves never panic") + right.join().expect("halves never panic")
        // => 150 + 150
    });
    // => the scope exited, so the total below is complete and fixed.
    println!("total: {}", total); // => Output: total: 300
}
