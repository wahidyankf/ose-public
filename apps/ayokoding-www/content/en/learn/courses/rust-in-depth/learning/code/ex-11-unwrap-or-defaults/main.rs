// Example 11: Unwrap Or Defaults.
// => `unwrap_or` trades the failure for a default: no match, no branch.
// => `unwrap_or_else` computes the default lazily, only when it is needed.
fn main() {
    // => an absent discount and a broken fee: both must default, not crash.
    let discount: Option<i32> = None; // => no discount was configured
    let fee: Result<i32, String> = "xyz"
        .parse::<i32>() // => broken input
        .map_err(|_| "bad fee".to_string()); // => Err, like a failed read
                                             // => `unwrap_or` picks the fallback without touching the failure value.
    println!("discount: {}", discount.unwrap_or(0)); // => Output: discount: 0
                                                     // => `unwrap_or_else` builds the fallback only on the failure path.
    println!("fee: {}", fee.unwrap_or_else(|_| 25)); // => Output: fee: 25
                                                     // => `is_none` and `is_err` still let callers ask about the shape first.
    println!("has discount: {}", discount.is_some()); // => Output: has discount: false
}
