// Example 62: Rustfmt Owns the Shape.
// => This file holds the canonical shape: what `rustfmt` leaves untouched.
// => In CI the run starts with `rustfmt --check main.rs` (illustration in
// => the lesson): silence is the pass, and the pinned unit image ships only
// => the compiler, so the harness compiles the canonical shape directly.
// => Four-space indents, one blank line between items, operators spaced.
// => Never debate shape in review: the formatter already decided.
// => the function under test, plainly shaped below.
fn total(dues: &[i32]) -> i32 {
    dues.iter().sum() // => one fused pass, indented four spaces
}

fn main() {
    // => fixed dues again: the lesson is the shape, not the arithmetic.
    let dues = [50, 75, 25]; // => spaces inside brackets, commas followed
    println!("total: {}", total(&dues)); // => Output: total: 150
}
