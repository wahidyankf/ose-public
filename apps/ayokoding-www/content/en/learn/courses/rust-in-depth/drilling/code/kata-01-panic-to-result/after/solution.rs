// Kata 01 After: `Result` keeps the run alive past bad lines.
// => Failures return as values: callers match instead of crashing.
// => The loop below totals the good dues and counts the skips honestly.
// => Same inputs as the starter: 50 settles, xyz skips, total 50.
fn due(raw: &str) -> Result<i32, String> {
    // => failure travels home safely
    raw.trim()
        .parse::<i32>()
        .map_err(|_| format!("bad amount: {}", raw)) // => names the input
}
fn main() {
    // => fixed inputs: one good due and one junk line, both handled.
    // => The verdicts below are fixed: 50 settles, xyz reports, nothing panics.
    let mut total = 0; // => sums only the dues that parse
    let mut skipped = 0; // => counts the lines that do not
    for raw in ["50", "xyz"] {
        // => good first, junk second
        match due(raw) {
            // => both arms handled at the call site
            Ok(amount) => total += amount, // => good dues join the total
            Err(why) => {
                // => junk reports and the loop continues
                // => The message names xyz: the operator knows which line failed.
                println!("skip: {}", why); // => Output: skip: bad amount: xyz
                skipped += 1; // => counted, never fatal
            }
        }
    }
    println!("total: {}", total); // => Output: total: 50
    println!("skipped: {}", skipped); // => Output: skipped: 1
}
