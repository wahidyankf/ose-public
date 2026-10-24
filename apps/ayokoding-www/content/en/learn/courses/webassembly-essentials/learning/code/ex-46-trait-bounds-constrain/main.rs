// Example 46: Trait Bounds Constrain.
//
// Generics without bounds accept everything and do nothing; bounds list
// the capabilities the body actually uses, so the compiler rejects calls
// whose types cannot keep the body's promises. Multiple bounds join with
// +, and each bound names one operation the function is allowed to touch.
// => bounds are compile-time gates: wrong types fail before any test runs
// => Display + PartialOrd + Copy says "printable, comparable, reusable"

use std::fmt::Display;

// announce_max prints the larger of two values with its rank in the pair.
// => T: Display + PartialOrd + Copy: print, compare, and reuse by value
// => Copy matters: the winner prints and returns without moving twice
fn announce_max<T: Display + PartialOrd + Copy>(left: T, right: T, rank: &str) -> T {
    // => the comparison picks the winner: PartialOrd guarantees <= exists
    let winner = if left >= right { left } else { right };
    // => Display guarantees the format string accepts the winner directly
    println!("{rank} max: {winner}");
    winner
}

fn main() {
    // => integers satisfy all three bounds: Copy, comparable, printable
    let top = announce_max(91, 77, "scores");
    // => the returned winner reuses by value: Copy lets top print again
    println!("winner reused: {top}");
    // => floats satisfy the same bounds: 9.1 beats 7.7, printed with rank
    let best = announce_max(9.1, 7.7, "ratios");
    // => reuse again: Copy means no borrow survives the first print
    println!("best reused: {best}");
}
