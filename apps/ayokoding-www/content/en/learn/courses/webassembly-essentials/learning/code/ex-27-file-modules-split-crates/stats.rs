// Example 27: File Modules Split Crates (stats half).
//
// The statistics half of the split crate: mean, median, and variance are
// the module's face, while sum and the sort helper stay private below.
// => only pub items cross the file fence: the rest is implementation detail
// => &mut [f64] on the private sorter says "I reorder my own scratch"

// mean divides the sum by the count; the empty slice yields 0.0.
// => pub marks the shared face: main.rs calls this across the fence
// => sum is private: callers never see the accumulation helper
pub fn mean(values: &[f64]) -> f64 {
    // => the empty guard returns 0.0: division by zero never happens
    if values.is_empty() {
        return 0.0;
    }
    // => sum borrows the slice: the helper reads, the caller keeps ownership
    sum(values) / values.len() as f64
}

// median sorts a scratch copy and reads the middle of the ordered line.
// => cloning before sort keeps the caller's order untouched: no surprise
// => even counts average the two middle values: the textbook definition
pub fn median(values: &[f64]) -> f64 {
    // => empty input yields 0.0: consistent with mean's own guard above
    if values.is_empty() {
        return 0.0;
    }
    // => sort_scratch owns its copy: the original slice never moves
    let mut ordered = values.to_vec();
    sort_scratch(&mut ordered);
    // => mid splits the ordered line: odd reads one, even averages two
    let mid = ordered.len() / 2;
    if ordered.len() % 2 == 1 {
        // => odd counts have a true middle: index mid is the median
        ordered[mid]
    } else {
        // => even counts straddle: the mean of the two middle values
        (ordered[mid - 1] + ordered[mid]) / 2.0
    }
}

// variance averages the squared distance from the mean: spread in one number.
// => mean is reused, not recomputed inline: one definition, one behavior
// => empty input yields 0.0: the same guard convention as the siblings
pub fn variance(values: &[f64]) -> f64 {
    // => the guard mirrors mean and median: empty means 0.0 everywhere
    if values.is_empty() {
        return 0.0;
    }
    // => center once: every deviation below measures from this mean
    let center = mean(values);
    // => map to squared deviations, then average: the definition verbatim
    values
        .iter()
        .map(|value| (value - center).powi(2))
        .sum::<f64>()
        / values.len() as f64
}

// sum folds the slice: the private helper both siblings share.
// => private by omission: no pub means main.rs cannot name this at all
// => sum::<f64>() turbofish pins the fold type: inference needs the hint
fn sum(values: &[f64]) -> f64 {
    values.iter().sum()
}

// sort_scratch orders the private copy with total ordering for floats.
// => partial_cmp returns None for NaN: unwrap_or keeps a total order
// => Equal on NaN sorts them first: deterministic even with bad input
fn sort_scratch(values: &mut [f64]) -> &mut [f64] {
    // => sort_by with a total order: NaN sorts before every number
    values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    values
}
