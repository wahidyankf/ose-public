// Example 10: Question Mark Propagates.
// => `?` unwraps `Ok` and returns `Err` early: match in one character.
// => The function must return a `Result` itself for `?` to have somewhere to go.
fn parse_due(text: &str) -> Result<i32, String> {
    // => same parser as before
    // => `map_err` keeps our string-error convention for every caller.
    text.parse::<i32>()
        .map_err(|_| format!("bad amount: {}", text)) // => Err names the input
}
// => `total_two` succeeds only when both dues parse: `?` enforces that.
// => Each `?` is a documented early exit: readers see the failure path inline.
fn total_two(a: &str, b: &str) -> Result<i32, String> {
    // => composes two parses
    let first = parse_due(a)?; // => Err here returns from `total_two` at once
    let second = parse_due(b)?; // => reached only when the first parsed
    Ok(first + second) // => both good: wrap the sum as success
}
fn main() {
    // => the good pair totals; the bad pair reports the first failure.
    match total_two("50", "25") {
        // => both parse: 75
        Ok(sum) => println!("sum: {}", sum), // => Output: sum: 75
        Err(why) => println!("fail: {}", why), // => not taken on this input
    }
    match total_two("50", "xyz") {
        // => the second parse fails
        Ok(sum) => println!("sum: {}", sum), // => not taken on this input
        Err(why) => println!("fail: {}", why), // => Output: fail: bad amount: xyz
    }
}
