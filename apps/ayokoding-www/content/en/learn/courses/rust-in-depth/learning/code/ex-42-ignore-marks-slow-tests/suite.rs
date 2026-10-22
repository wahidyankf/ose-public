// Example 42: Ignore Marks the Slow Tests.
// => `#[ignore]` skips a test in normal runs: the count shows as ignored.
// => Slow tests stay in the suite: they run with an explicit opt-in flag.
// => Fast tests guard every edit; slow tests guard releases, not keystrokes.
// => The transcript below proves the split: two run, one waits.
// => The file has no `main`: the test harness provides the entry point.
fn total(dues: &[i32]) -> i32 {
    // => the function under test, unchanged
    dues.iter().sum() // => the plain sum from the earlier examples
}
#[cfg(test)] // => test-only from here down
mod tests {
    // => the suite: two fast facts plus one slow fold
    use super::*; // => `total` is in scope for all three
    #[test] // => fast fact one: the exact hand total
    fn totals_three_dues() {
        // => runs on every pass
        assert_eq!(total(&[50, 75, 25]), 150); // => the canonical total
    }
    #[test] // => fast fact two: the empty corner
    fn empty_ledger_totals_zero() {
        // => runs on every pass
        assert_eq!(total(&[]), 0); // => zero dues, zero total
    }
    #[test] // => slow fact: a million-item fold, real work
    #[ignore] // => skipped by default: run explicitly when it matters
    fn million_folds_exactly() {
        // => waits for the opt-in run
        assert_eq!((1..=1_000_000i64).sum::<i64>(), 500_000_500_000); // => Gauss again
    }
}
