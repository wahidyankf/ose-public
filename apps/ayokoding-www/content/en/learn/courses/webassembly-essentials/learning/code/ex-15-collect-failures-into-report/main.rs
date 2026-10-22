// Example 15: Collect Failures into a Report.
//
// Stopping at the first error hides the other four; validating forms
// need every problem at once. Splitting one mixed list of Results into
// clean values and refusal reasons prints the full report in one pass.
// => partition_map would need a third-party crate: partition stays in std
// => values print first, then every failure: the report reads top-down

// check_score validates one score, refusing negatives and outliers.
// => i32 input admits below-zero values so the guard has work to do
// => the happy range 0..=100 returns the score unchanged for collection
fn check_score(score: i32) -> Result<i32, String> {
    // => the range guard names both edges: below 0 or above 100 refuses
    if !(0..=100).contains(&score) {
        return Err(format!("score {score} is outside 0..=100"));
    }
    Ok(score)
}

fn main() {
    // => seven candidates: four clean, three broken in different ways
    let candidates = [91, -4, 77, 104, 62, -1, 88];
    // => map every candidate to its Result, then split oks from errs
    let (passed, failed): (Vec<Result<i32, String>>, Vec<Result<i32, String>>) =
        // => into_iter moves the array: no borrow outlives this statement
        candidates.into_iter().map(check_score).partition(Result::is_ok);
    // NOTE: partition keeps Results whole on both sides; the maps below
    // open each side. Two passes read clearer than one clever fold here.
    // => filter_map with .ok() keeps only the passing scores, in order
    let passed: Vec<i32> = passed.into_iter().filter_map(Result::ok).collect();
    // => filter_map with .err() keeps only the refusal reasons, in order
    let failed: Vec<String> = failed.into_iter().filter_map(Result::err).collect();
    // => the clean scores print first: the report leads with good news
    println!("passed: {passed:?}");
    // => each refusal prints on its own line: every problem is visible
    for reason in failed {
        println!("refused: {reason}");
    }
}
