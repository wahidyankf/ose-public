// Example 9: Result Instead of Exceptions.
// => `Result<T, E>` is a value: `Ok` carries success, `Err` carries failure.
// => Matching at the call site forces both paths to be handled, not hoped for.
fn parse_due(text: &str) -> Result<i32, String> {
    // => failure is data here
    // => `parse` already returns a `Result`; map its error into our string.
    text.parse::<i32>()
        .map_err(|_| format!("bad amount: {}", text)) // => Err names the input
}
fn main() {
    // => fixed inputs: one amount that parses and one that cannot.
    // => `mut` marks the accumulators: mutation is explicit, never hidden.
    let mut total = 0; // => the running total of valid dues
    let mut skipped = 0; // => counts failures without stopping the run
    for text in ["50", "xyz"] {
        // => first parses, second fails, every run
        match parse_due(text) {
            // => both outcomes handled right here
            Ok(amount) => total += amount, // => valid dues join the total
            Err(why) => {
                // => the failure value arrives with context
                println!("skip: {}", why); // => Output: skip: bad amount: xyz
                skipped += 1; // => counted, then the loop continues
            }
        }
    }
    // => the figures below are fixed: 50 parses, xyz is skipped once.
    println!("total: {}", total); // => Output: total: 50
    println!("skipped: {}", skipped); // => Output: skipped: 1
}
