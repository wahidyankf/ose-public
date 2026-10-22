// Example 40: Count Work, Not Wall Time.
// => Assert iterations and checksums: both are identical on every machine.
// => Never assert durations: clocks differ, load differs, CI differs.
// => The fold below does real work; the test pins its exact result.
// => The file has no `main`: the test harness provides the entry point.
fn fold_dues(upto: i32) -> (i32, i64) {
    // => count of items plus their sum
    let mut count = 0; // => how many numbers the fold visited
    let mut sum: i64 = 0; // => wide enough for a million-item total
    for n in 1..=upto {
        // => the fixed range: 1 through a million
        count += 1; // => one more item visited
        sum += n as i64; // => widen before adding: no overflow
    }
    (count, sum) // => both facts travel together
}
#[cfg(test)] // => test-only from here down
mod tests {
    // => the suite: the work count and its checksum
    use super::*; // => `fold_dues` is in scope
    #[test] // => Gauss pins the checksum: n(n+1)/2 for a million
    fn million_folds_to_fixed_total() {
        // => the exact arithmetic fact
        let (count, sum) = fold_dues(1_000_000); // => real work, fixed result
        assert_eq!(count, 1_000_000); // => every item visited exactly once
        assert_eq!(sum, 500_000_500_000); // => Gauss: 10^6 x 10^6+1 over 2
    }
}
