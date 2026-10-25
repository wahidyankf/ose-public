// Example 36: Failing First Proves the Test, After.
// => This file is the fix: the count subtraction is deleted, nothing else.
// => The lesson runs this file second: the same test now passes unchanged.
// => Red-then-green is the workflow: the test earns trust by failing first.
// => One-line diffs are the goal: the bug was one wrong operation.
fn total(dues: &[i32]) -> i32 {
    // => the fixed version under test
    dues.iter().sum() // => FIXED: the plain sum, count untouched
}
#[cfg(test)] // => test-only, same as the passing examples
mod tests {
    // => the suite: byte-identical to the failing run above
    use super::*; // => the fixed `total` is in scope
    #[test] // => this test must pass: 150 equals 150
    fn totals_three_dues() {
        // => the exact same fact as the red run
        assert_eq!(total(&[50, 75, 25]), 150); // => GREEN: both sides agree
    }
}
