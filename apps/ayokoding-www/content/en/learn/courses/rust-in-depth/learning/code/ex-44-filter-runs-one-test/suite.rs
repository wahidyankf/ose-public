// Example 44: Filter Runs One Test.
// => Pass a substring to run only matching tests: focus without editing.
// => The transcript counts the filtered-out tests: nothing hides silently.
// => The run for this unit passes `settles_exact_pair`: one runs, two wait.
// => The file has no `main`: the test harness provides the entry point.
fn total(dues: &[i32]) -> i32 {
    // => the function under test, unchanged
    dues.iter().sum() // => the plain sum from the earlier examples
}
// => Three facts below share one function: filters pick which ones run.
#[cfg(test)] // => test-only from here down
mod tests {
    // => the suite: three facts, one of them focused below
    use super::*; // => `total` is in scope for all three
    #[test] // => the focused fact: runs alone under the name filter
    fn settles_exact_pair() {
        // => the filter substring matches this one
        assert_eq!(total(&[50, 75]), 125); // => the pair under the lens
    }
    #[test] // => filtered out of the focused run: counted, not run
    fn totals_three_dues() {
        // => the canonical triple, waiting
        assert_eq!(total(&[50, 75, 25]), 150); // => skipped by the filter
    }
    #[test] // => filtered out of the focused run: counted, not run
    fn empty_ledger_totals_zero() {
        // => the corner, waiting
        assert_eq!(total(&[]), 0); // => skipped by the filter
    }
}
