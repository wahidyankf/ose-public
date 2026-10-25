// Example 17: Collect Short-Circuits on First Err.
// => `collect::<Result<Vec<_>, _>>()` turns many results into one result.
// => The first `Err` stops the collection: later items never even run.
// => This is the batch counterpart to `?`, which stops single call chains.
fn parse_due(text: &str) -> Result<i32, String> {
    // => the same string error
    text.parse::<i32>()
        .map_err(|_| format!("bad amount: {}", text)) // => Err names the input
}
fn main() {
    // => the middle amount is broken: collection must stop there.
    let mixed = ["50", "xyz", "25"]; // => good, bad, then never reached
    let first: Result<Vec<i32>, String> = mixed // => borrow the three texts
        .iter() // => stream them in order
        .map(|t| parse_due(t)) // => parse each into its own result
        .collect(); // => fuse into one result: Err wins immediately
    println!("{:?}", first); // => Output: Err("bad amount: xyz")
                             // => the clean batch collects every value with no failure to report.
    let clean = ["50", "75", "25"]; // => all three parse
    let second: Result<Vec<i32>, String> = clean // => same pipeline, clean input
        .iter() // => stream them in order
        .map(|t| parse_due(t)) // => every parse succeeds here
        .collect(); // => Ok of all three values
    println!("{:?}", second); // => Output: Ok([50, 75, 25])
}
