// Example 53: From and Into Conversions.
// => `From` is the one-way infallible conversion: `Into` arrives automatically.
// => `TryFrom` covers fallible conversions: validation lives in the type.
// => Generic `Into<String>` parameters accept `&str` and `String` alike.
// => Conversion traits keep parsing at the boundary: inner code trusts types.
// => `ledger_name` shows the generic bound: two input shapes, one function.
use std::convert::TryFrom; // => the fallible conversion trait
#[derive(Debug, PartialEq)] // => `Debug` prints, `PartialEq` compares
struct Due {
    // => a validated positive amount: invalid states unrepresentable
    amount: i32, // => always positive by construction below
}
// => `TryFrom<&str>` parses and validates: failures name the input.
impl TryFrom<&str> for Due {
    // => the error type is a plain message
    type Error = String; // => callers match on text here, variants later
    fn try_from(raw: &str) -> Result<Due, String> {
        // => parse plus validate
        let amount = raw // => the raw text under test
            .trim() // => padding never decides validity
            .parse::<i32>() // => digits parse; junk fails here
            .map_err(|_| format!("bad amount: {}", raw))?; // => names the input
        if amount <= 0 {
            // => the domain rule: dues stay positive
            return Err(format!("negative refused: {}", raw)); // => refused loudly
        }
        Ok(Due { amount }) // => validated: the type guarantees positivity
    }
}
// => `Into<String>` accepts borrowed and owned text with one signature.
fn ledger_name<N: Into<String>>(name: N) -> String {
    // => generic over the input shape
    format!("ledger: {}", name.into()) // => convert once, render once
}
fn main() {
    // => three conversions: a good due, junk, and a refused negative.
    println!("{:?}", Due::try_from("50")); // => Output: Ok(Due { amount: 50 })
    println!("{:?}", Due::try_from("xyz")); // => Output: Err("bad amount: xyz")
    println!("{:?}", Due::try_from("-5")); // => Output: Err("negative refused: -5")
    println!("{}", ledger_name("sari")); // => Output: ledger: sari
    println!("{}", ledger_name("budi".to_string())); // => Output: ledger: budi
}
