// Example 14: Option Combinators.
// => Combinators transform inside the `Option`: no `match`, no unwrap.
// => `map` changes the value; `and_then` chains a fallible step; both skip `None`.
fn main() {
    // => a present nickname flows through all three stages below.
    let nick: Option<&str> = Some("  Bud  "); // => padded, mixed case
    let clean = nick // => the pipeline starts from the option itself
        .map(|s| s.trim()) // => stage one: trim the padding
        .filter(|s| !s.is_empty()) // => stage two: reject empties
        .map(|s| s.to_uppercase()); // => stage three: normalize the case
    println!("{:?}", clean); // => Output: Some("BUD")
                             // => a missing nickname skips every stage: nothing runs, nothing panics.
    let missing: Option<&str> = None; // => absent from the start
    let still_missing = missing // => the same three stages, all skipped
        .map(|s| s.trim()) // => never runs: the input is already `None`
        .filter(|s| !s.is_empty()) // => never runs either
        .map(|s| s.to_uppercase()); // => `None` flows straight through
    println!("{:?}", still_missing); // => Output: None
}
