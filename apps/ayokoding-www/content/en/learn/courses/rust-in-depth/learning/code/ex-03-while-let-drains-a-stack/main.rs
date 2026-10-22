// Example 3: While Let Drains a Stack.
// => `while let` loops while the pattern matches and stops when it will not.
// => Popping in the condition keeps the drain to three lines, no index needed.
fn main() {
    // => a stack is a `Vec` used from the back; jobs run last-in first-out.
    let mut stack = vec!["audit", "settle", "report"]; // => three jobs queued
                                                       // => `pop` returns `Some` until the stack is empty, then `None` ends it.
    let mut done = 0; // => counts how many jobs actually ran
    while let Some(job) = stack.pop() {
        // => `None` stops the loop by itself
        done += 1; // => one more job finished
        println!("{}: {}", done, job); // => prints 1: report, then 2, then 3
    }
    // => the total below is fixed: three pushes always drain to three runs.
    println!("drained: {}", done); // => Output: drained: 3
}
