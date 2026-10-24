// Example 38: Test Helpers Share Fixtures.
// => Helpers live in the test module: production code never sees them.
// => One fixture builder serves every test, so fixtures cannot drift apart.
// => Tests assert one fact each: totals here, counts there, never both.
// => The file has no `main`: the test harness provides the entry point.
fn total(dues: &[i32]) -> i32 {
    // => the function under test, unchanged
    dues.iter().sum() // => the plain sum from the earlier examples
}
#[cfg(test)] // => test-only from here down
mod tests {
    // => the suite: two tests over one shared fixture
    use super::*; // => `total` is in scope for both tests
                  // => `ledger` builds the canonical three dues every test starts from.
    fn ledger() -> Vec<i32> {
        // => helper, not a test: no attribute
        vec![50, 75, 25] // => fixed: 150 total, three lines, always
    }
    #[test] // => fact one: the shared ledger totals 150
    fn shared_ledger_totals() {
        // => names the fact under test
        assert_eq!(total(&ledger()), 150); // => same hand total as before
    }
    #[test] // => fact two: the shared ledger holds three lines
    fn shared_ledger_has_three_lines() {
        // => a different fact, same fixture
        assert_eq!(ledger().len(), 3); // => shape fact, not arithmetic
    }
}
