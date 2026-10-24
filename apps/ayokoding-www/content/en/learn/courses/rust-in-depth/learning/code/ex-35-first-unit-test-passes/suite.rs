// Example 35: First Unit Test Passes.
// => `#[cfg(test)]` compiles the module only for `rustc --test` runs.
// => `use super::*` brings the functions under test into scope.
// => Each `#[test]` is one fact: name it after the fact, not the function.
// => Two tests below: the exact sum and the empty corner, both fixed.
// => The file has no `main`: the test harness provides the entry point.
fn total(dues: &[i32]) -> i32 {
    // => the function under test
    dues.iter().sum() // => one fused pass, no accumulator variable
}
#[cfg(test)] // => test-only from here down: ships nothing
mod tests {
    // => the suite module groups the facts
    use super::*; // => `total` is now callable unqualified
    #[test] // => one fact per test, always
    fn totals_three_dues() {
        // => names the fact, not the function
        assert_eq!(total(&[50, 75, 25]), 150); // => hand total: 150
    }
    #[test] // => corners get their own tests, never an afterthought
    fn empty_ledger_totals_zero() {
        // => the zero-dues corner
        assert_eq!(total(&[]), 0); // => empty sums to zero, by definition
    }
}
