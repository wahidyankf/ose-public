// Example 44: Main and Tests Share the File.
//
// One file serves two binaries: the normal build runs main for humans,
// and rustc --test builds the same file into a test runner for the suite.
// The harness runs both: main proves the program works, the test run pins
// the contract, and neither copy of the logic can drift from the other.
// => two runs, one source: main for the demo, tests for the guarantee
// => shared helpers serve both: median below feeds main and the suite

// median returns the middle of a sorted copy, like Example 27 teaches.
// => the empty guard returns 0.0: no median exists without values
// => a sorted copy keeps the caller's order: borrowing, not taking
fn median(values: &[f64]) -> f64 {
    // => slice in, number out: the summary fits in one f64
    // => empty input yields 0.0: consistent with the course's own convention
    if values.is_empty() {
        // => emptiness first: no middle exists without values
        return 0.0;
        // => 0.0, not NaN: the guard value stays comparable
    }
    // => sort the copy: the caller's slice never moves under this function
    let mut ordered = values.to_vec();
    // => to_vec copies: sorting never disturbs the caller's order
    ordered.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    // => partial_cmp with an Equal fallback: NaN sorts without trapping
    // => mid splits the ordered line: odd reads one, even averages two
    let mid = ordered.len() / 2;
    // => integer division floors: mid is the upper middle for even
    if ordered.len() % 2 == 1 {
        // => odd reads one: the true middle needs no averaging
        ordered[mid]
        // => index, not get: the guard above proves mid is in range
    } else {
        (ordered[mid - 1] + ordered[mid]) / 2.0
        // => even averages two: mid-1 and mid straddle the center
    }
}

// => cfg(test) pins the contract main demonstrates below, case by case
#[cfg(test)]
mod tests {
    // => three tests, three shapes: odd, even, and empty
    // => super::* imports median: one shared helper serves both binaries
    use super::*;

    // => odd counts have a true middle: 5.0 centers the fixed samples
    #[test]
    fn odd_count_reads_middle() {
        // => unsorted input: the function sorts its own copy first
        assert_eq!(median(&[4.0, 6.0, 8.0, 5.0, 3.0]), 5.0);
    }

    // => even counts average the middle pair: (5.0 + 6.0) / 2 is 5.5
    #[test]
    fn even_count_averages_pair() {
        // => (5.0 + 6.0) / 2: the pair average, pinned to 5.5
        assert_eq!(median(&[4.0, 8.0, 6.0, 5.0]), 5.5);
    }

    // => empty input yields the guard value: 0.0, never a trap, never NaN
    #[test]
    fn empty_yields_zero() {
        // => the guard's own test: empty in, 0.0 out, no trap
        assert_eq!(median(&[]), 0.0);
    }
}

fn main() {
    // => the binary demonstrates the helper the suite pins above
    println!("median: {}", median(&[4.0, 6.0, 8.0, 5.0, 3.0]));
    // => the demo reuses the odd sample: 5.0 prints here
}
