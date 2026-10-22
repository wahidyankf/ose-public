// Example 36: Failing First Proves the Test, Before.
// => This file is the bug on purpose: the total subtracts the dues count.
// => The lesson runs this file first so the failure transcript is real.
// => `assert_eq!` prints both sides: left is the code, right is the hand total.
// => The suite below has one test: total three dues to exactly 150.
fn total(dues: &[i32]) -> i32 {
    // => the buggy version under test
    dues.iter().sum::<i32>() - dues.len() as i32 // => BUG: subtracts the count
}
#[cfg(test)] // => test-only, same as the passing examples
mod tests {
    // => the suite: one fact, checked by hand
    use super::*; // => the buggy `total` is in scope
    #[test] // => this test must fail: 147 is not 150
    fn totals_three_dues() {
        // => the exact fact from the previous example
        assert_eq!(total(&[50, 75, 25]), 150); // => RED: left is 147
    }
}
