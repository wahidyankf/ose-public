// Example 65: Doc Comments Are the Help Text.
// => `///` documents the item below: contract first, example second.
// => `/// # Examples` holds a snippet readers can paste and run.
// => `main` below executes the documented example as a real assertion.
// => Docs that run cannot rot: the example fails the moment it lies.
// => `cargo doc` renders these comments; the habit works before that too.
/// Halves every due above the waiver line, rounding down.
///
/// Dues at or below 100 settle whole; larger dues settle at half value.
/// Small ledgers stay readable while large ones stay affordable.
///
/// # Examples
///
/// ```text
/// half_over(150) == 75 and half_over(50) == 50
/// ```
fn half_over(amount: i32) -> i32 {
    // => the documented contract, implemented
    if amount > 100 {
        // => the waiver line: larger dues halve
        amount / 2 // => integer division rounds down, stated above
    } else {
        amount // => small dues settle whole, stated above
    }
}
fn main() {
    // => the documented example runs here as two executable assertions.
    assert_eq!(half_over(150), 75); // => the doc's first claim, checked
    assert_eq!(half_over(50), 50); // => the doc's second claim, checked
                                   // => both claims held silently: only the confirmed figures print.
    println!("150 -> {}", half_over(150)); // => Output: 150 -> 75
    println!("50 -> {}", half_over(50)); // => Output: 50 -> 50
}
