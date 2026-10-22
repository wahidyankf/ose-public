// Example 71: Read a Fold Pipeline in Layers.
// => LAYER 1, signatures: `total_of` takes lines and returns a `Result`.
// => LAYER 2, types: `i32` dues, `String` failures, slices borrowed throughout.
// => LAYER 3, control flow: one `filter_map` skips bad lines, `sum` finishes.
// => LAYER 4, data flow: text in, numbers out, skipped lines counted aside.
// => Read in that order and the pipeline explains itself top to bottom.
fn total_of(lines: &[&str]) -> (i32, usize) {
    // => signature: borrowed lines in, pair out
    let mut skipped = 0; // => the side count: bad lines tallied, not lost
    let mut total = 0; // => the running total of valid dues
    for line in lines {
        // => control flow: one pass, no nesting
        match line.split_once(':') {
            // => data flow: split first
            Some((_, raw)) => match raw.trim().parse::<i32>() {
                // => then parse
                Ok(amount) => total += amount, // => good values join the total
                Err(_) => skipped += 1,        // => bad amounts counted, loop continues
            },
            None => skipped += 1, // => shapeless lines counted too
        }
    }
    (total, skipped) // => both answers travel together
}
fn main() {
    // => three fixed lines: two dues and one malformed, totals 125 plus 1 skip.
    let (total, skipped) = total_of(&["sari:50", "oops", "budi:75"]); // => the whole pipeline
    println!("total: {}", total); // => Output: total: 125
    println!("skipped: {}", skipped); // => Output: skipped: 1
}
