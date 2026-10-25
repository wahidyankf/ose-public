// Example 5: Match Guards Order the Cases.
// => Arms are tried top to bottom; put the most specific case first.
// => A guard adds a condition to a pattern without nesting another `if`.
fn settle(amount: i32) -> &'static str {
    // => classification, no I/O inside
    // => The first matching arm wins: order is the business rule here.
    match amount {
        // => every arm below returns the same string type
        0 => "empty",           // => the specific case wins because it comes first
        n if n > 0 => "settle", // => guard: positive amounts settle
        _ => "refund",          // => the only remaining shape is negative
    }
}
// => Each call below is fixed, so every classification is fixed too.
fn main() {
    println!("0 -> {}", settle(0)); // => Output: 0 -> empty
    println!("50 -> {}", settle(50)); // => Output: 50 -> settle
    println!("-5 -> {}", settle(-5)); // => Output: -5 -> refund
}
