// Example 15: Boxed Errors Across Functions.
// => `Box<dyn Error>` erases the concrete type: different errors, one signature.
// => `?` converts automatically through `From`, so each helper keeps its own error.
// => The caller below matches on the message; real code matches before boxing.
use std::error::Error; // => the `Error` trait the box carries
use std::num::ParseIntError; // => the parse helper's concrete error
                             // => This helper fails with the stdlib parse error, unboxed and precise.
fn parse_amount(raw: &str) -> Result<i32, ParseIntError> {
    // => concrete error
    raw.parse::<i32>() // => `ParseIntError` on bad digits
}
// => This helper fails with a plain message for out-of-range dues.
fn check_range(amount: i32) -> Result<i32, String> {
    // => a different error type
    if (1..=1000).contains(&amount) {
        // => dues live between 1 and 1000
        Ok(amount) // => in range: pass it along
    } else {
        Err(format!("out of range: {}", amount)) // => message error instead
    }
}
// => The box unifies both helpers: `?` converts each error on the way out.
fn settle(raw: &str) -> Result<i32, Box<dyn Error>> {
    // => one type for both
    let amount = parse_amount(raw)?; // => `ParseIntError` boxes here
    Ok(check_range(amount)?) // => `String` boxes here instead
}
fn main() {
    // => three fixed inputs: success, a parse failure, and a range failure.
    println!("{:?}", settle("50")); // => Output: Ok(50)
    println!("{:?}", settle("xyz").map_err(|e| e.to_string())); // => Err with the parse message
    println!("{:?}", settle("5000").map_err(|e| e.to_string())); // => Err("out of range: 5000")
}
